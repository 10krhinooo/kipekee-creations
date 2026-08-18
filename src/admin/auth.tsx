import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

/**
 * The admin session, backed by `kipekee-creations-backend`'s
 * `POST /api/admin/login` and `GET /api/admin/session`.
 *
 * `sessionStorage`, not `localStorage`: a shared/kiosk machine should not stay
 * signed in to the admin console across browser restarts the way a customer's
 * basket should. On load, a stored token is revalidated against the backend
 * rather than trusted outright, since it may have expired server-side (the
 * backend's session TTL is 12 hours) while the tab stayed open.
 */

const STORAGE_KEY = 'kipekee.admin.session.v1'

interface StoredSession {
  token: string
  name: string
  email: string
}

interface AdminAuthApi {
  status: 'checking' | 'signed-in' | 'signed-out'
  name: string | null
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthApi | null>(null)

function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.token === 'string' && typeof parsed?.name === 'string') return parsed
    return null
  } catch {
    return null
  }
}

function writeStored(session: StoredSession | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private browsing or a full quota must not crash the admin console.
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null)
  const [status, setStatus] = useState<AdminAuthApi['status']>('checking')

  useEffect(() => {
    const stored = readStored()
    if (!stored) {
      setStatus('signed-out')
      return
    }

    let cancelled = false
    fetch('/api/admin/session', { headers: { Authorization: `Bearer ${stored.token}` } })
      .then((res) => {
        if (cancelled) return
        if (res.ok) {
          setSession(stored)
          setStatus('signed-in')
        } else {
          writeStored(null)
          setStatus('signed-out')
        }
      })
      .catch(() => {
        // Backend unreachable: fall back to trusting the stored token rather
        // than locking staff out of the admin console over a network blip.
        if (cancelled) return
        setSession(stored)
        setStatus('signed-in')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        return { ok: false as const, message: body?.message ?? 'Incorrect email or password' }
      }
      const data: StoredSession = await res.json()
      writeStored(data)
      setSession(data)
      setStatus('signed-in')
      return { ok: true as const }
    } catch {
      return { ok: false as const, message: 'Could not reach the server. Check your connection and try again.' }
    }
  }, [])

  const logout = useCallback(() => {
    writeStored(null)
    setSession(null)
    setStatus('signed-out')
  }, [])

  return (
    <AdminAuthContext.Provider value={{ status, name: session?.name ?? null, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
