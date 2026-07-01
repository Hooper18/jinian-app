import { type CivilDate, diffDays, daysInMonth, isLeapYear } from './civilDate'
import { type LunarDateSpec, nextLunarOccurrence } from './lunar'

export type OccasionKind = 'anniversary' | 'since' | 'until'
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
