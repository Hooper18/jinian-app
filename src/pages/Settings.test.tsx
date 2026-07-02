import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from './Settings'

const updatePassword = vi.fn(async () => ({ error: null }))
const signOut = vi.fn(async () => undefined)
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'me@example.com' }, updatePassword, signOut }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  )
}

describe('Settings 设置页', () => {
  beforeEach(() => {
    updatePassword.mockClear()
    signOut.mockClear()
    mockNavigate.mockClear()
  })

  it('显示账号邮箱', () => {
    renderPage()
    expect(screen.getByText('me@example.com')).toBeInTheDocument()
  })

  it('显示换设备云端恢复说明', () => {
    renderPage()
    expect(screen.getByText(/用同一邮箱登录即可全部恢复/)).toBeInTheDocument()
  })

  it('两次一致且≥6位时保存调用 updatePassword', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('新密码'), 'secret123')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'secret123{Enter}')
    expect(updatePassword).toHaveBeenCalledWith('secret123')
  })

  it('两次不一致时报错且不调用', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('新密码'), 'secret123')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'nope1234{Enter}')
    expect(await screen.findByText('两次输入的密码不一致')).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('退出登录调用 signOut 并跳转 /auth', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '退出登录' }))
    expect(signOut).toHaveBeenCalled()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true }))
  })
})
