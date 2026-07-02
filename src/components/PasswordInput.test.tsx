import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from './PasswordInput'

describe('PasswordInput', () => {
  it('默认隐藏，点眼睛在显示/隐藏间切换', async () => {
    render(<PasswordInput id="p" value="secret" onChange={vi.fn()} />)
    const input = document.getElementById('p') as HTMLInputElement
    expect(input.type).toBe('password')

    await userEvent.click(screen.getByRole('button', { name: '显示密码' }))
    expect(input.type).toBe('text')

    await userEvent.click(screen.getByRole('button', { name: '隐藏密码' }))
    expect(input.type).toBe('password')
  })

  it('输入时触发 onChange', async () => {
    const onChange = vi.fn()
    render(<PasswordInput id="p" value="" onChange={onChange} />)
    await userEvent.type(document.getElementById('p') as HTMLInputElement, 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })
})
