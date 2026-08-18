import { useCallback, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthScene, type SceneState } from '../components/AuthScene'
import { AuthAlert, AuthCard, AuthField, AuthSubmit } from '../components/AuthUI'
import { useAdminAuth } from '../auth'

export function AdminLogin() {
  const { status, login } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [scene, setScene] = useState<SceneState>('opening')

  const target = (location.state as { from?: string } | null)?.from ?? '/admin'

  // Only a sign-in that happened *on this screen* gets the closing curtain.
  // Arriving already signed in redirects immediately, because making someone
  // watch an animation to reach a page they already have access to is a cost,
  // not a flourish.
  const enter = useCallback(() => navigate(target, { replace: true }), [navigate, target])

  if (status === 'signed-in' && scene === 'opening') return <Navigate to={target} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (result.ok) setScene('closing')
    else setError(result.message)
  }

  return (
    <AuthScene state={scene} onClosed={enter}>
      <AuthCard
        title="Sign in to the workshop"
        intro="Quotes, orders, fittings and stock, all behind one door."
      >
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
            placeholder="you@kipekeecreations.co.ke"
          />

          <AuthField
            label="Password"
            hint={
              <Link to="/admin/forgot-password" className="text-brand hover:underline">
                Forgot it?
              </Link>
            }
            type="password"
            required
            autoComplete="current-password"
            disabled={submitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <AuthAlert>{error}</AuthAlert>}

          <AuthSubmit busy={submitting} busyLabel="Opening…">
            Sign in
          </AuthSubmit>
        </form>

        <p data-field className="mt-6 text-center text-[12.5px] leading-relaxed text-muted">
          Staff access only. Ask your manager for a login.
        </p>
      </AuthCard>
    </AuthScene>
  )
}
