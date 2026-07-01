import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useOccasions } from './useOccasions'

const mockRow = {
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
}

const order = vi.fn(() => Promise.resolve({ data: [mockRow], error: null }))
const select = vi.fn(() => ({ order }))
const insertSingle = vi.fn(() => Promise.resolve({ data: mockRow, error: null }))
const insertSelect = vi.fn(() => ({ single: insertSingle }))
const insert = vi.fn(() => ({ select: insertSelect }))
const updateEqSingle = vi.fn(() => Promise.resolve({ data: mockRow, error: null }))
const updateEqSelect = vi.fn(() => ({ single: updateEqSingle }))
const updateEq = vi.fn(() => ({ select: updateEqSelect }))
const update = vi.fn(() => ({ eq: updateEq }))
const deleteEq = vi.fn(() => Promise.resolve({ error: null }))
const del = vi.fn(() => ({ eq: deleteEq }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select, insert, update, delete: del })),
  },
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

describe('useOccasions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    order.mockResolvedValue({ data: [mockRow], error: null })
  })

  it('挂载后自动拉取数据', async () => {
    const { result } = renderHook(() => useOccasions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.occasions).toHaveLength(1)
    expect(result.current.occasions[0].title).toBe('婚礼')
  })

  it('createOccasion 插入后返回新行', async () => {
    const { result } = renderHook(() => useOccasions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let created
    await act(async () => {
      created = await result.current.createOccasion({
        kind: 'until',
        title: '婚礼',
        date: '2026-09-28',
      })
    })
    expect(created).toEqual(mockRow)
    expect(insert).toHaveBeenCalled()
  })

  it('deleteOccasion 调用 delete().eq()', async () => {
    const { result } = renderHook(() => useOccasions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteOccasion('occ-1')
    })
    expect(del).toHaveBeenCalled()
    expect(deleteEq).toHaveBeenCalledWith('id', 'occ-1')
  })
})
