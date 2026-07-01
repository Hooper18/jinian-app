import { describe, it, expect } from 'vitest'
import { computeReminderTimes } from './reminders'
import type { OccasionRow } from '../types/occasion'

function makeRow(overrides: Partial<OccasionRow>): OccasionRow {
  return {
    id: 'test-id-1',
    user_id: 'user-1',
    kind: 'until',
    title: '测试事件',
    date: '2026-09-28',
    lunar: false,
    lunar_month: null,
    lunar_day: null,
    lunar_is_leap: false,
    cover_path: null,
    note: null,
    remind_days: [0, 1],
    milestones: {},
    leap_fallback: 'feb28',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeReminderTimes', () => {
  it('until 类型：为每个 remind_days 偏移生成一条提醒，时刻为当天09:00', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const result = computeReminderTimes([makeRow({ remind_days: [0, 1] })], today, now)
    expect(result).toHaveLength(2)
    // remind_days=1 -> 提前1天，9/27 09:00 CST；remind_days=0 -> 当天 9/28 09:00 CST
    const sorted = [...result].sort((a, b) => a.at.getTime() - b.at.getTime())
    expect(sorted[0].at.toISOString()).toBe('2026-09-27T01:00:00.000Z')
    expect(sorted[1].at.toISOString()).toBe('2026-09-28T01:00:00.000Z')
  })

  it('过滤掉已经过去的提醒时刻', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const result = computeReminderTimes(
      [makeRow({ kind: 'until', date: '2026-01-01', remind_days: [0] })],
      today,
      now,
    )
    expect(result).toHaveLength(0)
  })

  it('anniversary 公历：为下次发生日生成提醒', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const result = computeReminderTimes(
      [makeRow({ kind: 'anniversary', date: '1995-12-25', remind_days: [0] })],
      today,
      now,
    )
    expect(result).toHaveLength(1)
    expect(result[0].at.toISOString()).toBe('2026-12-25T01:00:00.000Z')
  })

  it('since 里程碑：isNext 里程碑生成提醒', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const result = computeReminderTimes(
      [
        makeRow({
          kind: 'since',
          date: '2023-07-10',
          remind_days: [0],
          milestones: { hundreds: true },
        }),
      ],
      today,
      now,
    )
    expect(result.length).toBeGreaterThan(0)
  })

  it('按时间升序排列', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const result = computeReminderTimes(
      [
        makeRow({ id: 'a', date: '2026-12-25' }),
        makeRow({ id: 'b', date: '2026-08-01' }),
      ],
      today,
      now,
    )
    for (let i = 1; i < result.length; i++) {
      expect(result[i].at.getTime()).toBeGreaterThanOrEqual(result[i - 1].at.getTime())
    }
  })

  it('截断到 maxItems（默认64条，测试用较小值验证逻辑）', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const rows = Array.from({ length: 10 }, (_, i) =>
      makeRow({ id: `id-${i}`, date: `2026-08-${String(i + 1).padStart(2, '0')}` }),
    )
    const result = computeReminderTimes(rows, today, now, 3)
    expect(result).toHaveLength(3)
  })

  it('id 字段是稳定的32位整数（同输入多次调用得到相同id）', () => {
    const today = { y: 2026, m: 7, d: 1 }
    const now = new Date('2026-07-01T08:00:00+08:00')
    const row = makeRow({ id: 'stable-id-x' })
    const r1 = computeReminderTimes([row], today, now)
    const r2 = computeReminderTimes([row], today, now)
    expect(r1[0].id).toBe(r2[0].id)
    expect(Number.isInteger(r1[0].id)).toBe(true)
  })
})
