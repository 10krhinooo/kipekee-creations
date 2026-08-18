import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setAuthToken } from '../lib/api'

/**
 * One session for the whole app, staff and customers alike.
 *
 * There is deliberately no separate staff session. Both audiences prove
 * identity the same way and the only difference is `role`, which decides where
 * they are let in. Two providers would have meant two of everything behind
 * them, and somewhere for the two to drift apart.
 *
 * The role here is for *routing* only. It picks which screens to show and
 * where to send somebody after signing in; every protected endpoint re-checks
 * it server-side, because a role held in the browser is a suggestion.
 */

const STORAGE_KEY = 'kipekee.session.v2'

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export interface User {
  name: string
  email: string
  phone: string | null
  role: Role
  /** True while on a temporary password: the app must send them to change it. */
  mustChangePassword: boolean
}

interface StoredSession extends User {
  token: string
}

export type AuthResult = { ok: true } | { ok: false; message: string }

interface AuthApi {
  status: 'checking' | 'signed-in' | 'signed-out'
  user: User | null
  /** Convenience for the many places that branch on "may see the console". */
  isStaff: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (input: {
    name: string
    email: string
    phone: string
    password: string
  }) => Promise<AuthResult>
  logout: () => Promise<void>
  /** Re-reads the profile, after a change made elsewhere in the account area. */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.token === 'string' && typeof parsed?.role === 'string') return parsed
    return null
  } catch {
    return null
  }
}

function writeStored(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private browsing or a full quota must not stop the shop working.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null)
  const [status, setStatus] = useState<AuthApi['status']>('checking')

  const adopt = useCallback((next: StoredSession | null) => {
    setAuthToken(next?.token ?? null)
    writeStored(next)
    setSession(next)
    setStatus(next ? 'signed-in' : 'signed-out')
  }, [])

  // A stored token is revalidated rather than trusted. The backend expires
  // staff sessions in twelve hours, so a tab left open overnight holds a token
  // that looks fine here and is not.
  useEffect(() => {
    const stored = readStored()
    if (!stored) {
      setStatus('signed-out')
      return
    }

    setAuthToken(stored.token)
    let cancelled = false

    api.get<Omit<StoredSession, 'token'>>('/api/auth/session').then((result) => {
      if (cancelled) return
      if (result.ok) {
        adopt({ ...result.data, token: stored.token })
        return
      }
      // A refused token is a dead session. A network failure is not, and
      // signing somebody out over a blip - losing their place and making them
      // find their password - is the worse of the two mistakes.
      if (result.status === 401 || result.status === 403) {
        adopt(null)
      } else {
        setSession(stored)
        setStatus('signed-in')
      }
    })

    return () => {
      cancelled = true
    }
  }, [adopt])

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await api.post<StoredSession>('/api/auth/login', { email, password })
      if (!result.ok) return { ok: false, message: result.message }
      adopt(result.data)
      return { ok: true }
    },
    [adopt],
  )

  const register = useCallback(
    async (input: {
      name: string
      email: string
      phone: string
      password: string
    }): Promise<AuthResult> => {
      const result = await api.post<StoredSession>('/api/auth/register', {
        ...input,
        phone: input.phone.trim() || null,
      })
      if (!result.ok) return { ok: false, message: result.message }
      // The backend signs a new account straight in. Making somebody who just
      // proved they can pick a password type it again is friction with nothing
      // behind it.
      adopt(result.data)
      return { ok: true }
    },
    [adopt],
  )

  const logout = useCallback(async () => {
    // Tells the server first, so signing out on a shared machine actually ends
    // the session rather than only forgetting the token on this device.
    await api.post('/api/auth/logout')
    adopt(null)
  }, [adopt])

  const refresh = useCallback(async () => {
    if (!session) return
    const result = await api.get<Omit<StoredSession, 'token'>>('/api/account/profile')
    if (result.ok) adopt({ ...result.data, token: session.token })
  }, [adopt, session])

  const value = useMemo<AuthApi>(() => {
    const user: User | null = session
      ? {
          name: session.name,
          email: session.email,
          phone: session.phone,
          role: session.role,
          mustChangePassword: session.mustChangePassword,
        }
      : null

    return {
      status,
      user,
      isStaff: user?.role === 'STAFF' || user?.role === 'ADMIN',
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      refresh,
    }
  }, [session, status, login, register, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Where somebody belongs after signing in, when they had no particular destination. */
export const homeFor = (role: Role) => (role === 'CUSTOMER' ? '/account' : '/admin')
