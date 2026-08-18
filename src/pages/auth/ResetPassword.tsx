import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthScene } from '../../components/auth/AuthScene'
import {
  AuthCard,
  AuthDone,
  AuthFooter,
  AuthSubmit,
  Notice,
  PasswordField,
} from '../../components/auth/AuthUI'
import { api } from '../../lib/api'
import { MIN_PASSWORD_LENGTH, strengthOf } from '../../lib/password'

export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({ password: false, confirm: false })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const clearError = useCallback(() => setError(null), [])

  const passwordProblem =
    password.length === 0
      ? 'Choose a password'
      : password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters`
        : strengthOf(password).score === 1
          ? 'Choose something harder to guess'
          : undefined
  const confirmProblem =
    confirm !== password ? 'The two passwords do not match' : confirm ? undefined : 'Type it again'

  const canSubmit = !passwordProblem && !confirmProblem

  // A link with no token never had a chance of working, so say so up front
  // rather than after somebody has typed a password twice.
  if (!token) {
    return (
      <AuthScene>
        <AuthCard
          title="That link is incomplete"
          intro="Reset links carry a one-time token, and this one arrived without it."
        >
          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            Copy the link straight from the email rather than retyping it, or ask for a fresh one.
          </p>
          <AuthFooter>
            <Link to="/forgot-password" className="text-brand underline underline-offset-2">
              Request a new reset link
            </Link>
          </AuthFooter>
        </AuthCard>
      </AuthScene>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (!canSubmit || submitting) return

    setError(null)
    setSubmitting(true)
    const result = await api.post('/api/auth/password-reset/confirm', { token, password })
    setSubmitting(false)
    if (result.ok) setDone(true)
    else setError(result.message)
  }

  return (
    <AuthScene>
      <AuthCard title="Set a new password" intro="Choose something you have not used here before.">
        {done ? (
          <AuthDone title="Password changed">
            <p>
              Every other session signed in as you has been ended, so anyone still holding the old
              password is out.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Sign in
            </button>
          </AuthDone>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <PasswordField
              label="New password"
              hint={`${MIN_PASSWORD_LENGTH} characters or more`}
              strength
              required
              autoComplete="new-password"
              autoFocus
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
              Save new password
            </AuthSubmit>
          </form>
        )}

        <AuthFooter>
          <Link to="/login" className="text-ink underline underline-offset-2 hover:text-brand">
            Back to sign in
          </Link>
        </AuthFooter>
      </AuthCard>
    </AuthScene>
  )
}
