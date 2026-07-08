/** react-easy-crop 的 onCropComplete 给出的像素区域。 */
export interface CropAreaPixels {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 按选定像素区域把原图裁成 JPEG。只裁不缩，最终尺寸/质量交给
 * compressImageToJpeg 在提交时统一处理。
 */
export function cropImageToJpeg(
  file: Blob,
  area: CropAreaPixels,
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(area.width)
      canvas.height = Math.round(area.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('无法获取 canvas 2d context'))
        return
      }
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('导出失败'))
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}
