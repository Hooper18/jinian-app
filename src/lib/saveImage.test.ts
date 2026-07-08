import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { downloadImage } from './shareCard'
import { saveImage } from './saveImage'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: vi.fn() },
  Directory: { Cache: 'CACHE' },
}))
vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn() },
}))
vi.mock('./shareCard', () => ({
  downloadImage: vi.fn(),
}))

const png = new Blob(['fake-png'], { type: 'image/png' })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('saveImage', () => {
  it('web 平台走浏览器下载，不碰原生插件', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    const outcome = await saveImage(png, '纪念-测试.png')

    expect(outcome).toBe('downloaded')
    expect(downloadImage).toHaveBeenCalledWith(png, '纪念-测试.png')
    expect(Filesystem.writeFile).not.toHaveBeenCalled()
    expect(Share.share).not.toHaveBeenCalled()
  })

  it('原生平台把 PNG 以 base64 写进缓存目录，再用文件 uri 拉起系统分享面板', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.writeFile).mockResolvedValue({
      uri: 'file:///cache/share/纪念-测试.png',
    })
    vi.mocked(Share.share).mockResolvedValue({ activityType: undefined })

    const outcome = await saveImage(png, '纪念-测试.png')

    expect(outcome).toBe('shared')
    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: 'share/纪念-测试.png',
      data: btoa('fake-png'),
      directory: 'CACHE',
      recursive: true,
    })
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///cache/share/纪念-测试.png'] }),
    )
    expect(downloadImage).not.toHaveBeenCalled()
  })

  it('用户在分享面板点取消不算失败，返回 canceled', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file:///cache/x.png' })
    vi.mocked(Share.share).mockRejectedValue(new Error('Share canceled'))

    const outcome = await saveImage(png, 'x.png')

    expect(outcome).toBe('canceled')
  })

  it('分享真报错时向上抛，让页面提示', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file:///cache/x.png' })
    vi.mocked(Share.share).mockRejectedValue(new Error('sharing not supported'))

    await expect(saveImage(png, 'x.png')).rejects.toThrow('sharing not supported')
  })
})
