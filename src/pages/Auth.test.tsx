import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Auth from './Auth'

const signInWithMagicLink = vi.fn(async () => ({ error: null }))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signInWithMagicLink }),
}))

describe('Auth 页面', () => {
  it('输入邮箱并提交后调用 signInWithMagicLink', async () => {
    render(<Auth />)
    const input = screen.getByLabelText('邮箱')
    await userEvent.type(input, 'me@example.com')
    await userEvent.click(screen.getByRole('button', { name: '发送登录链接' }))
    expect(signInWithMagicLink).toHaveBeenCalledWith('me@example.com')
  })

  it('提交成功后显示"已发送"提示', async () => {
    render(<Auth />)
    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com')
    await userEvent.click(screen.getByRole('button', { name: '发送登录链接' }))
    expect(await screen.findByText(/已发送/)).toBeInTheDocument()
  })
})
