import { useEffect, useState } from 'react'
import { subscribeToast } from '../lib/toast'

const DEFAULT_DURATION_MS = 2000

export default function ToastHost() {
  const [msg, setMsg] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION_MS)
  const [token, setToken] = useState(0)

  useEffect(() => {
    return subscribeToast((p) => {
      setMsg(p.message)
      setDuration(p.durationMs ?? DEFAULT_DURATION_MS)
      setToken((n) => n + 1)
    })
  }, [])

  useEffect(() => {
    if (!msg) return
    const id = window.setTimeout(() => setMsg(''), duration)
    return () => window.clearTimeout(id)
  }, [msg, duration, token])

  if (!msg) return null
  return (
    <div
      key={token}
      role="status"
      aria-live="polite"
      onClick={() => setMsg('')}
      className="fixed bottom-10 left-1/2 z-50 max-w-[85vw] -translate-x-1/2 cursor-pointer break-words rounded-2xl px-4 py-3 text-center text-sm leading-snug text-white"
      style={{ background: 'rgba(43,42,39,0.9)' }}
    >
      {msg}
    </div>
  )
}
