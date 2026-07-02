import type { AuthError } from '@supabase/supabase-js'

/** 判断是否是「会话过期 / 令牌失效」类错误——这类可以尝试刷新会话后重试。 */
export function isSessionError(error: Pick<AuthError, 'status' | 'message'> | null): boolean {
  if (!error) return false
  if (error.status === 401 || error.status === 403) return true
  return /session|jwt|token|expired|missing|not authenticated|unauthorized/i.test(error.message)
}

/** 把 Supabase 的英文密码错误映射成能看懂的中文；无法识别时原样返回，绝不吞掉真实原因。 */
export function passwordErrorMessage(raw: string): string {
  const m = (raw || '').toLowerCase()
  if (m.includes('different from the old') || m.includes('should be different') || m.includes('same_password')) {
    return '新密码不能和当前密码相同'
  }
  if (m.includes('weak') || m.includes('pwned') || m.includes('breach') || m.includes('easy to guess') || m.includes('compromised')) {
    return '这个密码太简单或曾在泄露库里出现过，换一个复杂点的'
  }
  if (m.includes('at least') || m.includes('too short') || (m.includes('characters') && m.includes('password'))) {
    return '密码太短，至少 6 位'
  }
  if (isSessionError({ status: 0, message: raw })) {
    return '登录状态已过期。请刷新页面或退出重新登录后再改（也可到登录页用「去设置密码」走邮件重置）。'
  }
  return raw || '保存失败，请稍后再试'
}
