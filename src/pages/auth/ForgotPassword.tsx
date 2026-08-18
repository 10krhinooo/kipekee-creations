import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthScene } from '../../components/auth/AuthScene'
import {
  AuthCard,
  AuthDone,
  AuthField,
  AuthFooter,
  AuthSubmit,
  Notice,
} from '../../components/auth/AuthUI'
import { api } from '../../lib/api'
import { isValidEmail } from '../../lib/validate'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const clearError = useCallback(() => setError(null), [])

  // Only complains once there is something to complain about. Focusing the
  // field and tabbing away has not gone wrong yet, and saying it has is how a
  // form starts feeling adversarial.
  const fieldError =
    touched && email.trim() && !isValidEmail(email) ? 'That does not look like an email address' : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValidEmail(email) || submitting) return

    setError(null)
    setSubmitting(true)
    const result = await api.post('/api/auth/password-reset/request', { email })
    setSubmitting(false)
    // The backend answers the same for a known and an unknown address, so the
    // only thing that can fail here is reaching it at all.
    if (result.ok) setSent(true)
    else setError(result.message)
  }

  return (
    <AuthScene>
      <AuthCard
        title="Reset your password"
        intro="Tell us the address you sign in with and we'll email you a link to set a new one."
      >
        {sent ? (
          <AuthDone title="Check your inbox">
            <p>
              If <span className="font-medium text-ink">{email}</span> has an account, a reset link
              is on its way. It expires in one hour.
            </p>
            <p className="mt-3">
              Nothing arrived? Check spam, then{' '}
              <button
                onClick={() => setSent(false)}
                className="text-brand underline underline-offset-2 hover:text-brand-700"
              >
                try another address
              </button>
              .
            </p>
          </AuthDone>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <AuthField
              label="Email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              disabled={submitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              error={fieldError}
              placeholder="you@example.com"
            />

            {error && <Notice onDismiss={clearError}>{error}</Notice>}

            <AuthSubmit busy={submitting} busyLabel="Sending…">
              Email me a reset link
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
