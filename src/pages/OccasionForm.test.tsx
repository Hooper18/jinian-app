import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OccasionForm from './OccasionForm'

const createOccasion = vi.fn(async (input) => ({ id: 'new-id', user_id: 'u1', ...input }))
const updateOccasion = vi.fn(async (id, patch) => ({ id, user_id: 'u1', ...patch }))

vi.mock('../hooks/useOccasions', () => ({
  useOccasions: () => ({ occasions: [], loading: false, createOccasion, updateOccasion, deleteOccasion: vi.fn() }),
}))

describe('OccasionForm 新建表单', () => {
  it('默认类型是"每年循环"，农历开关可用', () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '每年循环' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('农历')).not.toBeDisabled()
  })

  it('切到"累加计天"后显示里程碑区，农历开关禁用', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: '累加计天' }))
    expect(screen.getByTestId('milestone-section')).toBeInTheDocument()
    expect(screen.getByLabelText('农历')).toBeDisabled()
  })

  it('切到"倒数到某天"后不显示里程碑区', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: '倒数到某天' }))
    expect(screen.queryByTestId('milestone-section')).not.toBeInTheDocument()
  })

  it('提交表单调用 createOccasion，携带正确的 kind 与 title', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('名字'), '婚礼')
    await userEvent.click(screen.getByRole('button', { name: '倒数到某天' }))
    await userEvent.type(screen.getByLabelText('日期'), '2026-09-28')
    await userEvent.click(screen.getByRole('button', { name: '存' }))
    expect(createOccasion).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'until', title: '婚礼', date: '2026-09-28' }),
    )
  })

  it('提醒 chips 默认选中"当天"与"提前1天"，切换"提前1周"后提交携带 remind_days', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '当天' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '提前1天' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '提前3天' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '提前1周' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.type(screen.getByLabelText('名字'), '婚礼')
    await userEvent.type(screen.getByLabelText('日期'), '2026-09-28')
    await userEvent.click(screen.getByRole('button', { name: '提前1周' }))
    expect(screen.getByRole('button', { name: '提前1周' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: '存' }))
    expect(createOccasion).toHaveBeenCalledWith(
      expect.objectContaining({ remind_days: expect.arrayContaining([0, 1, 7]) }),
    )
  })
})

describe('OccasionForm 编辑表单', () => {
  it('回显已有数据并调用 updateOccasion 而非 createOccasion', async () => {
    vi.resetModules()
    const existingRow = {
      id: 'occ-9',
      user_id: 'u1',
      kind: 'anniversary',
      title: '结婚纪念日',
      date: '2020-05-01',
      lunar: false,
      lunar_month: null,
      lunar_day: null,
      lunar_is_leap: false,
      cover_path: null,
      note: '',
      remind_days: [0, 1],
      milestones: {},
      leap_fallback: 'feb28',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const editCreateOccasion = vi.fn(async (input) => ({ id: 'new-id', user_id: 'u1', ...input }))
    const editUpdateOccasion = vi.fn(async (id, patch) => ({ id, user_id: 'u1', ...patch }))
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({
        occasions: [existingRow],
        loading: false,
        createOccasion: editCreateOccasion,
        updateOccasion: editUpdateOccasion,
        deleteOccasion: vi.fn(),
      }),
    }))
    const { default: FreshForm } = await import('./OccasionForm')

    render(
      <MemoryRouter initialEntries={['/occasion/occ-9/edit']}>
        <Routes>
          <Route path="/occasion/:id/edit" element={<FreshForm />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('名字')).toHaveValue('结婚纪念日')

    await userEvent.click(screen.getByRole('button', { name: '存' }))
    expect(editUpdateOccasion).toHaveBeenCalled()
    expect(editCreateOccasion).not.toHaveBeenCalled()
  })
})

describe('OccasionForm 编辑态加载门', () => {
  it('数据未就绪时显示加载占位，不渲染表单', async () => {
    vi.resetModules()
    const loadingCreateOccasion = vi.fn()
    vi.doMock('../hooks/useOccasions', () => ({
      useOccasions: () => ({
        occasions: [],
        loading: true,
        createOccasion: loadingCreateOccasion,
        updateOccasion: vi.fn(),
        deleteOccasion: vi.fn(),
      }),
    }))
    const { default: FreshForm } = await import('./OccasionForm')

    render(
      <MemoryRouter initialEntries={['/occasion/occ-x/edit']}>
        <Routes>
          <Route path="/occasion/:id/edit" element={<FreshForm />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('加载中…')).toBeInTheDocument()
    expect(screen.queryByLabelText('名字')).not.toBeInTheDocument()
    expect(loadingCreateOccasion).not.toHaveBeenCalled()
  })
})
