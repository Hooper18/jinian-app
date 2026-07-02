import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ResetPassword from './ResetPassword'

const updatePassword = vi.fn(async () => ({ error: null }))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ updatePassword }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>,
  )
}

describe('ResetPassword 页面', () => {
  beforeEach(() => updatePassword.mockClear())

  it('两次一致且≥6位时调用 updatePassword', async () => {
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

  it('密码不足 6 位时报错且不调用', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('新密码'), '123')
    await userEvent.type(screen.getByLabelText('确认新密码'), '123{Enter}')
    expect(await screen.findByText('密码至少 6 位')).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })
})
