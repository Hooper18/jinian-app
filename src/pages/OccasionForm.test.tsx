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

// 裁切器桩：一键模拟「确定」（回传裁好的 blob）与「取消」
vi.mock('../components/CoverCropper', () => ({
  default: ({ onConfirm, onCancel }: { onConfirm: (b: Blob) => void; onCancel: () => void }) => (
    <div data-testid="cover-cropper">
      <button type="button" onClick={() => onConfirm(new Blob(['cropped'], { type: 'image/jpeg' }))}>
        模拟裁切确定
      </button>
      <button type="button" onClick={onCancel}>
        模拟裁切取消
      </button>
    </div>
  ),
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

  it('选完封面先进裁切，确定后显示裁好的预览图', async () => {
    // jsdom 没实现 objectURL，桩掉
    URL.createObjectURL = vi.fn(() => 'blob:cover-preview')
    URL.revokeObjectURL = vi.fn()
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('cover-cropper')).not.toBeInTheDocument()

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText(/添加封面照片/), file)

    // 先弹裁切、还没有预览
    expect(screen.getByTestId('cover-cropper')).toBeInTheDocument()
    expect(screen.queryByAltText('封面预览')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '模拟裁切确定' }))
    expect(screen.queryByTestId('cover-cropper')).not.toBeInTheDocument()
    expect(screen.getByAltText('封面预览')).toHaveAttribute('src', 'blob:cover-preview')
  })

  it('裁切取消：不留预览、可重新选图', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:cover-preview')
    URL.revokeObjectURL = vi.fn()
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText(/添加封面照片/), file)
    await userEvent.click(screen.getByRole('button', { name: '模拟裁切取消' }))
    expect(screen.queryByTestId('cover-cropper')).not.toBeInTheDocument()
    expect(screen.queryByAltText('封面预览')).not.toBeInTheDocument()

    // 同一个文件再选一次，仍能再次进裁切（input value 被清空）
    await userEvent.upload(screen.getByLabelText(/添加封面照片/), file)
    expect(screen.getByTestId('cover-cropper')).toBeInTheDocument()
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

  it('勾选农历后显示农历月/农历日/闰月输入', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    expect(screen.queryByLabelText('农历月')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('农历'))
    expect(screen.getByLabelText('农历月')).toBeInTheDocument()
    expect(screen.getByLabelText('农历日')).toBeInTheDocument()
    expect(screen.getByLabelText('闰月')).toBeInTheDocument()
  })

  it('提交农历纪念日携带 lunar 字段与非空 date', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('名字'), '奶奶生日')
    await userEvent.click(screen.getByLabelText('农历'))
    await userEvent.clear(screen.getByLabelText('农历月'))
    await userEvent.type(screen.getByLabelText('农历月'), '8')
    await userEvent.clear(screen.getByLabelText('农历日'))
    await userEvent.type(screen.getByLabelText('农历日'), '15')
    await userEvent.click(screen.getByRole('button', { name: '存' }))

    expect(createOccasion).toHaveBeenCalledWith(
      expect.objectContaining({
        lunar: true,
        lunar_month: 8,
        lunar_day: 15,
        lunar_is_leap: false,
      }),
    )
    const payload = createOccasion.mock.calls[createOccasion.mock.calls.length - 1][0]
    expect(typeof payload.date).toBe('string')
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(payload.date).not.toBe('')
  })

  it('非农历提交仍发送 lunar:false 与公历 date（现有行为）', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('名字'), '婚礼')
    await userEvent.type(screen.getByLabelText('日期'), '2026-09-28')
    await userEvent.click(screen.getByRole('button', { name: '存' }))
    expect(createOccasion).toHaveBeenCalledWith(
      expect.objectContaining({
        lunar: false,
        date: '2026-09-28',
        lunar_month: null,
        lunar_day: null,
        lunar_is_leap: false,
      }),
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
