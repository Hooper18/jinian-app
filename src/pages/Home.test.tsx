import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

const mockOccasions = [
  {
    id: 'occ-1',
    user_id: 'u1',
    kind: 'until',
    title: '婚礼',
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
  },
  {
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
    note: null,
    remind_days: [0],
    milestones: { hundreds: true },
    leap_fallback: 'feb28',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'occ-anniv',
    user_id: 'u1',
    kind: 'anniversary',
    title: '奶奶生日',
    date: '2020-03-05',
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
  },
]

vi.mock('../hooks/useOccasions', () => ({
  useOccasions: () => ({ occasions: mockOccasions, loading: false, error: null }),
}))

describe('Home 首页', () => {
  it('渲染提醒设置入口，链接到 /notification-guide', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    const link = screen.getByLabelText('提醒设置')
    expect(link).toHaveAttribute('href', '/notification-guide')
  })

  it('渲染设置入口，链接到 /settings', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('设置')).toHaveAttribute('href', '/settings')
  })

  it('渲染出全部日子的标题', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByText('婚礼')).toBeInTheDocument()
    expect(screen.getByText('和 A 在一起')).toBeInTheDocument()
  })

  it('最近的日子出现在顶部大卡（第一个渲染位置）', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    const titles = screen.getAllByTestId('occasion-title').map((el) => el.textContent)
    expect(titles[0]).toBe('婚礼')
  })

  it('列表行带方向语义：since 行显示「已经」、anniversary 行显示「距下次」', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    const sinceRow = screen.getByText('和 A 在一起').closest('a')
    expect(sinceRow!.textContent).toMatch(/已经\s*\d+\s*天/)
    const annivRow = screen.getByText('奶奶生日').closest('a')
    expect(annivRow!.textContent).toMatch(/距下次\s*\d+\s*天/)
  })

  it('hero 大卡带方向语义：until 显示「还有」', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    const heroCard = screen.getByText('婚礼').closest('a')
    expect(heroCard!.textContent).toMatch(/还有\s*\d+\s*天/)
  })

  it('since 场次（nextDate 恒为 null）显示天数而不是「近年无对应」', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    const row = screen.getByText('和 A 在一起').closest('a')
    expect(row).not.toBeNull()
    expect(row!.textContent).toMatch(/\d+\s*天/)
    expect(row!.textContent).not.toMatch(/近年无对应/)
    expect(screen.queryByText('近年无对应')).not.toBeInTheDocument()
  })

  it('无日子时显示空态引导', () => {
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({ occasions: [], loading: false, error: null }),
    }))
  })
})

describe('Home 首页 — 空态', () => {
  it('occasions 为空数组时显示引导文案', async () => {
    vi.resetModules()
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({ occasions: [], loading: false, error: null }),
    }))
    const { default: HomeEmpty } = await import('./Home')
    render(
      <MemoryRouter>
        <HomeEmpty />
      </MemoryRouter>,
    )
    expect(screen.getByText(/记下第一个重要的日子/)).toBeInTheDocument()
  })
})

describe('Home 首页 — 农历周年无对应窗口内命中', () => {
  it('nextDate 为 null / daysBetween 为 Infinity 时显示「近年无对应」而不是 Infinity', async () => {
    vi.resetModules()
    // 一个 25 年窗口内找不到下一次出现的农历闰月纪念日（构造上不依赖真实历法，
    // 直接 mock useOccasions 返回会触发 computeOccasion 走 lunar 分支且查无结果的行）。
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({
        occasions: [
          {
            id: 'occ-3',
            user_id: 'u1',
            kind: 'anniversary',
            title: '闰月纪念日',
            date: '2000-06-15',
            lunar: true,
            lunar_month: 4,
            lunar_day: 30,
            lunar_is_leap: true,
            cover_path: null,
            note: null,
            remind_days: [0],
            milestones: {},
            leap_fallback: 'feb28',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        loading: false,
        error: null,
      }),
    }))
    const { default: HomeLunarGap } = await import('./Home')
    render(
      <MemoryRouter>
        <HomeLunarGap />
      </MemoryRouter>,
    )
    expect(screen.getByText('闰月纪念日')).toBeInTheDocument()
    expect(screen.getAllByText(/近年无对应/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument()
  })
})
