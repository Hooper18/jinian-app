import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cropImageToJpeg } from './cropImage'

class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 3000
  height = 2000
  set src(_v: string) {
    setTimeout(() => this.onload?.(), 0)
  }
}

const drawImage = vi.fn()

describe('cropImageToJpeg', () => {
  beforeEach(() => {
    drawImage.mockClear()
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/jpeg' }))),
    }
    vi.stubGlobal(
      'document',
      Object.assign(Object.create(document), {
        createElement: vi.fn((tag: string) =>
          tag === 'canvas' ? fakeCanvas : document.createElement(tag),
        ),
      }),
    )
  })

  it('canvas 尺寸等于裁切区域，且只画选中的子矩形', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const area = { x: 100, y: 50, width: 1600, height: 900 }

    const blob = await cropImageToJpeg(file, area)

    expect(blob).toBeInstanceOf(Blob)
    const canvas = (document.createElement as ReturnType<typeof vi.fn>).mock.results.find(
      (r) => r.value.toBlob,
    )!.value
    expect(canvas.width).toBe(1600)
    expect(canvas.height).toBe(900)
    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      100,
      50,
      1600,
      900,
      0,
      0,
      1600,
      900,
    )
  })

  it('图片加载失败时 reject', async () => {
    class BrokenImage extends FakeImage {
      set src(_v: string) {
        setTimeout(() => this.onerror?.(), 0)
      }
    }
    vi.stubGlobal('Image', BrokenImage)
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(cropImageToJpeg(file, { x: 0, y: 0, width: 10, height: 10 })).rejects.toThrow(
      '图片加载失败',
    )
  })
})
