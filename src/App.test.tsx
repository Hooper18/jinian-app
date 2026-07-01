import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockRequestNotificationPermissions = vi.fn().mockResolvedValue(false)
const mockSyncReminders = vi.fn()

function mockOccasions() {
  vi.doMock('./hooks/useOccasions', () => ({
    useOccasions: () => ({ occasions: [], loading: false, error: null }),
  }))
}

function mockLocalNotifications() {
  vi.doMock('./lib/localNotifications', () => ({
    requestNotificationPermissions: mockRequestNotificationPermissions,
    syncReminders: mockSyncReminders,
  }))
}

beforeEach(() => {
  vi.resetModules()
  mockRequestNotificationPermissions.mockClear()
  mockSyncReminders.mockClear()
})

describe('App', () => {
  it('未登录时渲染登录页而不是首页', async () => {
    window.history.replaceState(null, '', '/')
    vi.doMock('./contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ ready: true, confirmed: true, user: null }),
    }))
    mockOccasions()
    mockLocalNotifications()
    const { default: App } = await import('./App')
    render(<App />)
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
  })

  it('未登录时不请求通知权限', async () => {
    window.history.replaceState(null, '', '/')
    vi.doMock('./contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ ready: true, confirmed: true, user: null }),
    }))
    mockOccasions()
    mockLocalNotifications()
    const { default: App } = await import('./App')
    render(<App />)
    expect(mockRequestNotificationPermissions).not.toHaveBeenCalled()
  })
})

describe('App — ready:false', () => {
  it('尚未 ready 时不渲染任何受保护页面内容（避免闪烁登录页）', async () => {
    window.history.replaceState(null, '', '/')
    vi.doMock('./contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ ready: false, confirmed: false, user: null }),
    }))
    mockOccasions()
    mockLocalNotifications()
    const { default: App } = await import('./App')
    render(<App />)
    // 未 ready 时既不应闪烁登录页……
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument()
    // ……也不应闪烁受保护页面内容（Home 的空态引导文案/新建入口）
    expect(screen.queryByText('记下第一个重要的日子')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('新建')).not.toBeInTheDocument()
  })
})

describe('App — 已登录', () => {
  it('已登录且 loading 结束时请求通知权限并同步提醒', async () => {
    window.history.replaceState(null, '', '/')
    vi.doMock('./contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ ready: true, confirmed: true, user: { id: 'u1' } }),
    }))
    vi.doMock('./hooks/useOccasions', () => ({
      useOccasions: () => ({ occasions: [], loading: false, error: null }),
    }))
    mockLocalNotifications()
    const { default: App } = await import('./App')
    render(<App />)
    await waitFor(() => expect(mockRequestNotificationPermissions).toHaveBeenCalled())
    await waitFor(() => expect(mockSyncReminders).toHaveBeenCalledWith([]))
  })
})
