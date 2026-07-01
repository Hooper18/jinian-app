import { describe, it, expect } from 'vitest'
import { lunarToSolarInYear, nextLunarOccurrence } from './lunar'

describe('lunarToSolarInYear', () => {
  it('普通农历日期在目标公历年恰好命中1次（2026年中秋，农历八月十五）', () => {
    const result = lunarToSolarInYear({ lunarMonth: 8, lunarDay: 15, isLeap: false }, 2026)
    expect(result).toEqual([{ y: 2026, m: 9, d: 25 }])
  })
  it('农历十二月初一在2024年一年命中2次', () => {
    const result = lunarToSolarInYear({ lunarMonth: 12, lunarDay: 1, isLeap: false }, 2024)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ y: 2024, m: 1, d: 11 })
    expect(result[1]).toEqual({ y: 2024, m: 12, d: 31 })
  })
  it('2024年无闰二月，命中0次', () => {
    const result = lunarToSolarInYear({ lunarMonth: 2, lunarDay: 1, isLeap: true }, 2024)
    expect(result).toEqual([])
  })
  it('农历九月只有29天，九月三十不存在，命中0次', () => {
    const result = lunarToSolarInYear({ lunarMonth: 9, lunarDay: 30, isLeap: false }, 2024)
    expect(result).toEqual([])
  })
  it('返回结果按升序排列', () => {
    const result = lunarToSolarInYear({ lunarMonth: 12, lunarDay: 1, isLeap: false }, 2024)
    expect(result[0].m).toBeLessThan(result[1].m)
  })
})

describe('nextLunarOccurrence', () => {
  it('从今天起找到最近一次命中（未来）', () => {
    const result = nextLunarOccurrence(
      { lunarMonth: 8, lunarDay: 15, isLeap: false },
      { y: 2026, m: 1, d: 1 },
    )
    expect(result).toEqual({ y: 2026, m: 9, d: 25 })
  })
  it('今年已过，返回明年的对应日期', () => {
    const result = nextLunarOccurrence(
      { lunarMonth: 1, lunarDay: 1, isLeap: false },
      { y: 2026, m: 7, d: 1 },
    )
    expect(result).not.toBeNull()
    expect(result!.y).toBeGreaterThanOrEqual(2027)
  })
  it('闰月纪念日窗口内无对应时返回 null', () => {
    // 闰二月上一次是2023年，下一次是2042年；从2026年起搜索5年窗口应该找不到
    const result = nextLunarOccurrence(
      { lunarMonth: 2, lunarDay: 1, isLeap: true },
      { y: 2026, m: 1, d: 1 },
      5,
    )
    expect(result).toBeNull()
  })
  it('闰月纪念日给足25年窗口能找到', () => {
    const result = nextLunarOccurrence(
      { lunarMonth: 2, lunarDay: 1, isLeap: true },
      { y: 2026, m: 1, d: 1 },
      25,
    )
    expect(result).not.toBeNull()
  })
})
