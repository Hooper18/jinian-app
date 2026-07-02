import { describe, it, expect } from 'vitest'
import { buildCardContent } from './shareCard'
import type { OccasionRow } from '../types/occasion'
import type { OccasionState } from './occasion'

function mkRow(over: Partial<OccasionRow>): OccasionRow {
  return {
    id: 'o1',
    user_id: 'u1',
    kind: 'anniversary',
    title: '生日',
    date: '2000-05-20',
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
    ...over,
  } as OccasionRow
}

function st(over: Partial<OccasionState>): OccasionState {
  return { daysBetween: 0, years: 0, months: 0, nextDate: null, isToday: false, ...over }
}

describe('buildCardContent', () => {
  it('anniversary → 距下次 N 天 + 公历日期', () => {
    const c = buildCardContent(
      mkRow({ kind: 'anniversary', title: '生日', date: '2000-05-20' }),
      st({ daysBetween: 14, nextDate: { y: 2026, m: 7, d: 16 } }),
    )
    expect(c).toMatchObject({ prefix: '距下次', bigText: '14', unit: '天', title: '生日' })
    expect(c.dateLabel).toBe('2000-05-20')
  })

  it('since(nextDate 恒 null)不算无对应 → 已经 N 天', () => {
    const c = buildCardContent(
      mkRow({ kind: 'since', title: '在一起' }),
      st({ daysBetween: 1200, nextDate: null }),
    )
    expect(c).toMatchObject({ prefix: '已经', bigText: '1200', unit: '天' })
  })

  it('until → 还有 N 天（取绝对值）', () => {
    const c = buildCardContent(
      mkRow({ kind: 'until', title: '考试' }),
      st({ daysBetween: 30, nextDate: { y: 2026, m: 8, d: 1 } }),
    )
    expect(c).toMatchObject({ prefix: '还有', bigText: '30', unit: '天' })
  })

  it('农历周年近年无对应 → 近年无对应、无前缀无单位', () => {
    const c = buildCardContent(
      mkRow({ kind: 'anniversary', lunar: true, lunar_month: 4, lunar_day: 30, lunar_is_leap: true }),
      st({ daysBetween: Number.POSITIVE_INFINITY, nextDate: null }),
    )
    expect(c).toMatchObject({ prefix: '', bigText: '近年无对应', unit: '' })
  })
})
