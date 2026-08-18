import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthScene } from '../components/AuthScene'
import { AuthAlert, AuthCard, AuthDone, AuthField, AuthSubmit } from '../components/AuthUI'
import { resetPassword } from '../auth'

/**
 * Short, and deliberately not a policy engine. A staff console for one workshop
 * needs a floor on password length, not a character-class checklist that pushes
 * people towards writing the password on the monitor.
 */
const MIN_LENGTH = 10

export function AdminResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({ password: false, confirm: false })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const tooShort = password.length > 0 && password.length < MIN_LENGTH
  const passwordError = touched.password && tooShort ? `Use at least ${MIN_LENGTH} characters` : undefined
  const confirmError =
    touched.confirm && confirm !== '' && confirm !== password ? 'The two passwords do not match' : undefined
  const canSubmit = password.length >= MIN_LENGTH && confirm === password

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    const result = await resetPassword(token, password)
    setSubmitting(false)
    if (result.ok) setDone(true)
    else setError(result.message ?? 'Something went wrong. Try again.')
  }

  // A link with no token in it never had a chance of working, so say so up
  // front rather than after someone has typed a password twice.
  if (!token) {
    return (
      <AuthScene>
        <AuthCard
          title="That link is incomplete"
          intro="Reset links carry a one-time token, and this one arrived without it."
        >
          <p data-field className="mt-6 text-[13px] leading-relaxed text-muted">
            Copy the link straight from the email rather than retyping it, or ask for a fresh one.
          </p>
          <p data-field className="mt-6 text-center text-[12.5px] text-muted">
            <Link to="/admin/forgot-password" className="text-brand underline underline-offset-2">
              Request a new reset link
            </Link>
          </p>
        </AuthCard>
      </AuthScene>
    )
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
              onClick={() => navigate('/admin/login', { replace: true })}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Sign in
            </button>
          </AuthDone>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <AuthField
              label="New password"
              hint={`${MIN_LENGTH} characters or more`}
              type="password"
              required
              autoComplete="new-password"
              autoFocus
              disabled={submitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={passwordError}
              placeholder="••••••••••"
            />

            <AuthField
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              disabled={submitting}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              error={confirmError}
              placeholder="••••••••••"
            />

            {error && <AuthAlert>{error}</AuthAlert>}

            <AuthSubmit busy={submitting} busyLabel="Saving…">
              Save new password
            </AuthSubmit>
          </form>
        )}

        <p data-field className="mt-6 text-center text-[12.5px] text-muted">
          <Link to="/admin/login" className="text-ink underline underline-offset-2 hover:text-brand">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    </AuthScene>
  )
}
