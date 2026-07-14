import type { OccasionRow } from '../types/occasion'
import { KIND_PREFIX, type OccasionState } from './occasion'
import { parseCivilDate, formatCivilDate } from './civilDate'

export interface CardContent {
  title: string
  /** 距下次 / 已经 / 还有 / ''（无对应时） */
  prefix: string
  /** 天数字符串或「近年无对应」 */
  bigText: string
  /** '天' 或 ''（无对应时） */
  unit: string
  dateLabel: string
}

/** 纯函数：把一条日子 + 计算态映射成出图卡片的文字内容（与详情页显示逻辑一致）。可测试。 */
export function buildCardContent(row: OccasionRow, state: OccasionState): CardContent {
  const anchor = parseCivilDate(row.date)
  const unresolved =
    state.nextDate === null && !Number.isFinite(state.daysBetween) && row.kind !== 'since'
  return {
    title: row.title,
    prefix: unresolved ? '' : KIND_PREFIX[row.kind],
    bigText: unresolved ? '近年无对应' : String(Math.abs(state.daysBetween)),
    unit: unresolved ? '' : '天',
    dateLabel: formatCivilDate(anchor),
  }
}

const FONT = `-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif`

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** object-fit: cover 的绘制：裁掉多余边、填满目标框。 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as ImageBitmap).width
  const ih = (img as HTMLImageElement).naturalHeight || (img as ImageBitmap).height
  const scale = Math.max(dw / iw, dh / ih)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('封面加载失败'))
    }
    img.src = url
  })
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

/**
 * 把一条日子渲染成一张 1080×1350 的暖白卡片图（封面 + 大天数 + 标题 + 日期 + 极简水印）。
 * 单模板、不搞花活。仅浏览器可用（依赖 canvas）。
 */
export async function renderOccasionCard(content: CardContent, coverBlob: Blob | null): Promise<Blob> {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前环境不支持 canvas')

  // 暖白底
  ctx.fillStyle = '#FAF9F7'
  ctx.fillRect(0, 0, W, H)

  const hasCover = !!coverBlob
  if (coverBlob) {
    try {
      const img = await blobToImage(coverBlob)
      const cx = 80
      const cy = 90
      const cw = W - 160
      const ch = 680
      ctx.save()
      roundRectPath(ctx, cx, cy, cw, ch, 40)
      ctx.clip()
      drawImageCover(ctx, img, cx, cy, cw, ch)
      ctx.restore()
    } catch {
      // 封面拉不到就退化成无封面版式，不影响出图
    }
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // 版式：有封面 → 图在上、文字在下半区；无封面 → 文字整体居中。
  const y = hasCover
    ? { prefix: 890, number: 1020, unit: 1072, title: 1150, date: 1196 }
    : { title: 440, date: 496, prefix: 690, number: 860, unit: 918 }

  // 标题 + 日期
  ctx.fillStyle = '#2B2A27'
  ctx.font = `600 46px ${FONT}`
  ctx.fillText(truncate(content.title, 16), W / 2, y.title)
  ctx.fillStyle = '#A9A59C'
  ctx.font = `400 26px ${FONT}`
  ctx.fillText(content.dateLabel, W / 2, y.date)

  // 前缀 + 大天数 + 单位
  if (content.prefix) {
    ctx.fillStyle = '#78756E'
    ctx.font = `400 30px ${FONT}`
    ctx.fillText(content.prefix, W / 2, y.prefix)
  }
  ctx.fillStyle = '#C96442'
  ctx.font = content.unit ? `700 190px ${FONT}` : `700 92px ${FONT}`
  ctx.fillText(content.bigText, W / 2, y.number)
  if (content.unit) {
    ctx.fillStyle = '#78756E'
    ctx.font = `400 38px ${FONT}`
    ctx.fillText(content.unit, W / 2, y.unit)
  }

  // 极简水印（顺带给小红书带出处）
  ctx.fillStyle = '#C7C3BA'
  ctx.font = `400 24px ${FONT}`
  ctx.fillText('纪念 · memory.tuchenguang.com', W / 2, H - 66)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png')
  })
}

/** 触发浏览器下载一张图。 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
