import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Auth from './Auth'

const signIn = vi.fn(async () => ({ error: null }))
const signUp = vi.fn(async () => ({ error: null }))
const resetPassword = vi.fn(async () => ({ error: null }))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signIn, signUp, resetPassword, user: null, ready: true }),
}))

describe('Auth 页面', () => {
  beforeEach(() => {
    signIn.mockClear()
    signUp.mockClear()
    resetPassword.mockClear()
  })

  it('登录：邮箱+密码提交调用 signIn', async () => {
    render(<Auth />)
    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('密码'), 'secret123{Enter}')
    expect(signIn).toHaveBeenCalledWith('me@example.com', 'secret123')
  })

  it('密码不足 6 位时报错且不调用 signIn', async () => {
    render(<Auth />)
    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('密码'), '123{Enter}')
    expect(await screen.findByText('密码至少 6 位')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('注册：两次密码不一致时报错且不调用 signUp', async () => {
    render(<Auth />)
    await userEvent.click(screen.getByRole('button', { name: '注册' }))
    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('密码'), 'secret123')
    await userEvent.type(screen.getByLabelText('确认密码'), 'secret999{Enter}')
    expect(await screen.findByText('两次输入的密码不一致')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('注册：一致且≥6位时调用 signUp', async () => {
    render(<Auth />)
    await userEvent.click(screen.getByRole('button', { name: '注册' }))
    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('密码'), 'secret123')
    await userEvent.type(screen.getByLabelText('确认密码'), 'secret123{Enter}')
    expect(signUp).toHaveBeenCalledWith('me@example.com', 'secret123')
  })

  it('忘记密码：提交调用 resetPassword', async () => {
    render(<Auth />)
    await userEvent.click(screen.getByRole('button', { name: '去设置密码' }))
    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com{Enter}')
    expect(resetPassword).toHaveBeenCalledWith('me@example.com')
  })
})
