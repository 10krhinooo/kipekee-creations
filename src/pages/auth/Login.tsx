import { useCallback, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthScene } from '../../components/auth/AuthScene'
import {
  AuthCard,
  AuthField,
  AuthFooter,
  AuthSubmit,
  Notice,
  PasswordField,
} from '../../components/auth/AuthUI'
import { homeFor, useAuth } from '../../auth/AuthProvider'

/**
 * One sign-in screen for everybody.
 *
 * Nothing here asks or cares whether the person is staff. The backend answers
 * with a role and the app routes on it, which is what lets there be a single
 * screen instead of a customer one and a workshop one that slowly diverge.
 */
export function Login() {
  const { status, user, login } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clearError = useCallback(() => setError(null), [])
  const from = (location.state as { from?: string } | null)?.from

  if (status === 'signed-in' && user) {
    // Somebody on a temporary password has exactly one place to be.
    if (user.mustChangePassword) return <Navigate to="/change-password" replace />
    return <Navigate to={from ?? homeFor(user.role)} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    // Only the failure is handled here. On success the redirect above fires on
    // the next render and already knows where this person belongs; navigating
    // by hand as well raced it, and whichever won decided the destination.
    if (!result.ok) setError(result.message)
  }

  return (
    <AuthScene>
      <AuthCard title="Sign in" intro="Your orders, saved list and delivery details, kept together.">
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <AuthField
            label="Email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <PasswordField
            label="Password"
            hint={
              <Link to="/forgot-password" className="text-brand hover:underline">
                Forgot it?
              </Link>
            }
            required
            autoComplete="current-password"
            disabled={submitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />

          {error && <Notice onDismiss={clearError}>{error}</Notice>}

          <AuthSubmit busy={submitting} busyLabel="Signing in…">
            Sign in
          </AuthSubmit>
        </form>

        <AuthFooter>
          New here?{' '}
          <Link to="/register" className="text-brand underline underline-offset-2">
            Create an account
          </Link>
          <br />
          You can always order as a guest without one.
        </AuthFooter>
      </AuthCard>
    </AuthScene>
  )
}
