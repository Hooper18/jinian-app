import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PasswordInput from '../components/PasswordInput'

type Mode = 'login' | 'register' | 'forgot'

export default function Auth() {
  const { signIn, signUp, resetPassword, user, ready } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // 已登录（含密码登录后 session 晚到 / 超时先踢来 /auth）就离开登录页回首页。
  if (ready && user) return <Navigate to="/" replace />

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setMessage('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'forgot') {
      setLoading(true)
      const { error } = await resetPassword(email)
      if (error) {
        const msg = error.message.toLowerCase()
        setError(
          msg.includes('rate') || msg.includes('too many')
            ? '请求太频繁，请稍后再试'
            : '发送失败，请稍后再试',
        )
      } else {
        setMessage('重置链接已发到邮箱，点开即可设置新密码。')
      }
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(
          error.message.includes('Invalid login credentials') ? '邮箱或密码不对' : error.message,
        )
      }
      // 成功后 onAuthStateChange → user 变化 → 顶部 Navigate 自动跳首页。
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(
          error.message.includes('already registered')
            ? '该邮箱已注册，直接登录即可'
            : error.message,
        )
      } else {
        setMessage('注册成功，请到邮箱点确认链接后再登录。')
        setPassword('')
        setConfirmPassword('')
      }
    }
    setLoading(false)
  }

  const primaryLabel =
    mode === 'login' ? '登录' : mode === 'register' ? '注册' : '发送重置链接'

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <h1 className="mb-6 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          纪念
        </h1>

        {mode !== 'forgot' && (
          <div
            className="mb-6 flex rounded-xl p-1"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
                style={
                  mode === m
                    ? { background: 'var(--bg-secondary)', color: 'var(--accent)' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            className="mb-2 block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mb-4 w-full rounded-xl border px-4 py-2.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
          />

          {mode !== 'forgot' && (
            <>
              <label
                htmlFor="password"
                className="mb-2 block text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                密码
              </label>
              <div className="mb-4">
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              <label
                htmlFor="confirm"
                className="mb-2 block text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                确认密码
              </label>
              <div className="mb-4">
                <PasswordInput
                  id="confirm"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? '请稍候…' : primaryLabel}
          </button>

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
        </form>

        {mode === 'login' && (
          <p className="mt-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            首次用密码登录、或忘记密码？
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="ml-1"
              style={{ color: 'var(--accent)' }}
            >
              去设置密码
            </button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="mt-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{ color: 'var(--accent)' }}
            >
              ← 返回登录
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
