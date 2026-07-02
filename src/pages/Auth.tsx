import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { signInWithMagicLink, user, ready } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // magic-link 回跳后 session 可能晚于首次渲染到达（或 getSession 超时先把人踢来 /auth）。
  // 一旦确认已登录，就离开登录页回首页——否则会「明明登录成功却卡在登录页」。
  if (ready && user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await signInWithMagicLink(email)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <h1 className="mb-6 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          纪念
        </h1>
        <label htmlFor="email" className="mb-2 block text-sm" style={{ color: 'var(--text-secondary)' }}>
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-xl border px-4 py-2.5 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
        />
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          发送登录链接
        </button>
        {sent && (
          <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            已发送登录链接到你的邮箱，请查收。
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm" style={{ color: 'var(--accent)' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
