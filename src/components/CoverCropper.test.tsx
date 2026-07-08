import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import CoverCropper from './CoverCropper'
import { cropImageToJpeg } from '../lib/cropImage'
import type { CropperProps } from 'react-easy-crop'

let capturedProps: Partial<CropperProps> = {}

vi.mock('react-easy-crop', () => ({
  default: (props: CropperProps) => {
    capturedProps = props
    return <div data-testid="cropper-stub" />
  },
}))

vi.mock('../lib/cropImage', () => ({
  cropImageToJpeg: vi.fn(async () => new Blob(['cropped'], { type: 'image/jpeg' })),
}))

const file = new File(['raw'], 'photo.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  vi.clearAllMocks()
  capturedProps = {}
  URL.createObjectURL = vi.fn(() => 'blob:crop-source')
  URL.revokeObjectURL = vi.fn()
})

describe('CoverCropper', () => {
  it('渲染 16:9 裁切器，图片源来自所选文件', () => {
    render(<CoverCropper file={file} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByTestId('cropper-stub')).toBeInTheDocument()
    expect(capturedProps.aspect).toBeCloseTo(16 / 9)
    expect(capturedProps.image).toBe('blob:crop-source')
  })

  it('确定：按选区裁切并把结果 blob 交给 onConfirm', async () => {
    const onConfirm = vi.fn()
    render(<CoverCropper file={file} onConfirm={onConfirm} onCancel={vi.fn()} />)

    const area = { x: 10, y: 20, width: 1600, height: 900 }
    act(() => {
      capturedProps.onCropComplete?.({ x: 0, y: 0, width: 100, height: 100 }, area)
    })
    fireEvent.click(screen.getByRole('button', { name: '确定' }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(cropImageToJpeg).toHaveBeenCalledWith(file, area)
    expect(onConfirm.mock.calls[0][0]).toBeInstanceOf(Blob)
  })

  it('取消：调 onCancel、不裁切', () => {
    const onCancel = vi.fn()
    render(<CoverCropper file={file} onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalled()
    expect(cropImageToJpeg).not.toHaveBeenCalled()
  })
})
