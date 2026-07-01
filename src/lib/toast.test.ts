import { describe, it, expect, vi } from 'vitest'
import { showToast, subscribeToast } from './toast'

describe('toast 事件总线', () => {
  it('showToast 触发订阅回调，带上消息内容', () => {
    const cb = vi.fn()
    const unsubscribe = subscribeToast(cb)
    showToast('测试消息', { durationMs: 3000 })
    expect(cb).toHaveBeenCalledWith({ message: '测试消息', durationMs: 3000 })
    unsubscribe()
  })

  it('unsubscribe 后不再收到通知', () => {
    const cb = vi.fn()
    const unsubscribe = subscribeToast(cb)
    unsubscribe()
    showToast('不该收到')
    expect(cb).not.toHaveBeenCalled()
  })
})
