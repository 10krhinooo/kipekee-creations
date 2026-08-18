import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../ui'
import { strengthOf } from '../../lib/password'

/** How long a notice stays before it fades out on its own. */
const NOTICE_MS = 5000

export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-[26px] bg-white p-7 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.7)] sm:p-9">
      {/* The wordmark is the way out. Somebody who landed here by following an
          old bookmark wants the shop, not a login, and the logo is the control
          everyone already tries first. */}
      <Link
        to="/"
        title="Back to the Kipekee shop"
        className="inline-block rounded-md transition-opacity hover:opacity-70"
      >
        <span className="font-display text-[26px] leading-none font-bold text-ink">Kipekee</span>
        <span className="mt-1.5 block text-[10px] tracking-[0.28em] text-brand uppercase">
          Creations
        </span>
      </Link>

      <div className="mt-7">
        <h1 className="font-display text-[19px] font-semibold text-ink">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{intro}</p>
      </div>

      {children}
    </div>
  )
}

const fieldClasses = (error?: string) =>
  cx(
    'w-full rounded-xl border bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors duration-200',
    'placeholder:text-muted focus:bg-white focus:shadow-[0_0_0_4px_rgba(161,28,32,0.12)]',
    'disabled:opacity-60',
    error ? 'border-brand' : 'border-line focus:border-brand',
  )

export function AuthField({
  label,
  hint,
  error,
  ...input
}: { label: string; hint?: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </span>
      <input
        {...input}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClasses(error)}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-[12px] text-brand-700">
          {error}
        </span>
      )}
    </label>
  )
}

/**
 * A password field that can be read back.
 *
 * Typing a long password blind on a phone keyboard is how people end up
 * choosing short ones, so the toggle is worth more to real password strength
 * than any rule about punctuation. It resets to hidden whenever the field is
 * disabled, so a form left mid-submit does not sit there showing a password.
 */
export function PasswordField({
  label,
  hint,
  error,
  strength,
  ...input
}: {
  label: string
  hint?: ReactNode
  error?: string
  /** Shows the meter. Only wanted where a password is being *chosen*. */
  strength?: boolean
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const value = String(input.value ?? '')

  useEffect(() => {
    if (input.disabled) setVisible(false)
  }, [input.disabled])

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </label>

      <div className="relative">
        <input
          {...input}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cx(fieldClasses(error), 'pr-12')}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // Not in the tab order: somebody tabbing from the password field
          // expects the submit button, not a toggle. Still reachable by click
          // and announced properly when a screen reader user lands on it.
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
            <circle cx="12" cy="12" r="2.8" />
            {visible && <path d="M4 20L20 4" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {strength && <StrengthMeter password={value} />}

      {error && (
        <span id={`${id}-error`} role="alert" className="text-[12px] text-brand-700">
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * Four segments rather than a percentage, because a number implies a precision
 * this does not have. The hint underneath is the part that actually helps:
 * "three more characters" is actionable in a way that "42%" is not.
 */
function StrengthMeter({ password }: { password: string }) {
  const { score, label, hint } = strengthOf(password)
  if (!password) return null

  const tone = ['bg-brand', 'bg-brand-400', 'bg-[#d9a441]', 'bg-[#1a6b39]'][score]
  const textTone = ['text-brand-700', 'text-brand-700', 'text-[#8a6512]', 'text-[#1a6b39]'][score]

  return (
    <div className="mt-0.5">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i <= score ? tone : 'bg-line',
            )}
          />
        ))}
      </div>
      <p className={cx('mt-1.5 text-[11.5px]', textTone)}>
        <span className="font-medium">{label}</span>
        {hint && <span className="text-muted"> · {hint}</span>}
      </p>
    </div>
  )
}

export function AuthSubmit({
  busy,
  busyLabel,
  children,
}: {
  busy: boolean
  busyLabel: string
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className={cx(
        'mt-1 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-brand',
        'text-sm font-semibold text-white shadow-[0_12px_28px_-8px_rgba(161,28,32,0.6)]',
        'transition-colors duration-200 hover:bg-brand-700 disabled:opacity-75',
      )}
    >
      {busy && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
        </svg>
      )}
      {busy ? busyLabel : children}
    </button>
  )
}

/**
 * A transient message that clears itself after five seconds.
 *
 * `onDismiss` is required rather than optional so the owning form's state goes
 * with it. A notice that faded visually but left `error` set would refuse to
 * reappear the next time the same thing went wrong, which is a bug that only
 * shows up on the second attempt.
 */
export function Notice({
  tone = 'error',
  children,
  onDismiss,
}: {
  tone?: 'error' | 'good'
  children: ReactNode
  onDismiss: () => void
}) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    setLeaving(false)
    const fade = setTimeout(() => setLeaving(true), NOTICE_MS)
    // Unmounts a beat after the fade starts, so the transition is seen.
    const drop = setTimeout(onDismiss, NOTICE_MS + 400)
    return () => {
      clearTimeout(fade)
      clearTimeout(drop)
    }
  }, [onDismiss])

  const bad = tone === 'error'

  return (
    <p
      role="alert"
      className={cx(
        'flex gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed',
        'transition-opacity duration-300',
        leaving ? 'opacity-0' : 'opacity-100',
        bad
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-[#bde2c9] bg-[#e8f5ec] text-[#1a6b39]',
      )}
    >
      <svg viewBox="0 0 24 24" className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
        {bad ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.2v.3" strokeLinecap="round" />
          </>
        ) : (
          <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {children}
    </p>
  )
}

export function AuthDone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-7">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f5ec]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1a6b39]" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
      <div className="mt-2 text-[13px] leading-relaxed text-muted">{children}</div>
    </div>
  )
}

/** The line under every auth form: the other thing you might have meant to do. */
export function AuthFooter({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-[12.5px] leading-relaxed text-muted">{children}</p>
}
