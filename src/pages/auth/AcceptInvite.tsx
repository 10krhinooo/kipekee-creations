import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AuthScene } from '../../components/auth/AuthScene'
import {
  AuthCard,
  AuthFooter,
  AuthSubmit,
  Notice,
  PasswordField,
} from '../../components/auth/AuthUI'
import { homeFor, useAuth, type Role } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { MIN_PASSWORD_LENGTH, strengthOf } from '../../lib/password'

interface InvitePreview {
  name: string
  email: string
  role: Role
  invitedBy: string | null
  expiresAt: string
}

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'an admin, who can also manage accounts',
  STAFF: 'staff, working the quote and order queues',
  CUSTOMER: 'a customer',
}

/**
 * The first thing an invited member of staff sees: choose a password, and they
 * are in.
 *
 * The account has no password until this screen sets one, so nothing that could
 * sign in was ever put in an email. That is the whole reason invites are links
 * rather than temporary passwords.
 *
 * The link is checked before the form is drawn rather than on submit. A dead
 * link is then a sentence on arrival, instead of the answer to a password
 * somebody has already chosen and typed twice - and the check is also what
 * lets the screen say whose account this is, which is the one thing an invitee
 * cannot verify any other way.
 */
export function AcceptInvite() {
  const [params] = useSearchParams()
  const { status, user, acceptInvite } = useAuth()
  const token = params.get('token') ?? ''

  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [checked, setChecked] = useState(false)
  const [deadLink, setDeadLink] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({ password: false, confirm: false })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    if (!token) {
      setChecked(true)
      return
    }
    let cancelled = false
    api.get<InvitePreview>(`/api/auth/invite?token=${encodeURIComponent(token)}`).then((result) => {
      if (cancelled) return
      if (result.ok) setInvite(result.data)
      else setDeadLink(result.message)
      setChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [token])

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

  // Only once this screen has done its job. Redirecting on any live session
  // would bounce somebody who is signed in on another account - the admin who
  // sent the invite, on a shared workshop machine - straight out of the link
  // they were asked to follow, with nothing said about why.
  if (accepted && status === 'signed-in' && user) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  if (!token) {
    return (
      <AuthScene>
        <AuthCard
          title="That link is incomplete"
          intro="Invite links carry a one-time token, and this one arrived without it."
        >
          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            Copy the link straight from the email rather than retyping it, or ask whoever set up
            your account to send another.
          </p>
          <AuthFooter>
            <Link to="/login" className="text-ink underline underline-offset-2 hover:text-brand">
              Back to sign in
            </Link>
          </AuthFooter>
        </AuthCard>
      </AuthScene>
    )
  }

  if (deadLink) {
    return (
      <AuthScene>
        <AuthCard title="That invite has expired" intro={deadLink}>
          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            Nothing is wrong with your account - only the link is out of date. A new one takes an
            admin a moment to send from the console.
          </p>
          <AuthFooter>
            <Link to="/login" className="text-ink underline underline-offset-2 hover:text-brand">
              Back to sign in
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
    const result = await acceptInvite(token, password)
    setSubmitting(false)
    if (result.ok) setAccepted(true)
    // Only the failure is handled here. On success the session lands and the
    // redirect above fires on the next render, already knowing where this
    // person belongs.
    if (!result.ok) setError(result.message)
  }

  return (
    <AuthScene>
      <AuthCard
        title={invite ? `Welcome, ${invite.name.split(' ')[0]}` : 'Set up your account'}
        intro={
          invite
            ? `${invite.invitedBy ?? 'A Kipekee admin'} has set you up as ${ROLE_LABEL[invite.role]}. Choose a password and you are in.`
            : 'Checking your invite…'
        }
      >
        {/* Held back until the link is known to be good, so nobody types a
            password into a form that was never going to work. */}
        {checked && invite && (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <div className="rounded-xl border border-line bg-shell px-4 py-3">
              <p className="text-[12px] text-muted">You will sign in with</p>
              <p className="mt-0.5 text-sm font-medium break-all text-ink">{invite.email}</p>
            </div>

            <PasswordField
              label="Choose a password"
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
              label="Confirm password"
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

            <AuthSubmit busy={submitting} busyLabel="Setting it up…">
              Set password and sign in
            </AuthSubmit>
          </form>
        )}

        <AuthFooter>
          {/* Worth saying out loud on a shared workshop machine: accepting
              replaces whoever is signed in here now. */}
          {status === 'signed-in' && user ? (
            <>Signed in as {user.email}. Setting this password signs you in as {invite?.email ?? 'the invited account'} instead.</>
          ) : (
            <>
              Not you?{' '}
              <Link to="/login" className="text-ink underline underline-offset-2 hover:text-brand">
                Go to sign in
              </Link>
            </>
          )}
        </AuthFooter>
      </AuthCard>
    </AuthScene>
  )
}
