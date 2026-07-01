import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

function mockOccasions() {
  vi.doMock('./hooks/useOccasions', () => ({
    useOccasions: () => ({ occasions: [], loading: false, error: null }),
  }))
}

beforeEach(() => {
  vi.resetModules()
})

describe('App', () => {
  it('未登录时渲染登录页而不是首页', async () => {
    window.history.replaceState(null, '', '/')
    vi.doMock('./contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ ready: true, confirmed: true, user: null }),
    }))
    mockOccasions()
    const { default: App } = await import('./App')
    render(<App />)
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
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
    const { default: App } = await import('./App')
    render(<App />)
    // 未 ready 时既不应闪烁登录页……
    expect(screen.queryByLabelText('邮箱')).not.toBeInTheDocument()
    // ……也不应闪烁受保护页面内容（Home 的空态引导文案/新建入口）
    expect(screen.queryByText('记下第一个重要的日子')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('新建')).not.toBeInTheDocument()
  })
})
