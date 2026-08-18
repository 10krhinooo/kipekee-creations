import { useCallback, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
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
import { isValidEmail, isValidKenyanPhone } from '../../lib/validate'
import { MIN_PASSWORD_LENGTH, strengthOf } from '../../lib/password'

/**
 * Creating a customer account.
 *
 * Validation is per field and fires on blur, not on submit. Being told about
 * four problems at once after pressing a button is the version people abandon,
 * and every message here says what the field wants rather than that it is
 * wrong.
 *
 * There is no role control, and there must never be one: the backend hard-wires
 * a new account to CUSTOMER precisely because this screen is public.
 */
type Field = 'name' | 'email' | 'phone' | 'password' | 'confirm'

export function Register() {
  const { status, user, register } = useAuth()

  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirm: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clearError = useCallback(() => setError(null), [])
  const set = (field: Field) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: e.target.value }))
  const touch = (field: Field) => () => setTouched((t) => ({ ...t, [field]: true }))

  const problems = validate(values)
  const showing = (field: Field) => (touched[field] ? problems[field] : undefined)
  const canSubmit = Object.values(problems).every((p) => p === undefined)

  if (status === 'signed-in' && user) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true })
    if (!canSubmit || submitting) return

    setError(null)
    setSubmitting(true)
    const result = await register({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    })
    setSubmitting(false)
    // A successful register signs in, and the redirect above takes it from here.
    if (!result.ok) setError(result.message)
  }

  return (
    <AuthScene>
      <AuthCard
        title="Create your account"
        intro="So your orders, saved list and delivery details are waiting next time."
      >
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <AuthField
            label="Full name"
            required
            autoComplete="name"
            autoFocus
            disabled={submitting}
            value={values.name}
            onChange={set('name')}
            onBlur={touch('name')}
            error={showing('name')}
            placeholder="Jane Wanjiru"
          />

          <AuthField
            label="Email"
            type="email"
            required
            autoComplete="email"
            disabled={submitting}
            value={values.email}
            onChange={set('email')}
            onBlur={touch('email')}
            error={showing('email')}
            placeholder="you@example.com"
          />

          <AuthField
            label="Phone"
            hint="Optional"
            type="tel"
            autoComplete="tel"
            disabled={submitting}
            value={values.phone}
            onChange={set('phone')}
            onBlur={touch('phone')}
            error={showing('phone')}
            placeholder="07XX XXX XXX"
          />

          <PasswordField
            label="Password"
            hint={`${MIN_PASSWORD_LENGTH} characters or more`}
            strength
            required
            autoComplete="new-password"
            disabled={submitting}
            value={values.password}
            onChange={set('password')}
            onBlur={touch('password')}
            error={showing('password')}
            placeholder="A phrase you will remember"
          />

          <PasswordField
            label="Confirm password"
            required
            autoComplete="new-password"
            disabled={submitting}
            value={values.confirm}
            onChange={set('confirm')}
            onBlur={touch('confirm')}
            error={showing('confirm')}
            placeholder="Type it again"
          />

          {error && <Notice onDismiss={clearError}>{error}</Notice>}

          <AuthSubmit busy={submitting} busyLabel="Creating your account…">
            Create account
          </AuthSubmit>
        </form>

        <AuthFooter>
          Already have one?{' '}
          <Link to="/login" className="text-brand underline underline-offset-2">
            Sign in
          </Link>
        </AuthFooter>
      </AuthCard>
    </AuthScene>
  )
}

/**
 * One place that decides what is wrong, so the submit guard and the per-field
 * messages can never disagree about whether the form is ready.
 */
function validate(values: Record<Field, string>): Partial<Record<Field, string>> {
  const problems: Partial<Record<Field, string>> = {}

  if (!values.name.trim()) problems.name = 'Enter your name'
  else if (values.name.trim().length < 2) problems.name = 'That looks too short to be a name'

  if (!values.email.trim()) problems.email = 'Enter your email address'
  else if (!isValidEmail(values.email)) problems.email = 'That does not look like an email address'

  // Optional, so only checked once something has been typed.
  if (values.phone.trim() && !isValidKenyanPhone(values.phone)) {
    problems.phone = 'Enter a Kenyan number, e.g. 07XX XXX XXX'
  }

  if (!values.password) problems.password = 'Choose a password'
  else if (values.password.length < MIN_PASSWORD_LENGTH) {
    problems.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`
  } else if (strengthOf(values.password).score === 1) {
    // The meter already says what is weak about it; this is what stops it
    // being submitted, and only for the genuinely guessable.
    problems.password = 'Choose something harder to guess'
  }

  if (!values.confirm) problems.confirm = 'Type your password again'
  else if (values.confirm !== values.password) problems.confirm = 'The two passwords do not match'

  return problems
}
