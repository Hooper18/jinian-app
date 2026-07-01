import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OccasionDetail from './OccasionDetail'

const sinceRow = {
  id: 'occ-2',
  user_id: 'u1',
  kind: 'since',
  title: '和 A 在一起',
  date: '2023-07-10',
  lunar: false,
  lunar_month: null,
  lunar_day: null,
  lunar_is_leap: false,
  cover_path: null,
  note: '从图书馆那次算起。',
  remind_days: [0, 1],
  milestones: { hundreds: true, thousand: true },
  leap_fallback: 'feb28',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

vi.mock('../hooks/useOccasions', () => ({
  useOccasions: () => ({ occasions: [sinceRow], loading: false, error: null, deleteOccasion: vi.fn() }),
}))

function renderDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/occasion/${id}`]}>
      <Routes>
        <Route path="/occasion/:id" element={<OccasionDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OccasionDetail 详情页', () => {
  it('渲染标题、笔记文字', () => {
    renderDetail('occ-2')
    expect(screen.getByText('和 A 在一起')).toBeInTheDocument()
    expect(screen.getByText('从图书馆那次算起。')).toBeInTheDocument()
  })

  it('since 类型显示里程碑区', () => {
    renderDetail('occ-2')
    expect(screen.getByTestId('milestone-section')).toBeInTheDocument()
  })

  it('until 类型不显示里程碑区', () => {
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({
        occasions: [{ ...sinceRow, id: 'occ-3', kind: 'until', milestones: {} }],
        loading: false,
        error: null,
        deleteOccasion: vi.fn(),
      }),
    }))
  })
})

describe('OccasionDetail — until 无里程碑区', () => {
  it('until 类型不渲染里程碑区', async () => {
    vi.resetModules()
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({
        occasions: [{ ...sinceRow, id: 'occ-3', kind: 'until', milestones: {} }],
        loading: false,
        error: null,
        deleteOccasion: vi.fn(),
      }),
    }))
    const { default: FreshDetail } = await import('./OccasionDetail')
    render(
      <MemoryRouter initialEntries={['/occasion/occ-3']}>
        <Routes>
          <Route path="/occasion/:id" element={<FreshDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('milestone-section')).not.toBeInTheDocument()
  })
})
