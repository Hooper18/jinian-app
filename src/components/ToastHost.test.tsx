import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ToastHost from './ToastHost'
import { showToast } from '../lib/toast'

describe('ToastHost', () => {
  it('showToast 后渲染出消息文本', async () => {
    render(<ToastHost />)
    showToast('保存成功')
    await waitFor(() => expect(screen.getByText('保存成功')).toBeInTheDocument())
  })

  it('点击后立即消失', async () => {
    render(<ToastHost />)
    showToast('点我消失')
    const el = await screen.findByText('点我消失')
    el.click()
    await waitFor(() => expect(screen.queryByText('点我消失')).not.toBeInTheDocument())
  })

  it('durationMs 到期后自动消失', async () => {
    vi.useFakeTimers()
    render(<ToastHost />)
    showToast('自动消失', { durationMs: 1000 })
    await vi.waitFor(() => expect(screen.getByText('自动消失')).toBeInTheDocument())
    vi.advanceTimersByTime(1001)
    await vi.waitFor(() => expect(screen.queryByText('自动消失')).not.toBeInTheDocument())
    vi.useRealTimers()
  })
})
