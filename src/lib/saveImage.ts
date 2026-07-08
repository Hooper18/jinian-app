import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { downloadImage } from './shareCard'

export type SaveImageOutcome = 'downloaded' | 'shared' | 'canceled'

/** 标题是用户输入，Android 文件名里 \/:*?"<>| 和控制字符都非法，统一替换成 -。 */
function sanitizeFilename(name: string): string {
  return Array.from(name, (ch) => (ch < ' ' || '\\/:*?"<>|'.includes(ch) ? '-' : ch)).join('')
}

/** ext4 单段文件名上限 255 字节（UTF-8），超长标题会让 writeFile 报 ENAMETOOLONG，留余量截到 200。 */
const MAX_FILENAME_BYTES = 200

function truncateFilenameBytes(name: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  if (encoder.encode(name).length <= maxBytes) return name

  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot) : ''
  const stemBudget = maxBytes - encoder.encode(ext).length

  let stem = ''
  let bytes = 0
  for (const ch of name.slice(0, dot > 0 ? dot : name.length)) {
    const chBytes = encoder.encode(ch).length
    if (bytes + chBytes > stemBudget) break
    stem += ch
    bytes += chBytes
  }
  return stem + ext
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
    path: `share/${truncateFilenameBytes(sanitizeFilename(filename), MAX_FILENAME_BYTES)}`,
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
