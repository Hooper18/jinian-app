import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OccasionDetail from './OccasionDetail'
import { saveImage } from '../lib/saveImage'
import { renderOccasionCard } from '../lib/shareCard'
import { downloadCover } from '../lib/coverStorage'
import { showToast } from '../lib/toast'

const mockNavigate = vi.fn()

vi.mock('../lib/saveImage', () => ({
  saveImage: vi.fn(() => Promise.resolve('shared')),
}))

// jsdom 没有 canvas，出图函数 mock 成返回固定 Blob
vi.mock('../lib/shareCard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/shareCard')>()
  return {
    ...actual,
    renderOccasionCard: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  }
})

// coverStorage 走真实 supabase client，整体 mock 掉
vi.mock('../lib/coverStorage', () => ({
  uploadCover: vi.fn(),
  removeCover: vi.fn(),
  getCoverSignedUrl: vi.fn(async () => 'https://signed.example/cover.jpg'),
  downloadCover: vi.fn(async () => new Blob(['cover'], { type: 'image/jpeg' })),
}))

vi.mock('../lib/toast', () => ({
  showToast: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

const coverRow = {
  ...sinceRow,
  id: 'occ-cover',
  title: '有封面的日子',
  cover_path: 'covers/u1/occ-cover.jpg',
}

const mockDeleteOccasion = vi.fn(() => Promise.resolve())

vi.mock('../hooks/useOccasions', () => ({
  useOccasions: () => ({
    occasions: [sinceRow, coverRow],
    loading: false,
    error: null,
    deleteOccasion: mockDeleteOccasion,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

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

  it('编辑链接指向 /occasion/:id/edit', () => {
    renderDetail('occ-2')
    const editLink = screen.getByText('编辑').closest('a')
    expect(editLink).not.toBeNull()
    expect(editLink).toHaveAttribute('href', '/occasion/occ-2/edit')
  })

  it('点击删除，确认后调用 deleteOccasion 并跳转首页', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderDetail('occ-2')
    fireEvent.click(screen.getByText('删除'))
    expect(confirmSpy).toHaveBeenCalledWith('删除这个日子？')
    expect(mockDeleteOccasion).toHaveBeenCalledWith('occ-2')
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    confirmSpy.mockRestore()
  })

  it('点击删除，取消确认则不调用 deleteOccasion', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderDetail('occ-2')
    fireEvent.click(screen.getByText('删除'))
    expect(confirmSpy).toHaveBeenCalledWith('删除这个日子？')
    expect(mockDeleteOccasion).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('点击存图：渲染卡片后交给 saveImage 做平台分流', async () => {
    renderDetail('occ-2')
    fireEvent.click(screen.getByText('存图'))
    await waitFor(() => expect(saveImage).toHaveBeenCalled())
    const [blobArg, nameArg] = vi.mocked(saveImage).mock.calls[0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(nameArg).toBe('纪念-和 A 在一起.png')
  })

  it('带封面出图：封面下载成功后把 blob 传给 renderOccasionCard', async () => {
    const coverBlob = new Blob(['real-cover'], { type: 'image/jpeg' })
    vi.mocked(downloadCover).mockResolvedValueOnce(coverBlob)
    renderDetail('occ-cover')
    fireEvent.click(screen.getByText('存图'))
    await waitFor(() => expect(saveImage).toHaveBeenCalled())
    expect(downloadCover).toHaveBeenCalledWith('covers/u1/occ-cover.jpg')
    expect(vi.mocked(renderOccasionCard).mock.calls[0][1]).toBe(coverBlob)
  })

  it('带封面出图：封面下载失败降级为无封面版式，照常出图', async () => {
    vi.mocked(downloadCover).mockRejectedValueOnce(new Error('storage down'))
    renderDetail('occ-cover')
    fireEvent.click(screen.getByText('存图'))
    await waitFor(() => expect(saveImage).toHaveBeenCalled())
    expect(vi.mocked(renderOccasionCard).mock.calls[0][1]).toBeNull()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('存图失败：弹「出图失败」提示且按钮复位可重试', async () => {
    vi.mocked(saveImage).mockRejectedValueOnce(new Error('boom'))
    renderDetail('occ-2')
    fireEvent.click(screen.getByText('存图'))
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('出图失败，请重试', { durationMs: 4000 }),
    )
    expect(screen.getByText('存图')).toBeEnabled()
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
