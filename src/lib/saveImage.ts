import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { downloadImage } from './shareCard'

export type SaveImageOutcome = 'downloaded' | 'shared' | 'canceled'

/** 标题是用户输入，Android 文件名里 \/:*?"<>| 和控制字符都非法，统一替换成 -。 */
function sanitizeFilename(name: string): string {
  return Array.from(name, (ch) => (ch < ' ' || '\\/:*?"<>|'.includes(ch) ? '-' : ch)).join('')
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 存图的平台分流：web 直接触发浏览器下载；
 * 原生 WebView 里 <a download> 是静默无效的，改为写入缓存目录后
 * 拉起系统分享面板（从那里可存相册、发微信等）。
 */
export async function saveImage(blob: Blob, filename: string): Promise<SaveImageOutcome> {
  if (!Capacitor.isNativePlatform()) {
    downloadImage(blob, filename)
    return 'downloaded'
  }

  const data = await blobToBase64(blob)
  const written = await Filesystem.writeFile({
    path: `share/${sanitizeFilename(filename)}`,
    data,
    directory: Directory.Cache,
    recursive: true,
  })

  try {
    await Share.share({ files: [written.uri] })
  } catch (err) {
    if (err instanceof Error && /cancel/i.test(err.message)) return 'canceled'
    throw err
  }
  return 'shared'
}
