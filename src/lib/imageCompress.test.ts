import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImageToJpeg } from './imageCompress'

class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 3000
  height = 2000
  set src(_v: string) {
    setTimeout(() => this.onload?.(), 0)
  }
}

describe('compressImageToJpeg', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/jpeg' }))),
    }
    vi.stubGlobal(
      'document',
      Object.assign(Object.create(document), {
        createElement: vi.fn((tag: string) => (tag === 'canvas' ? fakeCanvas : document.createElement(tag))),
      }),
    )
  })

  it('压缩后返回一个 Blob', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const blob = await compressImageToJpeg(file)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('最长边被限制在 maxDimension 以内（canvas 尺寸按比例缩放）', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    await compressImageToJpeg(file, 1600)
    const canvas = (document.createElement as ReturnType<typeof vi.fn>).mock.results.find(
      (r) => r.value.toBlob,
    )!.value
    expect(canvas.width).toBeLessThanOrEqual(1600)
    expect(canvas.height).toBeLessThanOrEqual(1600)
  })
})
