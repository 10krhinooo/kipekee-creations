import { useCallback, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthScene } from '../../components/auth/AuthScene'
import {
  AuthCard,
  AuthFooter,
  AuthSubmit,
  Notice,
  PasswordField,
} from '../../components/auth/AuthUI'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { MIN_PASSWORD_LENGTH, strengthOf } from '../../lib/password'

/**
 * Changing your own password, knowing the current one.
 *
 * Not a forced screen any more - an invited account sets its first password
 * from the invite link instead, and never holds one it did not choose. What is
 * left is the voluntary change, which ends every session including this one,
 * hence the sign-out at the end rather than pretending this session survived.
 */
export function ChangePassword() {
  const { status, logout } = useAuth()
  const navigate = useNavigate()

  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({ current: false, password: false, confirm: false })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clearError = useCallback(() => setError(null), [])

  const currentProblem = current ? undefined : 'Enter your current password'
  const passwordProblem =
    password.length === 0
      ? 'Choose a password'
      : password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters`
        : password === current
          ? 'Choose something different from the current one'
          : strengthOf(password).score === 1
            ? 'Choose something harder to guess'
            : undefined
  const confirmProblem =
    confirm !== password ? 'The two passwords do not match' : confirm ? undefined : 'Type it again'

  const canSubmit = !currentProblem && !passwordProblem && !confirmProblem

  if (status === 'signed-out') return <Navigate to="/login" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ current: true, password: true, confirm: true })
    if (!canSubmit || submitting) return

    setError(null)
    setSubmitting(true)
    const result = await api.post('/api/account/password', {
      currentPassword: current,
      newPassword: password,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    // The server dropped every session, this one included, so the token in
    // hand is already dead. Clearing it locally and going to the login screen
    // is the honest end to this, rather than leaving the app holding a
    // credential that will 401 on the next click.
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AuthScene>
      <AuthCard
        title="Change your password"
        intro="You will be signed out everywhere and can sign back in with the new one."
      >
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <PasswordField
            label="Current password"
            required
            autoComplete="current-password"
            autoFocus
            disabled={submitting}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, current: true }))}
            error={touched.current ? currentProblem : undefined}
            placeholder="Your current password"
          />

          <PasswordField
            label="New password"
            hint={`${MIN_PASSWORD_LENGTH} characters or more`}
            strength
            required
            autoComplete="new-password"
            disabled={submitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password ? passwordProblem : undefined}
            placeholder="A phrase you will remember"
          />

          <PasswordField
            label="Confirm new password"
            required
            autoComplete="new-password"
            disabled={submitting}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            error={touched.confirm ? confirmProblem : undefined}
            placeholder="Type it again"
          />

          {error && <Notice onDismiss={clearError}>{error}</Notice>}

          <AuthSubmit busy={submitting} busyLabel="Saving…">
            Save password
          </AuthSubmit>
        </form>

        <AuthFooter>
          <button
            onClick={() => navigate(-1)}
            className="text-ink underline underline-offset-2 hover:text-brand"
          >
            Back
          </button>
        </AuthFooter>
      </AuthCard>
    </AuthScene>
  )
}
