import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { passwordErrorMessage } from '../lib/authError'
import PasswordInput from '../components/PasswordInput'

export default function Settings() {
  const { user, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
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
      setError(passwordErrorMessage(error.message))
    } else {
      setMessage('密码已更新，下次用邮箱 + 这个密码登录。')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-8 flex items-center">
        <button onClick={() => navigate(-1)} aria-label="返回" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={22} />
        </button>
        <h1 className="ml-1 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          设置
        </h1>
      </div>

      <section className="mb-8">
        <p className="mb-2 text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
          账号
        </p>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {user?.email ?? '—'}
        </p>
      </section>

      <section className="mb-8">
        <p className="mb-2 text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
          数据
        </p>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          你的日子都保存在云端。换手机或重装后，用同一邮箱登录即可全部恢复。
        </p>
      </section>

      <section className="mb-10">
        <p className="mb-3 text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
          修改密码
        </p>
        <form onSubmit={handleSave}>
          <label
            htmlFor="settings-new-password"
            className="mb-2 block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            新密码
          </label>
          <div className="mb-4">
            <PasswordInput
              id="settings-new-password"
              value={newPassword}
              onChange={setNewPassword}
              required
              autoComplete="new-password"
            />
          </div>
          <label
            htmlFor="settings-confirm-password"
            className="mb-2 block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            确认新密码
          </label>
          <div className="mb-4">
            <PasswordInput
              id="settings-confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? '保存中…' : '保存密码'}
          </button>
          {error && (
            <p className="mt-3 text-sm" style={{ color: 'var(--accent)' }}>
              {error}
            </p>
          )}
          {message && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          )}
        </form>
      </section>

      <section>
        <button onClick={handleLogout} className="text-sm" style={{ color: 'var(--accent)' }}>
          退出登录
        </button>
      </section>
    </div>
  )
}
