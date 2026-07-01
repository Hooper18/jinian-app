import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
