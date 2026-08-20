import { useState } from 'react'
import { useCatalogue } from '../store/catalogue'
import { useSaved } from '../store/saved'
import { ProductCard } from '../components/ProductCard'
import { Button, Container, SectionHeading, cx } from '../components/ui'
import { RecentlyViewed } from '../components/RecentlyViewed'
import { money } from '../lib/format'
import { isValidEmail } from '../lib/validate'
import { post } from '../lib/api'
import type { Product } from '../data/types'

/**
 * Saved products, in the order they were saved, newest first.
 *
 * Reuses `ProductCard` rather than inventing a saved-item row, so the heart,
 * the compare control and quick-add all behave exactly as they do in the shop.
 */
export function Wishlist() {
  const { bySlug } = useCatalogue()
  const { saved } = useSaved()
  const items = saved.map((slug) => bySlug(slug)).filter((p) => p !== undefined)

  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="Saved"
        title="Your saved products"
        intro={
          items.length
            ? 'Kept on this device. Add them to a cart or a quote list whenever you are ready.'
            : undefined
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-shell px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-ink">Nothing saved yet</p>
          <p className="mx-auto mt-2 mb-6 max-w-md text-[14px] leading-relaxed text-muted">
            Tap the heart on any product to keep it here while you decide. Saved products stay on
            this device, so there is nothing to sign up for.
          </p>
          <Button to="/shop">Browse the shop</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      )}

      {items.length > 0 && <EmailMyList items={items} />}

      <RecentlyViewed />
    </Container>
  )
}

/**
 * A saved list lives in `localStorage`, which means it lives on one browser on
 * one device. Emailing it is the escape hatch for the visitor who browsed on a
 * phone and wants to show it to somebody on a laptop, and it needs no account
 * to work.
 */
function EmailMyList({ items }: { items: Product[] }) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fieldError = touched && !isValidEmail(email) ? 'Enter a valid email address' : undefined

  const send = async () => {
    setTouched(true)
    if (!isValidEmail(email) || sending) return

    setError(null)
    setSending(true)
    const result = await post('/api/wishlist/email', {
      email,
      items: items.map((p) => ({
        name: p.name,
        detail: p.mode === 'quote' ? `Made to measure, from ${money(p.price)} ${p.unit}` : p.summary,
        price: p.mode === 'quote' ? `from ${money(p.price)}` : money(p.price),
      })),
    })
    setSending(false)

    if (result.ok) setSent(true)
    else setError(result.message)
  }

  return (
    <section className="mt-10 rounded-2xl border border-line bg-shell p-6 sm:p-8">
      {sent ? (
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-ink">List sent</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">
            Check {email}. If it is not there in a minute, look in spam, then{' '}
            <button onClick={() => setSent(false)} className="text-brand underline">
              try another address
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-lg font-semibold text-ink">Email me this list</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Your saved items live on this device only. Send them to yourself and you can pick up
            where you left off anywhere, no account needed.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!fieldError}
              aria-label="Your email address"
              placeholder="you@example.com"
              className={cx(
                'flex-1 rounded-full border bg-white px-5 py-3 text-sm outline-none focus:border-brand',
                fieldError ? 'border-red-400' : 'border-line',
              )}
            />
            <Button size="md" disabled={sending} onClick={send}>
              {sending ? 'Sending…' : 'Send my list'}
            </Button>
          </div>
          {fieldError && <p className="mt-2 text-[12px] text-red-600">{fieldError}</p>}
          {error && (
            <p role="alert" className="mt-2 text-[12.5px] leading-relaxed text-brand-700">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
