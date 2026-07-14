import { computeOccasion, type OccasionState } from './occasion'
import { parseCivilDate, type CivilDate } from './civilDate'
import type { OccasionRow } from '../types/occasion'

export interface HomeSections {
  /** 首屏大卡：今天正日子 > 最近将至 > 陪伴最久；全空为 null。 */
  hero: OccasionRow | null
  /** hero 是否是「今天正日子」（until/anniversary 恰逢当天）。 */
  heroIsToday: boolean
  /** 将至：未过期 until + 全部 anniversary，剩余天数升序（无对应垫底）。不含 hero。 */
  upcoming: OccasionRow[]
  /** 陪伴：since，已过天数降序（陪伴最久在上）。不含 hero。 */
  companions: OccasionRow[]
  /** 回忆：已过期的 until，按日期新→旧。 */
  memories: OccasionRow[]
}

export function stateOf(row: OccasionRow, today: CivilDate): OccasionState {
  return computeOccasion(
    {
      kind: row.kind,
      date: parseCivilDate(row.date),
      lunar: row.lunar
        ? { lunarMonth: row.lunar_month!, lunarDay: row.lunar_day!, isLeap: row.lunar_is_leap }
        : null,
      leapFallback: row.leap_fallback,
    },
    today,
  )
}

/** 25 年窗口内无对应发生日（如极罕见闰月纪念日）。 */
export function isUnresolved(state: OccasionState): boolean {
  return state.nextDate === null && !Number.isFinite(state.daysBetween)
}

/**
 * 首页分段：since 的天数是流逝量（越久越大）、until/anniversary 是剩余量
 * （越近越小），两者语义不可比，必须分段各排各的，不能混进一个排序。
 */
export function buildHomeSections(occasions: OccasionRow[], today: CivilDate): HomeSections {
  const states = new Map<string, OccasionState>()
  for (const o of occasions) states.set(o.id, stateOf(o, today))
  const st = (o: OccasionRow) => states.get(o.id)!

  const memories = occasions
    .filter((o) => o.kind === 'until' && st(o).daysBetween < 0)
    .sort((a, b) => b.date.localeCompare(a.date))

  const upcoming = occasions
    .filter(
      (o) =>
        o.kind === 'anniversary' || (o.kind === 'until' && st(o).daysBetween >= 0),
    )
    .sort((a, b) => {
      const ka = Number.isFinite(st(a).daysBetween) ? st(a).daysBetween : Number.MAX_SAFE_INTEGER
      const kb = Number.isFinite(st(b).daysBetween) ? st(b).daysBetween : Number.MAX_SAFE_INTEGER
      return ka - kb
    })

  const companions = occasions
    .filter((o) => o.kind === 'since')
    .sort((a, b) => st(b).daysBetween - st(a).daysBetween)

  // hero：今天正日子 > 最近将至（须有限） > 陪伴最久
  let hero: OccasionRow | null = null
  let heroIsToday = false
  const todayHit = upcoming.find((o) => st(o).daysBetween === 0)
  if (todayHit) {
    hero = todayHit
    heroIsToday = true
  } else if (upcoming.length > 0 && Number.isFinite(st(upcoming[0]).daysBetween)) {
    hero = upcoming[0]
  } else if (companions.length > 0) {
    hero = companions[0]
  } else if (upcoming.length > 0) {
    hero = upcoming[0]
  }

  return {
    hero,
    heroIsToday,
    upcoming: upcoming.filter((o) => o !== hero),
    companions: companions.filter((o) => o !== hero),
    memories,
  }
}
