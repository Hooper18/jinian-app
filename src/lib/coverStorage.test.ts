import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadCover, removeCover, getCoverSignedUrl } from './coverStorage'

const upload = vi.fn(() => Promise.resolve({ error: null }))
const remove = vi.fn(() => Promise.resolve({ error: null }))
const createSignedUrl = vi.fn(() =>
  Promise.resolve({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
)

vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({ upload, remove, createSignedUrl })),
    },
  },
}))

describe('coverStorage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploadCover 上传到 {user_id}/{id}.jpg 并返回该路径', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    const path = await uploadCover('user-1', 'occ-1', blob)
    expect(path).toBe('user-1/occ-1.jpg')
    expect(upload).toHaveBeenCalledWith('user-1/occ-1.jpg', blob, {
      contentType: 'image/jpeg',
      upsert: true,
    })
  })

  it('removeCover 调用 storage remove', async () => {
    await removeCover('user-1/occ-1.jpg')
    expect(remove).toHaveBeenCalledWith(['user-1/occ-1.jpg'])
  })

  it('getCoverSignedUrl 返回带缓存击穿参数的签名url', async () => {
    const url = await getCoverSignedUrl('user-1/occ-1.jpg', '2026-07-01T00:00:00Z')
    expect(url).toBe('https://example.com/signed?v=2026-07-01T00%3A00%3A00Z')
  })
})
