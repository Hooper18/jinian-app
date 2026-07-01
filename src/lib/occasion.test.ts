import { describe, it, expect } from 'vitest'
import {
  anchorInYear,
  nextAnniversaryDateSolar,
  completedMonths,
  completedYears,
  computeOccasion,
} from './occasion'

describe('anchorInYear', () => {
  it('普通日期直接落到目标年同月同日', () => {
    expect(anchorInYear({ y: 2020, m: 3, d: 15 }, 2026, 'feb28')).toEqual({ y: 2026, m: 3, d: 15 })
  })
  it('2/29 生日在平年按 feb28 回退', () => {
    expect(anchorInYear({ y: 2020, m: 2, d: 29 }, 2026, 'feb28')).toEqual({ y: 2026, m: 2, d: 28 })
  })
  it('2/29 生日在平年按 mar1 回退', () => {
    expect(anchorInYear({ y: 2020, m: 2, d: 29 }, 2026, 'mar1')).toEqual({ y: 2026, m: 3, d: 1 })
  })
  it('2/29 生日落在闰年不受回退规则影响', () => {
    expect(anchorInYear({ y: 2020, m: 2, d: 29 }, 2024, 'feb28')).toEqual({ y: 2024, m: 2, d: 29 })
  })
})

describe('nextAnniversaryDateSolar', () => {
  it('今年还没到 -> 返回今年', () => {
    const result = nextAnniversaryDateSolar(
      { y: 1995, m: 12, d: 25 },
      { y: 2026, m: 7, d: 1 },
      'feb28',
    )
    expect(result).toEqual({ y: 2026, m: 12, d: 25 })
  })
  it('今年已经过了 -> 返回明年', () => {
    const result = nextAnniversaryDateSolar(
      { y: 1995, m: 3, d: 10 },
      { y: 2026, m: 7, d: 1 },
      'feb28',
    )
    expect(result).toEqual({ y: 2027, m: 3, d: 10 })
  })
  it('就是今天 -> 返回今年（今天算"到达"不算"已过"）', () => {
    const result = nextAnniversaryDateSolar(
      { y: 1995, m: 7, d: 1 },
      { y: 2026, m: 7, d: 1 },
      'feb28',
    )
    expect(result).toEqual({ y: 2026, m: 7, d: 1 })
  })
})

describe('completedMonths', () => {
  it('2/15 到 3/14 还不满一个月 -> 0', () => {
    expect(completedMonths({ y: 2026, m: 2, d: 15 }, { y: 2026, m: 3, d: 14 })).toBe(0)
  })
  it('2/15 到 3/15 正好满一个月 -> 1', () => {
    expect(completedMonths({ y: 2026, m: 2, d: 15 }, { y: 2026, m: 3, d: 15 })).toBe(1)
  })
  it('1/31 起点，2月末视为满月边界（clamp 到2/28）', () => {
    expect(completedMonths({ y: 2026, m: 1, d: 31 }, { y: 2026, m: 2, d: 28 })).toBe(1)
  })
  it('同一天 -> 0', () => {
    const d = { y: 2026, m: 7, d: 1 }
    expect(completedMonths(d, d)).toBe(0)
  })
})

describe('completedYears', () => {
  it('不满一年 -> 0', () => {
    expect(completedYears({ y: 2023, m: 7, d: 10 }, { y: 2026, m: 7, d: 9 })).toBe(2)
  })
  it('正好满周年', () => {
    expect(completedYears({ y: 2023, m: 7, d: 10 }, { y: 2026, m: 7, d: 10 })).toBe(3)
  })
})

describe('computeOccasion — since', () => {
  it('已过天数为非负整数，today=起点当天时为0', () => {
    const state = computeOccasion(
      { kind: 'since', date: { y: 2023, m: 7, d: 10 } },
      { y: 2023, m: 7, d: 10 },
    )
    expect(state.daysBetween).toBe(0)
    expect(state.years).toBe(0)
    expect(state.nextDate).toBeNull()
    expect(state.isToday).toBe(true)
  })
  it('起点之后 N 天，daysBetween 与 years 正确', () => {
    const state = computeOccasion(
      { kind: 'since', date: { y: 2023, m: 7, d: 10 } },
      { y: 2026, m: 7, d: 9 },
    )
    expect(state.daysBetween).toBe(1095)
    expect(state.years).toBe(2)
    expect(state.isToday).toBe(false)
  })
})

describe('computeOccasion — until', () => {
  it('目标日在未来，daysBetween 为正', () => {
    const state = computeOccasion(
      { kind: 'until', date: { y: 2026, m: 9, d: 28 } },
      { y: 2026, m: 7, d: 1 },
    )
    expect(state.daysBetween).toBe(89)
    expect(state.nextDate).toEqual({ y: 2026, m: 9, d: 28 })
    expect(state.isToday).toBe(false)
  })
  it('目标日已过，daysBetween 为负（供上层归档判断）', () => {
    const state = computeOccasion(
      { kind: 'until', date: { y: 2026, m: 1, d: 1 } },
      { y: 2026, m: 7, d: 1 },
    )
    expect(state.daysBetween).toBeLessThan(0)
  })
  it('恰好是目标日当天，isToday 为 true', () => {
    const state = computeOccasion(
      { kind: 'until', date: { y: 2026, m: 7, d: 1 } },
      { y: 2026, m: 7, d: 1 },
    )
    expect(state.daysBetween).toBe(0)
    expect(state.isToday).toBe(true)
  })
})

describe('computeOccasion — anniversary（公历）', () => {
  it('距下次生日的天数与已满周岁正确', () => {
    const state = computeOccasion(
      { kind: 'anniversary', date: { y: 1995, m: 12, d: 25 }, leapFallback: 'feb28' },
      { y: 2026, m: 7, d: 1 },
    )
    expect(state.nextDate).toEqual({ y: 2026, m: 12, d: 25 })
    expect(state.daysBetween).toBeGreaterThan(0)
    expect(state.years).toBe(30)
  })
  it('2/29 生日在平年默认按 feb28 计算下次', () => {
    const state = computeOccasion(
      { kind: 'anniversary', date: { y: 2000, m: 2, d: 29 }, leapFallback: 'feb28' },
      { y: 2026, m: 3, d: 1 },
    )
    expect(state.nextDate).toEqual({ y: 2027, m: 2, d: 28 })
  })
  it('传入非空 lunar 但尚未接线时应抛错（占位行为，Task 9 会替换）', () => {
    expect(() =>
      computeOccasion(
        {
          kind: 'anniversary',
          date: { y: 2000, m: 6, d: 1 },
          lunar: { lunarMonth: 5, lunarDay: 8, isLeap: false },
        },
        { y: 2026, m: 7, d: 1 },
      ),
    ).toThrow()
  })
})
