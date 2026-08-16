import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ')

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'whatsapp'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-700 shadow-sm',
  outline: 'border border-ink/20 text-ink hover:border-brand hover:text-brand bg-white',
  ghost: 'text-ink hover:bg-sand',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  whatsapp: 'bg-[#1da851] text-white hover:bg-[#179145]',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
}

interface ButtonProps {
  variant?: ButtonVariant
  size?: keyof typeof sizes
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  full?: boolean
  className?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  type = 'button',
  disabled,
  full,
  className,
  children,
}: ButtonProps) {
  const classes = cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200',
    'disabled:opacity-45 disabled:pointer-events-none',
    variants[variant],
    sizes[size],
    full && 'w-full',
    className,
  )

  if (to) return <Link to={to} className={classes}>{children}</Link>
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    )
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'quote' | 'stock'
}) {
  const tones = {
    neutral: 'bg-white/90 text-ink border-line',
    brand: 'bg-brand text-white border-brand',
    quote: 'bg-ink text-white border-ink',
    stock: 'bg-[#e8f5ec] text-[#1a6b39] border-[#bde2c9]',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5">
            <defs>
              <linearGradient id={`s${i}-${Math.round(rating * 10)}`}>
                <stop offset={`${Math.max(0, Math.min(1, rating - i + 1)) * 100}%`} stopColor="#e0a422" />
                <stop offset={`${Math.max(0, Math.min(1, rating - i + 1)) * 100}%`} stopColor="#d8d5cf" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${Math.round(rating * 10)})`}
              d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9 4.7 17.6l1-5.8L1.5 7.7l5.9-.9z"
            />
          </svg>
        ))}
      </span>
      <span className="sr-only">{rating} out of 5</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  center,
}: {
  eyebrow?: string
  title: string
  intro?: string
  action?: ReactNode
  center?: boolean
}) {
  return (
    <div
      className={cx(
        'mb-8 flex flex-col gap-4 sm:mb-10',
        center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
      )}
    >
      <div className={cx('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
        {intro && <p className="mt-3 text-[15px] leading-relaxed text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  )
}

export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

/** Kipekee's WhatsApp line, the fastest conversion path for a Kenyan shopper. */
export const WHATSAPP = '254721527797'

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`

export function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  )
}
