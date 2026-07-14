import { type CivilDate, diffDays, daysInMonth, isLeapYear, addDays, addMonthsClamped } from './civilDate'
import { type LunarDateSpec, nextLunarOccurrence } from './lunar'

export type OccasionKind = 'anniversary' | 'since' | 'until'

/** 各类型天数的方向语义前缀，首页/详情/出图统一用这一份。 */
export const KIND_PREFIX: Record<OccasionKind, string> = {
  since: '已经',
  until: '还有',
  anniversary: '距下次',
}
export type LeapFallback = 'feb28' | 'mar1'

/** 把「锚点(可能是2/29)」落到目标年份的一个真实存在的日期。 */
export function anchorInYear(anchor: CivilDate, year: number, fb: LeapFallback): CivilDate {
  if (anchor.m === 2 && anchor.d === 29 && !isLeapYear(year)) {
    return fb === 'mar1' ? { y: year, m: 3, d: 1 } : { y: year, m: 2, d: 28 }
  }
  return { y: year, m: anchor.m, d: Math.min(anchor.d, daysInMonth(year, anchor.m)) }
}

/** 公历 anniversary 的下一次发生日：今年已过则明年，今天恰好到达算今年。 */
export function nextAnniversaryDateSolar(
  anchor: CivilDate,
  today: CivilDate,
  fb: LeapFallback,
): CivilDate {
  const thisYear = anchorInYear(anchor, today.y, fb)
  if (diffDays(today, thisYear) < 0) {
    return anchorInYear(anchor, today.y + 1, fb)
  }
  return thisYear
}

/**
 * 满周期截断（anchor-day 感知），与 date-fns differenceInMonths 同语义：
 * 只数「完整已满」的月数，不是简单的 (y2-y1)*12+(m2-m1)。
 */
export function completedMonths(from: CivilDate, to: CivilDate): number {
  if (diffDays(from, to) < 0) return -completedMonths(to, from)
  let months = (to.y - from.y) * 12 + (to.m - from.m)
  const anchorLandedDay = Math.min(from.d, daysInMonth(to.y, to.m))
  if (to.d < anchorLandedDay) months -= 1
  return months
}

export function completedYears(from: CivilDate, to: CivilDate): number {
  return Math.floor(completedMonths(from, to) / 12)
}

export interface OccasionState {
  daysBetween: number
  years: number
  months: number
  nextDate: CivilDate | null
  isToday: boolean
}

export interface OccasionInput {
  kind: OccasionKind
  date: CivilDate
  lunar?: LunarDateSpec | null
  leapFallback?: LeapFallback
}

export function computeOccasion(input: OccasionInput, today: CivilDate): OccasionState {
  const fb = input.leapFallback ?? 'feb28'

  if (input.kind === 'since') {
    const daysBetween = diffDays(input.date, today)
    return {
      daysBetween,
      years: completedYears(input.date, today),
      months: completedMonths(input.date, today),
      nextDate: null,
      isToday: daysBetween === 0,
    }
  }

  if (input.kind === 'until') {
    const daysBetween = diffDays(today, input.date)
    return {
      daysBetween,
      years: 0,
      months: 0,
      nextDate: input.date,
      isToday: daysBetween === 0,
    }
  }

  // kind === 'anniversary'
  if (input.lunar) {
    const next = nextLunarOccurrence(input.lunar, today)
    return {
      daysBetween: next ? diffDays(today, next) : Number.POSITIVE_INFINITY,
      years: completedYears(input.date, today),
      months: 0,
      nextDate: next,
      isToday: next ? diffDays(today, next) === 0 : false,
    }
  }
  const next = nextAnniversaryDateSolar(input.date, today, fb)
  const daysBetween = diffDays(today, next)
  return {
    daysBetween,
    years: completedYears(input.date, today),
    months: 0,
    nextDate: next,
    isToday: daysBetween === 0,
  }
}

export interface MilestoneConfig {
  hundreds?: boolean
  thousand?: boolean
  monthly?: boolean
  romantic?: boolean
  customDays?: number[]
}

export interface Milestone {
  key: string
  label: string
  date: CivilDate
  dayOffset: number | null
  achieved: boolean
  isToday: boolean
  isNext: boolean
}

/** 仅用于 kind='since'：起点 + 偏移天数展开为一串里程碑。 */
export function expandMilestones(
  start: CivilDate,
  config: MilestoneConfig,
  today: CivilDate,
  horizonDays = 366 * 60,
): Milestone[] {
  const raw: { key: string; label: string; dayOffset: number; date: CivilDate }[] = []

  const pushByOffset = (key: string, label: string, offset: number) => {
    if (offset <= 0 || offset > horizonDays) return
    raw.push({ key, label, dayOffset: offset, date: addDays(start, offset) })
  }

  if (config.hundreds) {
    for (let k = 1; k * 100 <= horizonDays; k++) pushByOffset(`d${k * 100}`, `${k * 100} 天`, k * 100)
  }
  if (config.thousand) pushByOffset('d1000', '1000 天', 1000)
  if (config.romantic) {
    pushByOffset('d520', '520 天', 520)
    pushByOffset('d1314', '1314 天', 1314)
  }
  if (config.monthly) {
    for (let k = 1; ; k++) {
      const date = addMonthsClamped(start, k)
      const offset = diffDays(start, date)
      if (offset > horizonDays) break
      if (offset > 0) raw.push({ key: `m${k}`, label: `${k} 个月`, dayOffset: offset, date })
    }
  }
  for (const n of config.customDays ?? []) pushByOffset(`c${n}`, `${n} 天`, n)

  const seen = new Set<string>()
  const deduped = raw
    .sort((a, b) => a.dayOffset - b.dayOffset)
    .filter((m) => {
      const dateKey = `${m.date.y}-${m.date.m}-${m.date.d}`
      if (seen.has(dateKey)) return false
      seen.add(dateKey)
      return true
    })

  const list: Milestone[] = deduped.map((m) => {
    const delta = diffDays(today, m.date)
    return { ...m, achieved: delta < 0, isToday: delta === 0, isNext: false }
  })
  const nextIndex = list.findIndex((m) => !m.achieved && !m.isToday)
  if (nextIndex >= 0) list[nextIndex].isNext = true
  else {
    const todayIndex = list.findIndex((m) => m.isToday)
    if (todayIndex >= 0) list[todayIndex].isNext = true
  }
  return list
}

/** anniversary 专属：周年 + 年龄自动生成，不读 milestones 配置字段。 */
export function expandAnniversaryMilestones(
  anchor: CivilDate,
  today: CivilDate,
  fb: LeapFallback,
  maxYears = 100,
): Milestone[] {
  const list: Milestone[] = []
  for (let n = 1; n <= maxYears; n++) {
    const date = anchorInYear(anchor, anchor.y + n, fb)
    const delta = diffDays(today, date)
    list.push({
      key: `y${n}`,
      label: `第 ${n} 周年`,
      date,
      dayOffset: null,
      achieved: delta < 0,
      isToday: delta === 0,
      isNext: false,
    })
  }
  const nextIndex = list.findIndex((m) => !m.achieved && !m.isToday)
  if (nextIndex >= 0) list[nextIndex].isNext = true
  else {
    const todayIndex = list.findIndex((m) => m.isToday)
    if (todayIndex >= 0) list[todayIndex].isNext = true
  }
  return list
}
