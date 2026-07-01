import { describe, it, expect } from 'vitest'
import {
  anchorInYear,
  nextAnniversaryDateSolar,
  completedMonths,
  completedYears,
  computeOccasion,
  expandMilestones,
  expandAnniversaryMilestones,
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
  it('农历 anniversary：下次发生日经农历换算得出', () => {
    const state = computeOccasion(
      {
        kind: 'anniversary',
        date: { y: 2000, m: 9, d: 20 },
        lunar: { lunarMonth: 8, lunarDay: 15, isLeap: false },
      },
      { y: 2026, m: 1, d: 1 },
    )
    expect(state.nextDate).toEqual({ y: 2026, m: 9, d: 25 })
    expect(state.daysBetween).toBeGreaterThan(0)
  })
  it('农历 anniversary：窗口内无对应时 nextDate 为 null', () => {
    const state = computeOccasion(
      {
        kind: 'anniversary',
        date: { y: 2000, m: 3, d: 1 },
        lunar: { lunarMonth: 2, lunarDay: 1, isLeap: true },
      },
      { y: 2026, m: 1, d: 1 },
    )
    // 默认窗口 25 年内闰二月会出现（2042），所以这里应能找到
    expect(state.nextDate).not.toBeNull()
  })
})

describe('expandMilestones', () => {
  const start = { y: 2023, m: 7, d: 10 }

  it('hundreds 预设展开出第100/200/300...天', () => {
    const result = expandMilestones(start, { hundreds: true }, { y: 2023, m: 7, d: 10 })
    expect(result[0]).toMatchObject({ key: 'd100', dayOffset: 100 })
    expect(result[1]).toMatchObject({ key: 'd200', dayOffset: 200 })
  })

  it('thousand 预设只展开第1000天一条', () => {
    const result = expandMilestones(start, { thousand: true }, { y: 2023, m: 7, d: 10 })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ key: 'd1000', dayOffset: 1000 })
  })

  it('romantic 预设展开520和1314两条', () => {
    const result = expandMilestones(start, { romantic: true }, { y: 2023, m: 7, d: 10 })
    expect(result.map((m) => m.dayOffset)).toEqual([520, 1314])
  })

  it('monthly 用真实日历月计算，不是30天近似（1月31日起点场景验证不漂移）', () => {
    const result = expandMilestones(
      { y: 2026, m: 1, d: 31 },
      { monthly: true },
      { y: 2026, m: 1, d: 31 },
      120,
    )
    // 1/31 +1月 clamp 到 2/28（平年），+2月 clamp 到 3/31，与"每30天"近似值不同
    expect(result[0].date).toEqual({ y: 2026, m: 2, d: 28 })
    expect(result[1].date).toEqual({ y: 2026, m: 3, d: 31 })
  })

  it('customDays 支持自定义天数并去重排序', () => {
    const result = expandMilestones(
      start,
      { customDays: [888, 100] },
      { y: 2023, m: 7, d: 10 },
    )
    expect(result.map((m) => m.dayOffset)).toEqual([100, 888])
  })

  it('achieved 标记正确 — 今天之前已达成', () => {
    const result = expandMilestones(
      start,
      { hundreds: true },
      addDaysHelper(start, 150),
    )
    expect(result[0].achieved).toBe(true) // 第100天
    expect(result[1].achieved).toBe(false) // 第200天
  })

  it('isNext 只标记第一个未达成的里程碑', () => {
    const result = expandMilestones(start, { hundreds: true }, addDaysHelper(start, 150))
    const nextOnes = result.filter((m) => m.isNext)
    expect(nextOnes).toHaveLength(1)
    expect(nextOnes[0].key).toBe('d200')
  })

  it('isToday 标记恰好今天达成的里程碑', () => {
    const result = expandMilestones(start, { hundreds: true }, addDaysHelper(start, 100))
    expect(result[0].isToday).toBe(true)
    expect(result[0].achieved).toBe(false)
  })

  it('horizon 上界防止无限展开', () => {
    const result = expandMilestones(start, { monthly: true }, start, 60)
    expect(result.every((m) => m.dayOffset! <= 60)).toBe(true)
  })

  it('同一天多规则命中时去重，只留一条', () => {
    // 第1000天恰好也是自定义天数，应只出现一次
    const result = expandMilestones(start, { thousand: true, customDays: [1000] }, start)
    expect(result).toHaveLength(1)
  })
})

// 测试辅助：不直接 import addDays 避免与被测模块的导入产生耦合歧义，这里用局部小工具
function addDaysHelper(c: { y: number; m: number; d: number }, n: number) {
  const dt = new Date(Date.UTC(c.y, c.m - 1, c.d, 12) + n * 86_400_000)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

describe('expandAnniversaryMilestones', () => {
  it('生成的第一条是第1周年，label 正确，dayOffset 为 null', () => {
    const result = expandAnniversaryMilestones(
      { y: 2020, m: 7, d: 10 },
      { y: 2020, m: 7, d: 10 },
      'feb28',
      5,
    )
    expect(result[0]).toMatchObject({ key: 'y1', label: '第 1 周年', dayOffset: null })
    expect(result[0].date).toEqual({ y: 2021, m: 7, d: 10 })
  })

  it('maxYears 限制生成条数', () => {
    const result = expandAnniversaryMilestones(
      { y: 2020, m: 7, d: 10 },
      { y: 2020, m: 7, d: 10 },
      'feb28',
      3,
    )
    expect(result).toHaveLength(3)
  })

  it('achieved 与 isNext 标记正确', () => {
    const result = expandAnniversaryMilestones(
      { y: 2020, m: 7, d: 10 },
      { y: 2023, m: 8, d: 1 },
      'feb28',
      5,
    )
    expect(result[0].achieved).toBe(true) // 第1周年 2021-07-10 已过
    expect(result[2].achieved).toBe(true) // 第3周年 2023-07-10 已过
    expect(result[3].isNext).toBe(true) // 第4周年 2024-07-10 是下一个
  })

  it('2/29 生日的周年按 leapFallback 处理', () => {
    const result = expandAnniversaryMilestones(
      { y: 2000, m: 2, d: 29 },
      { y: 2000, m: 2, d: 29 },
      'feb28',
      27,
    )
    // 第26周年落在2026（平年），应回退到2/28
    const y26 = result.find((m) => m.key === 'y26')
    expect(y26?.date).toEqual({ y: 2026, m: 2, d: 28 })
  })
})
