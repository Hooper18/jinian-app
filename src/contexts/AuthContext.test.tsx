import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../lib/supabase', () => {
  const listeners: Array<(event: string, session: unknown) => void> = []
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
          listeners.push(cb)
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
        signInWithOtp: vi.fn(async () => ({ error: null })),
        signOut: vi.fn(async () => undefined),
      },
      __listeners: listeners,
    },
  }
})

function Probe() {
  const { ready, confirmed, user } = useAuth()
  return (
    <div>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="confirmed">{String(confirmed)}</span>
      <span data-testid="user">{user ? user.id : 'none'}</span>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSession 正常返回时，ready 与 confirmed 都变 true', async () => {
    const { supabase } = await import('../lib/supabase')
    ;(supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))
    expect(screen.getByTestId('confirmed').textContent).toBe('true')
    expect(screen.getByTestId('user').textContent).toBe('u1')
  })

  it('getSession 长时间不resolve时，超时后 ready=true 但 confirmed=false（乐观渲染，不误判为未登录）', async () => {
    const { supabase } = await import('../lib/supabase')
    // 永不 resolve 的 Promise，模拟卡死
    ;(supabase.auth.getSession as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider timeoutMs={50}>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'), {
      timeout: 1000,
    })
    expect(screen.getByTestId('confirmed').textContent).toBe('false')
  })

  it('onAuthStateChange 事件到达后能纠正超时后的乐观状态', async () => {
    const { supabase } = await import('../lib/supabase')
    ;(supabase.auth.getSession as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider timeoutMs={50}>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))

    const listeners = (supabase as unknown as { __listeners: Array<(e: string, s: unknown) => void> })
      .__listeners
    listeners.forEach((cb) => cb('SIGNED_IN', { user: { id: 'u2' } }))

    await waitFor(() => expect(screen.getByTestId('confirmed').textContent).toBe('true'))
    expect(screen.getByTestId('user').textContent).toBe('u2')
  })
})
