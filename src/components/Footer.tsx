import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/catalogue'
import { post } from '../lib/api'
import { isValidEmail } from '../lib/validate'
import {
  Button,
  Container,
  FacebookIcon,
  InstagramIcon,
  MAP_URL,
  TikTokIcon,
  WhatsAppIcon,
  whatsappLink,
} from './ui'

/*
 * The brand's own profiles.
 *
 * These were three `href: '#'` links, which in a client demo is the first
 * thing somebody clicks. A link that goes nowhere is worse than no link, so
 * until the real handles land there is nothing here to click, and the block
 * below renders only when this list has something in it.
 */
const SOCIAL_LINKS: { label: string; href: string; Icon: typeof InstagramIcon }[] = []

/** Kept so the icons stay imported and the list is a one-line change later. */
void [InstagramIcon, FacebookIcon, TikTokIcon]

/**
 * Promotional list sign-up.
 *
 * Deliberately modest about what it promises. It records an intention to hear
 * from the shop; it does not claim a welcome email is on the way, because
 * nothing sends one yet. The real service will want a double opt-in before
 * anyone counts as subscribed, and the copy here should not get ahead of that.
 */
function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'already'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }

    setError(null)
    setState('sending')
    const result = await post<{ email: string; already: boolean }>('/api/newsletter', { email })
    if (!result.ok) {
      setError(result.message)
      setState('idle')
      return
    }
    setState(result.data.already ? 'already' : 'done')
  }

  if (state === 'done' || state === 'already') {
    return (
      <div className="rounded-panel border border-white/15 bg-white/5 p-5">
        <p className="font-display text-[15px] font-semibold text-white">
          {state === 'already' ? "You're already on the list" : "You're on the list"}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed">
          {state === 'already'
            ? `We already have ${email}. Nothing has changed.`
            : `We'll write to ${email} when there's a sale or something new off the machines.`}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-panel border border-white/15 bg-white/5 p-5">
      <label htmlFor="newsletter-email" className="block font-display text-[15px] font-semibold text-white">
        Offers and new arrivals
      </label>
      <p className="mt-1.5 mb-3 text-sm leading-relaxed">
        Sales, new fabrics and the odd workshop story. A few times a year, never more.
      </p>

      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="min-w-0 flex-1 rounded-full border border-white/20 bg-ink px-4 py-2.5 font-sans text-sm text-white placeholder:text-white/40 focus:border-brand-400 focus:outline-none"
        />
        <Button type="submit" size="sm" disabled={state === 'sending'} loading={state === 'sending'}>
          {state === 'sending' ? 'Joining' : 'Join'}
        </Button>
      </div>

      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-[13px] text-brand-400">
          {error}
        </p>
      )}

      <p className="mt-3 text-[12px] text-white/50">
        One click to unsubscribe. We never pass your address on.
      </p>
    </form>
  )
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white/80">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-display text-xl font-bold text-white">Kipekee</span>
          <span className="mb-4 block text-[10px] tracking-[0.28em] text-brand-400 uppercase">
            Creations
          </span>
          <p className="max-w-xs text-sm leading-relaxed">
            Interior decor and made-to-measure soft furnishings for homes, hotels, architects and
            property managers across Kenya. Sewing on Katani Road, off Mombasa Road, since 2012.
          </p>
          <Button
            variant="whatsapp"
            size="sm"
            className="mt-5"
            href={whatsappLink('Hello Kipekee, I would like to talk about a project.')}
          >
            <WhatsAppIcon />
            WhatsApp us
          </Button>

          {SOCIAL_LINKS.length > 0 && (
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="rounded-full border border-white/15 p-2 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Shop</h3>
          <ul className="space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/shop?category=${c.slug}`} className="inline-block py-1 hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Help</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link to="/measure-guide" className="inline-block py-1 hover:text-white">
                How to measure your windows
              </Link>
            </li>
            <li>
              <Link to="/custom-curtains" className="inline-block py-1 hover:text-white">
                Made-to-measure process
              </Link>
            </li>
            <li>
              <Link to="/hotel-linen" className="inline-block py-1 hover:text-white">
                Trade &amp; hotel pricing
              </Link>
            </li>
            <li>
              {/* Pointed at /contact, where there is a four-line summary and no
                  policy. A shop that cannot say what its returns terms are is
                  also a shop that cannot onboard a payment provider. */}
              <Link to="/returns" className="inline-block py-1 hover:text-white">
                Delivery &amp; returns
              </Link>
            </li>
            <li>
              <Link to="/about" className="inline-block py-1 hover:text-white">
                About us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Visit the showroom</h3>
          <address className="space-y-2.5 text-sm not-italic">
            <p>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-block py-1 hover:text-white"
              >
                Katani Road, off Mombasa Road, Nairobi
              </a>
            </p>
            <p>Mon–Fri 8.30am–5.30pm · Sat 9am–3pm</p>
            <p>
              <a href="tel:+254722771321" className="inline-block py-1 hover:text-white">
                0722 771 321
              </a>
            </p>
            <p>
              <a href="mailto:info@kipekeecreations.co.ke" className="inline-block py-1 hover:text-white">
                info@kipekeecreations.co.ke
              </a>
            </p>
          </address>

          <div className="mt-6">
            <NewsletterSignup />
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
              M-PESA
            </span>
            <span className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
              VISA
            </span>
            <span className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
              MASTERCARD
            </span>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-[12px] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Kipekee Creations. All rights reserved.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/terms" className="hover:text-white">
              Terms of sale
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/returns" className="hover:text-white">
              Delivery &amp; returns
            </Link>
            <a href="/photos/CREDITS.md" className="hover:text-white">
              Photo credits
            </a>
          </p>
          <p className="text-white/50">Prices in Kenya Shillings, inclusive of VAT.</p>
        </Container>
      </div>
    </footer>
  )
}
