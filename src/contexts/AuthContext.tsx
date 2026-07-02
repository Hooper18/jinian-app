import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthContextType {
  user: User | null
  session: Session | null
  ready: boolean
  confirmed: boolean
  /** 点重置密码邮件回跳后进入的临时会话——此时应引导去改密码而非当已登录用。 */
  isRecoverySession: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | 'TIMEOUT'> {
  return Promise.race([p, new Promise<'TIMEOUT'>((resolve) => setTimeout(() => resolve('TIMEOUT'), ms))])
}

export function AuthProvider({
  children,
  timeoutMs = 3000,
}: {
  children: ReactNode
  timeoutMs?: number
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [isRecoverySession, setIsRecoverySession] = useState(false)

  useEffect(() => {
    let alive = true

    // 启动即抢：getSession 加超时，移动端 WebView 恢复场景可能永久 hang。
    void withTimeout(supabase.auth.getSession(), timeoutMs).then((res) => {
      if (!alive) return
      if (res === 'TIMEOUT') {
        // 超时不等于未登录，只是"暂未确认"——先乐观渲染，别卡转圈、别踢去登录页。
        setReady(true)
      } else {
        setSession(res.data.session)
        setReady(true)
        setConfirmed(true)
      }
    })

    // 拿到真实事件后再纠正（含密码登录后的 SIGNED_IN、重置密码回跳的 PASSWORD_RECOVERY）。
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (!alive) return
      setSession(s)
      setReady(true)
      setConfirmed(true)
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true)
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsRecoverySession(false)
      }
      // 若未来这里需要调用其它 supabase 方法（如拉 profile），必须用
      // setTimeout(fn, 0) 推迟，否则会触发 supabase-js 已知死锁。
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [timeoutMs])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        ready,
        confirmed,
        isRecoverySession,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
