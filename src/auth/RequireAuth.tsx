import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Role } from './AuthProvider'

/**
 * The gate in front of anything that needs an account.
 *
 * Waits on `checking` rather than treating a stored token as proof, so a token
 * that expired while a tab sat open does not flash a page open before bouncing.
 *
 * This is convenience, not security. It decides what to render; the backend
 * decides what a request may do, and re-checks the role on every one of them.
 */
export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode
  /** Omit for "any signed-in account". */
  roles?: Role[]
}) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'checking') return null

  if (status === 'signed-out' || !user) {
    // Remembers where they were headed, so signing in finishes the journey
    // instead of dumping them on a dashboard.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  // An account on a temporary password can only be in one place, and it is not
  // here. Checked before the role so an invited admin is sent to set a password
  // rather than being told they lack access.
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/no-access" replace />
  }

  return <>{children}</>
}
