import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ')

/*
 * The storefront's primitives.
 *
 * One rule runs through this file since the redesign: the display face is a
 * serif and it is for headings only. Buttons, badges, eyebrows, nav and prices
 * wear `font-ui` (Poppins). A serif on a 13px button reads as a typo, and a
 * sans-serif heading is what made the prototype look like a dashboard.
 */

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'brass' | 'whatsapp'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-700 shadow-raise',
  outline: 'border border-line-strong bg-white text-ink hover:border-ink hover:bg-linen',
  ghost: 'text-ink hover:bg-sand',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  /* The secondary call to action. Brass carries the premium weight so the red
     can stay rare enough to still mean something. */
  brass: 'bg-brass text-ink hover:bg-brass-deep hover:text-white',
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-deep',
}

const sizes = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-3.5 text-[15px]',
}

interface ButtonProps {
  variant?: ButtonVariant
  size?: keyof typeof sizes
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Shows a spinner and blocks input. Only meaningful on the `<button>` form. */
  loading?: boolean
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
  loading,
  full,
  className,
  children,
}: ButtonProps) {
  const classes = cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-ui font-medium',
    'transition-colors duration-200',
    'disabled:pointer-events-none disabled:opacity-45',
    variants[variant],
    sizes[size],
    full && 'w-full',
    className,
  )

  // `onClick` reaches the link forms too. A caller that navigates and closes a
  // drawer in one action passes both, and dropping it left the drawer open
  // over the page it had just navigated to.
  if (to)
    return (
      <Link to={to} onClick={onClick} className={classes}>
        {children}
      </Link>
    )
  if (href)
    return (
      <a href={href} onClick={onClick} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    )
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'quote' | 'stock' | 'brass'
}) {
  const tones = {
    neutral: 'bg-white/92 text-ink border-line backdrop-blur',
    brand: 'bg-brand text-white border-brand',
    quote: 'bg-ink text-white border-ink',
    stock: 'bg-stock-bg text-stock-ink border-stock-line',
    brass: 'bg-brass/18 text-brass-dark border-brass/45',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 font-ui text-eyebrow font-semibold uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

/** A letterspaced Poppins label. Sits above a serif heading, never inside one. */
export function Eyebrow({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode
  tone?: 'brand' | 'muted' | 'brass' | 'light'
  className?: string
}) {
  const tones = {
    brand: 'text-brand',
    muted: 'text-muted-foreground',
    brass: 'text-brass-deep',
    light: 'text-white/70',
  }
  return <p className={cx('eyebrow', tones[tone], className)}>{children}</p>
}

/**
 * A star rating.
 *
 * A product nobody has reviewed yet gets "No reviews yet" rather than five
 * empty stars and "(0)". Those read as a bad score to anyone skimming, which
 * is the wrong thing to say about something that has only just gone up, and
 * staff can now put products up from the console.
 */
export function Stars({ rating, count }: { rating: number; count?: number }) {
  const unrated = count === 0

  return (
    <span className="inline-flex items-center gap-1.5 font-ui text-sm">
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const id = `s${i}-${Math.round(rating * 10)}`
          const stop = `${Math.max(0, Math.min(1, rating - i + 1)) * 100}%`
          return (
            <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5">
              <defs>
                <linearGradient id={id}>
                  <stop offset={stop} stopColor="var(--color-star)" />
                  <stop offset={stop} stopColor="var(--color-star-empty)" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#${id})`}
                d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9 4.7 17.6l1-5.8L1.5 7.7l5.9-.9z"
              />
            </svg>
          )
        })}
      </span>
      <span className="sr-only">{unrated ? 'Not yet rated' : `${rating} out of 5`}</span>
      {unrated ? (
        <span className="text-[13px] text-muted-foreground">No reviews yet</span>
      ) : (
        count !== undefined && <span className="text-[13px] text-muted-foreground">({count})</span>
      )}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  center,
  tone = 'dark',
}: {
  eyebrow?: string
  title: string
  intro?: string
  action?: ReactNode
  center?: boolean
  /** `light` for a heading sitting on `bg-ink` or over a photograph. */
  tone?: 'dark' | 'light'
}) {
  const light = tone === 'light'
  return (
    <div
      className={cx(
        'mb-10 flex flex-col gap-5 sm:mb-12',
        center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
      )}
    >
      <div className={cx('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && (
          <Eyebrow tone={light ? 'light' : 'brand'} className="mb-3">
            {eyebrow}
          </Eyebrow>
        )}
        <h2 className={cx('text-title font-semibold', light ? 'text-white' : 'text-ink')}>
          {title}
        </h2>
        {intro && (
          <p
            className={cx(
              'mt-4 text-lede',
              light ? 'text-white/70' : 'text-muted-foreground',
              center && 'mx-auto',
            )}
          >
            {intro}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

/**
 * Page gutter. Capped at 1600px rather than Tailwind's 1280px default so the
 * layout keeps filling a large monitor instead of stranding the content in a
 * narrow column down the middle.
 */
export function Container({
  children,
  className,
  wide,
  narrow,
}: {
  children: ReactNode
  className?: string
  /** Edge to edge with gutters only, for full-bleed bars like the header. */
  wide?: boolean
  /** A reading measure, for legal pages and long-form copy. */
  narrow?: boolean
}) {
  return (
    <div
      className={cx(
        'mx-auto w-full px-4 sm:px-6 lg:px-10',
        wide ? 'max-w-none' : narrow ? 'max-w-3xl' : 'max-w-[1600px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Kipekee's WhatsApp line, the fastest conversion path for a Kenyan shopper. */
export const WHATSAPP = '254722771321'

/** The workshop and showroom, on Katani Road just off Mombasa Road. */
export const MAP_URL = 'https://share.google/gXSFZvROvKJS8LonS'

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`

export function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  )
}

export function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FacebookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 22v-8.4h2.8l.4-3.3h-3.2V8.1c0-.95.26-1.6 1.63-1.6h1.74V3.5C15.96 3.35 15.02 3.28 14.06 3.28c-2.86 0-4.83 1.75-4.83 4.96v2.06H6.4v3.3h2.83V22h4.27z" />
    </svg>
  )
}

export function TikTokIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 3c.4 2.2 1.9 3.9 4.4 4.1v3.1c-1.5.1-2.9-.4-4.4-1.3v6.4c0 3.5-2.8 5.7-5.8 5.7-3 0-5.7-2.1-5.7-5.6 0-3.5 3.1-5.8 6.6-5.4v3.2c-.4-.1-.9-.2-1.3-.1-1.4.2-2.4 1.3-2.3 2.6.1 1.4 1.4 2.4 2.8 2.3 1.6-.1 2.6-1.4 2.6-3.1V3h3.1z" />
    </svg>
  )
}
