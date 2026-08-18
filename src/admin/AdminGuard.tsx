import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from './auth'

export function AdminGuard({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth()
  const location = useLocation()

  // 'checking' revalidates the stored token against the backend before
  // committing to signed-in or signed-out, so a stale/expired token in
  // sessionStorage does not flash the admin console open before bouncing.
  if (status === 'checking') return null

  if (status === 'signed-out') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
