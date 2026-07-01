import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationGuide from './NotificationGuide'

const sendTestReminder = vi.fn(async () => undefined)
const requestNotificationPermissions = vi.fn(async () => true)

vi.mock('../lib/localNotifications', () => ({
  sendTestReminder: () => sendTestReminder(),
  requestNotificationPermissions: () => requestNotificationPermissions(),
}))

vi.mock('../lib/deviceOem', () => ({
  detectOem: () => 'vivo',
}))

describe('NotificationGuide', () => {
  it('针对 vivo 显示对应的保活步骤', () => {
    render(<NotificationGuide />)
    expect(screen.getByText(/自启动/)).toBeInTheDocument()
    expect(screen.getByText(/vivo/i)).toBeInTheDocument()
  })

  it('点击发送测试提醒按钮触发 sendTestReminder', async () => {
    render(<NotificationGuide />)
    await userEvent.click(screen.getByRole('button', { name: '发送测试提醒' }))
    expect(sendTestReminder).toHaveBeenCalled()
  })
})
