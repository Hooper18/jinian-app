const EVENT = 'jinian:toast'

export interface ToastPayload {
  message: string
  durationMs?: number
}

export function showToast(message: string, opts?: { durationMs?: number }): void {
  if (typeof window === 'undefined') return
  const detail: ToastPayload = { message, durationMs: opts?.durationMs }
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

export function subscribeToast(cb: (p: ToastPayload) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail as ToastPayload)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
