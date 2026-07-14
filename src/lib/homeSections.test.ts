import { describe, it, expect } from 'vitest'
import { buildHomeSections } from './homeSections'
import type { OccasionRow } from '../types/occasion'

const TODAY = { y: 2026, m: 7, d: 15 }

function row(partial: Partial<OccasionRow> & Pick<OccasionRow, 'id' | 'kind' | 'date'>): OccasionRow {
  return {
    user_id: 'u1',
    title: partial.id,
    lunar: false,
    lunar_month: null,
    lunar_day: null,
    lunar_is_leap: false,
    cover_path: null,
    note: null,
    remind_days: [0],
    milestones: {},
    leap_fallback: 'feb28',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...partial,
  } as OccasionRow
}

describe('buildHomeSections', () => {
  it('过期 until 进回忆区，按日期新→旧排', () => {
    const s = buildHomeSections(
      [
        row({ id: 'old', kind: 'until', date: '2026-06-01' }),
        row({ id: 'recent', kind: 'until', date: '2026-07-01' }),
        row({ id: 'future', kind: 'until', date: '2026-07-20' }),
      ],
      TODAY,
    )
    expect(s.memories.map((o) => o.id)).toEqual(['recent', 'old'])
  })

  it('将至=until+anniversary 按剩余天数升序；陪伴=since 按已过天数降序', () => {
    const s = buildHomeSections(
      [
        row({ id: 'anniv-far', kind: 'anniversary', date: '2020-08-14' }), // 30 天后
        row({ id: 'until-near', kind: 'until', date: '2026-07-20' }), // 5 天后
        row({ id: 'since-young', kind: 'since', date: '2026-07-01' }),
        row({ id: 'since-old', kind: 'since', date: '2023-10-11' }),
      ],
      TODAY,
    )
    // hero 是最近将至的 until-near，被从将至段移除
    expect(s.hero?.id).toBe('until-near')
    expect(s.upcoming.map((o) => o.id)).toEqual(['anniv-far'])
    expect(s.companions.map((o) => o.id)).toEqual(['since-old', 'since-young'])
  })

  it('今天正日子优先当 hero，即使有更「近」的将至', () => {
    const s = buildHomeSections(
      [
        row({ id: 'tomorrow', kind: 'until', date: '2026-07-16' }),
        row({ id: 'today-anniv', kind: 'anniversary', date: '2020-07-15' }),
      ],
      TODAY,
    )
    expect(s.hero?.id).toBe('today-anniv')
    expect(s.heroIsToday).toBe(true)
    expect(s.upcoming.map((o) => o.id)).toEqual(['tomorrow'])
  })

  it('只有 since 时，陪伴最久的当 hero', () => {
    const s = buildHomeSections(
      [
        row({ id: 'since-young', kind: 'since', date: '2026-07-01' }),
        row({ id: 'since-old', kind: 'since', date: '2023-10-11' }),
      ],
      TODAY,
    )
    expect(s.hero?.id).toBe('since-old')
    expect(s.heroIsToday).toBe(false)
    expect(s.companions.map((o) => o.id)).toEqual(['since-young'])
  })

  it('近年无对应的农历纪念日不抢 hero，垫在将至段末尾', () => {
    const s = buildHomeSections(
      [
        row({
          id: 'leap',
          kind: 'anniversary',
          date: '2000-06-15',
          lunar: true,
          lunar_month: 4,
          lunar_day: 30,
          lunar_is_leap: true,
        }),
        row({ id: 'normal', kind: 'until', date: '2026-07-20' }),
      ],
      TODAY,
    )
    expect(s.hero?.id).toBe('normal')
    expect(s.upcoming.map((o) => o.id)).toEqual(['leap'])
  })

  it('全空时 hero 为 null、各段为空', () => {
    const s = buildHomeSections([], TODAY)
    expect(s.hero).toBeNull()
    expect(s.upcoming).toEqual([])
    expect(s.companions).toEqual([])
    expect(s.memories).toEqual([])
  })
})
