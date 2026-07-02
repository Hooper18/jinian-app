import { describe, it, expect } from 'vitest'
import { isSessionError, passwordErrorMessage } from './authError'

describe('isSessionError', () => {
  it('401 / 403 视为会话错误', () => {
    expect(isSessionError({ status: 401, message: 'x' })).toBe(true)
    expect(isSessionError({ status: 403, message: 'x' })).toBe(true)
  })
  it('会话类文案视为会话错误', () => {
    expect(isSessionError({ status: 0, message: 'Auth session missing!' })).toBe(true)
    expect(isSessionError({ status: 0, message: 'invalid JWT' })).toBe(true)
    expect(isSessionError({ status: 0, message: 'token is expired' })).toBe(true)
  })
  it('null 与普通业务错误不算', () => {
    expect(isSessionError(null)).toBe(false)
    expect(isSessionError({ status: 400, message: 'Password should be at least 6 characters' })).toBe(false)
  })
})

describe('passwordErrorMessage', () => {
  it('映射常见密码错误为中文', () => {
    expect(passwordErrorMessage('New password should be different from the old password.')).toMatch(/不能和当前密码相同/)
    expect(passwordErrorMessage('Password is known to be weak and easy to guess')).toMatch(/太简单|泄露/)
    expect(passwordErrorMessage('Password should be at least 6 characters')).toMatch(/至少 6 位/)
    expect(passwordErrorMessage('Auth session missing!')).toMatch(/登录状态已过期/)
  })
  it('无法识别时原样返回，不吞真实原因', () => {
    expect(passwordErrorMessage('Some unexpected backend error')).toBe('Some unexpected backend error')
  })
})
