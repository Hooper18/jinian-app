import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { cropImageToJpeg, type CropAreaPixels } from '../lib/cropImage'
import { showToast } from '../lib/toast'

interface CoverCropperProps {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

/**
 * 选完封面后的全屏裁切步骤：16:9（与详情页封面框一致），
 * 触屏捏合缩放+拖动，桌面端有缩放滑杆。确定后输出裁好的 JPEG。
 */
export default function CoverCropper({ file, onConfirm, onCancel }: CoverCropperProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<CropAreaPixels | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!areaPixels) return
    setWorking(true)
    try {
      const blob = await cropImageToJpeg(file, areaPixels)
      onConfirm(blob)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '裁切失败，请重试', { durationMs: 4000 })
      setWorking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#141312' }}>
      <div className="relative flex-1">
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
      <div
        className="flex items-center gap-4 px-5 pt-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-2 text-sm"
          style={{ color: '#A8A6A1' }}
        >
          取消
        </button>
        <input
          type="range"
          aria-label="缩放"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={working || !areaPixels}
          className="rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {working ? '处理中…' : '确定'}
        </button>
      </div>
    </div>
  )
}
