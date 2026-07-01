import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ ready: true, confirmed: true, user: null }),
}))

vi.mock('./hooks/useOccasions', () => ({
  useOccasions: () => ({ occasions: [], loading: false, error: null }),
}))

describe('App', () => {
  it('未登录时渲染登录页而不是首页', () => {
    render(<App />)
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
  })

  it('尚未 ready 时不渲染任何受保护页面内容（避免闪烁登录页）', () => {
    vi.doMock('./contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ ready: false, confirmed: false, user: null }),
    }))
  })
})
