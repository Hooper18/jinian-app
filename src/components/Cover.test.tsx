import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Cover from './Cover'

const getCoverSignedUrl = vi.fn()

vi.mock('../lib/coverStorage', () => ({
  getCoverSignedUrl: (...args: unknown[]) => getCoverSignedUrl(...args),
}))

const baseOccasion = {
  id: 'occ-1',
  cover_path: null as string | null,
  updated_at: '2026-01-01T00:00:00Z',
  title: '婚礼',
}

describe('Cover 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('有 cover_path 时异步加载出图片', async () => {
    getCoverSignedUrl.mockResolvedValueOnce('https://example.com/signed.jpg')
    render(<Cover occasion={{ ...baseOccasion, cover_path: 'u1/occ-1.jpg' }} variant="frame" />)

    const img = await screen.findByRole('img', { name: '婚礼' })
    expect(img).toBeInTheDocument()
    expect(getCoverSignedUrl).toHaveBeenCalledWith('u1/occ-1.jpg', '2026-01-01T00:00:00Z')
  })

  it('无 cover_path 时显示占位符（标题首字），不渲染 img', () => {
    render(<Cover occasion={baseOccasion} variant="frame" />)

    expect(screen.getByText('婚')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(getCoverSignedUrl).not.toHaveBeenCalled()
  })

  it('fetch 失败时回退到占位符', async () => {
    getCoverSignedUrl.mockRejectedValueOnce(new Error('network fail'))
    render(<Cover occasion={{ ...baseOccasion, cover_path: 'u1/occ-1.jpg' }} variant="frame" />)

    const placeholder = await screen.findByText('婚')
    expect(placeholder).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('thumb variant 无 cover 时也显示占位符首字', () => {
    render(<Cover occasion={baseOccasion} variant="thumb" />)
    expect(screen.getByText('婚')).toBeInTheDocument()
  })

  it('hero variant 有 cover 时渲染带 alt 的图片', async () => {
    getCoverSignedUrl.mockResolvedValueOnce('https://example.com/hero.jpg')
    render(<Cover occasion={{ ...baseOccasion, cover_path: 'u1/occ-1.jpg' }} variant="hero" />)
    const img = await screen.findByRole('img', { name: '婚礼' })
    expect(img).toBeInTheDocument()
  })
})
