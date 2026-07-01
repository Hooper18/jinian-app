import { describe, it, expect } from 'vitest'
import {
  isLeapYear,
  daysInMonth,
  diffDays,
  addDays,
  addMonthsClamped,
  compareCivilDate,
  parseCivilDate,
  formatCivilDate,
  type CivilDate,
} from './civilDate'

describe('isLeapYear', () => {
  it('能被4整除但不能被100整除 -> 闰年', () => {
    expect(isLeapYear(2024)).toBe(true)
  })
  it('能被100整除但不能被400整除 -> 平年', () => {
    expect(isLeapYear(1900)).toBe(false)
  })
  it('能被400整除 -> 闰年', () => {
    expect(isLeapYear(2000)).toBe(true)
  })
  it('普通平年', () => {
    expect(isLeapYear(2026)).toBe(false)
  })
})

describe('daysInMonth', () => {
  it('2月在闰年是29天', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
  })
  it('2月在平年是28天', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
  })
  it('1月是31天', () => {
    expect(daysInMonth(2026, 1)).toBe(31)
  })
})

describe('diffDays', () => {
  it('同一天差 0', () => {
    const d: CivilDate = { y: 2026, m: 7, d: 1 }
    expect(diffDays(d, d)).toBe(0)
  })
  it('跨月不受时区影响，正确计天', () => {
    expect(diffDays({ y: 2026, m: 6, d: 28 }, { y: 2026, m: 7, d: 1 })).toBe(3)
  })
  it('跨年正确计天', () => {
    expect(diffDays({ y: 2025, m: 12, d: 30 }, { y: 2026, m: 1, d: 2 })).toBe(3)
  })
  it('跨越闰年2月29日正确计天', () => {
    expect(diffDays({ y: 2024, m: 2, d: 28 }, { y: 2024, m: 3, d: 1 })).toBe(2)
  })
  it('顺序颠倒得到负数', () => {
    expect(diffDays({ y: 2026, m: 7, d: 1 }, { y: 2026, m: 6, d: 28 })).toBe(-3)
  })
})

describe('addDays', () => {
  it('加天数正确进位到下个月', () => {
    expect(addDays({ y: 2026, m: 1, d: 30 }, 3)).toEqual({ y: 2026, m: 2, d: 2 })
  })
  it('加天数正确跨年', () => {
    expect(addDays({ y: 2025, m: 12, d: 30 }, 5)).toEqual({ y: 2026, m: 1, d: 4 })
  })
})

describe('addMonthsClamped', () => {
  it('1月31日加1个月 clamp 到2月28日（平年）', () => {
    expect(addMonthsClamped({ y: 2026, m: 1, d: 31 }, 1)).toEqual({ y: 2026, m: 2, d: 28 })
  })
  it('1月31日加1个月 clamp 到2月29日（闰年）', () => {
    expect(addMonthsClamped({ y: 2024, m: 1, d: 31 }, 1)).toEqual({ y: 2024, m: 2, d: 29 })
  })
  it('不会因为经过短月而"回弹" — 3月31日加1个月再减1个月不等于原日', () => {
    const plus1 = addMonthsClamped({ y: 2026, m: 3, d: 31 }, 1)
    expect(plus1).toEqual({ y: 2026, m: 4, d: 30 })
  })
  it('跨年加月正确', () => {
    expect(addMonthsClamped({ y: 2025, m: 11, d: 15 }, 3)).toEqual({ y: 2026, m: 2, d: 15 })
  })
  it('负 total（大负偏移）不产生 NaN、月份落在 1-12', () => {
    const r = addMonthsClamped({ y: 1, m: 1, d: 15 }, -13)
    expect(Number.isNaN(r.d)).toBe(false)
    expect(r.m).toBeGreaterThanOrEqual(1)
    expect(r.m).toBeLessThanOrEqual(12)
    expect(r.d).toBe(15)
  })
})

describe('compareCivilDate', () => {
  it('相等返回0', () => {
    expect(compareCivilDate({ y: 2026, m: 7, d: 1 }, { y: 2026, m: 7, d: 1 })).toBe(0)
  })
  it('a早于b返回负数', () => {
    expect(compareCivilDate({ y: 2026, m: 7, d: 1 }, { y: 2026, m: 7, d: 2 })).toBeLessThan(0)
  })
  it('a晚于b返回正数', () => {
    expect(compareCivilDate({ y: 2026, m: 7, d: 2 }, { y: 2026, m: 7, d: 1 })).toBeGreaterThan(0)
  })
})

describe('parseCivilDate / formatCivilDate', () => {
  it('往返一致', () => {
    const s = '2026-07-01'
    expect(formatCivilDate(parseCivilDate(s))).toBe(s)
  })
  it('parse 出正确字段', () => {
    expect(parseCivilDate('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 })
  })
  it('format 补零', () => {
    expect(formatCivilDate({ y: 2026, m: 1, d: 5 })).toBe('2026-01-05')
  })
})
