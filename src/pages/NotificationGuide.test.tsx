import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NotificationGuide from './NotificationGuide'

const sendTestReminder = vi.fn(async () => undefined)
const requestNotificationPermissions = vi.fn(async () => true)
const mockNavigate = vi.fn()

vi.mock('../lib/localNotifications', () => ({
  sendTestReminder: () => sendTestReminder(),
  requestNotificationPermissions: () => requestNotificationPermissions(),
}))

vi.mock('../lib/deviceOem', () => ({
  detectOem: () => 'vivo',
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationGuide />
    </MemoryRouter>,
  )
}

describe('NotificationGuide', () => {
  beforeEach(() => {
    sendTestReminder.mockClear()
    mockNavigate.mockClear()
  })

  it('针对 vivo 显示对应的保活步骤', () => {
    renderPage()
    expect(screen.getByText(/自启动/)).toBeInTheDocument()
    expect(screen.getByText(/vivo/i)).toBeInTheDocument()
  })

  it('点击发送测试提醒按钮触发 sendTestReminder', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '发送测试提醒' }))
    expect(sendTestReminder).toHaveBeenCalled()
  })

  it('点返回调用 navigate(-1)', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
