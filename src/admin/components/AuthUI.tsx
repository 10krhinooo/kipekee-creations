import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../../components/ui'

/**
 * The chrome every staff auth screen shares. Kept here rather than in
 * `components/ui.tsx` because these carry the auth screens' own sizing and
 * focus treatment, and the storefront has no use for them.
 */

export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[26px] bg-white p-7 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.7)] sm:p-9">
      {/* The wordmark is the way out. Someone who lands here by following an
          old bookmark wants the shop, not a login, and the logo is the control
          everyone already tries first. */}
      <Link
        data-field
        to="/"
        title="Back to the Kipekee shop"
        className="inline-block rounded-md transition-opacity hover:opacity-70"
      >
        <span className="font-display text-[26px] leading-none font-bold text-ink">Kipekee</span>
        <span className="mt-1.5 block text-[10px] tracking-[0.28em] text-brand uppercase">
          Workshop console
        </span>
      </Link>

      <div data-field className="mt-7">
        <h1 className="font-display text-[19px] font-semibold text-ink">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{intro}</p>
      </div>

      {children}
    </div>
  )
}

export function AuthField({
  label,
  hint,
  error,
  ...input
}: {
  label: string
  hint?: ReactNode
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label data-field className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </span>
      <input
        {...input}
        aria-invalid={!!error}
        className={cx(
          'rounded-xl border bg-shell px-4 py-3 text-sm text-ink outline-none transition-colors duration-200',
          'placeholder:text-muted focus:bg-white focus:shadow-[0_0_0_4px_rgba(161,28,32,0.12)]',
          'disabled:opacity-60',
          error ? 'border-brand' : 'border-line focus:border-brand',
        )}
      />
      {error && (
        <span role="alert" className="text-[12px] text-brand-700">
          {error}
        </span>
      )}
    </label>
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
      data-field
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

/** A whole-form failure, as opposed to a single field's `error`. */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-[13px] leading-relaxed text-brand-700"
    >
      <svg viewBox="0 0 24 24" className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16.2v.3" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  )
}

export function AuthDone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div data-field className="mt-7">
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
