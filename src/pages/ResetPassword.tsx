import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [expired, setExpired] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setExpired(false)

    if (newPassword.length < 6) {
      setError('密码至少 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(newPassword)
    if (error) {
      const msg = error.message.toLowerCase()
      if (
        msg.includes('session') ||
        msg.includes('not authenticated') ||
        msg.includes('auth session missing')
      ) {
        setError('链接已过期，请回登录页重新发起「去设置密码」')
        setExpired(true)
      } else {
        setError('保存失败，请稍后再试')
      }
    } else {
      setMessage('密码已更新，正在进入…')
      setTimeout(() => navigate('/'), 1500)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <h1 className="mb-1 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          设置新密码
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          输入一个至少 6 位的新密码。
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            新密码
          </label>
          <div className="mb-4">
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={setNewPassword}
              required
              autoComplete="new-password"
            />
          </div>

          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            确认新密码
          </label>
          <div className="mb-4">
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              autoComplete="new-password"
            />
          </div>

          {!message && (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? '保存中…' : '保存新密码'}
            </button>
          )}

          {error && (
            <p className="mt-4 text-sm" style={{ color: 'var(--accent)' }}>
              {error}
            </p>
          )}
          {message && (
            <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          )}
          {expired && (
            <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                style={{ color: 'var(--accent)' }}
              >
                返回登录页
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
