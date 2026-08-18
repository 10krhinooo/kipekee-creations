import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthScene } from '../components/AuthScene'
import { AuthAlert, AuthCard, AuthDone, AuthField, AuthSubmit } from '../components/AuthUI'
import { requestPasswordReset } from '../auth'
import { isValidEmail } from '../../lib/validate'

export function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  // Only complains once there is something to complain about. Focusing the
  // field and tabbing away has not gone wrong yet, and saying it has is how a
  // form starts feeling adversarial. An empty submit is caught by `required`.
  const fieldError =
    touched && email.trim() && !isValidEmail(email) ? 'Enter a valid email address' : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValidEmail(email)) return
    setError(null)
    setSubmitting(true)
    const result = await requestPasswordReset(email)
    setSubmitting(false)
    // The backend answers the same way for a known and an unknown address, so
    // the only thing that can fail here is reaching it at all.
    if (result.ok) setSent(true)
    else setError(result.message ?? 'Something went wrong. Try again.')
  }

  return (
    <AuthScene>
      <AuthCard
        title="Reset your password"
        intro="Tell us the address you sign in with and we'll email you a link to set a new password."
      >
        {sent ? (
          <AuthDone title="Check your inbox">
            <p>
              If <span className="font-medium text-ink">{email}</span> belongs to a staff account, a
              reset link is on its way. It expires in one hour.
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
              onBlur={() => setTouched(true)}
              error={fieldError}
              placeholder="you@kipekeecreations.co.ke"
            />

            {error && <AuthAlert>{error}</AuthAlert>}

            <AuthSubmit busy={submitting} busyLabel="Sending…">
              Email me a reset link
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
