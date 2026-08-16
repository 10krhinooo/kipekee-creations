import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBasket, FREE_DELIVERY_THRESHOLD } from '../store/basket'
import { bySlug, priceOf } from '../data/catalogue'
import { money } from '../lib/format'
import { swatch } from '../lib/swatch'
import { Button, WhatsAppIcon, cx, whatsappLink } from './ui'

function ProgressToFreeDelivery({ subtotal }: { subtotal: number }) {
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)

  return (
    <div className="border-b border-line bg-shell px-5 py-3">
      <p className="mb-2 text-[12px] text-ink-soft">
        {remaining > 0 ? (
          <>
            Add <strong>{money(remaining)}</strong> more for free Nairobi delivery
          </>
        ) : (
          <strong className="text-[#1a6b39]">Free delivery unlocked</strong>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function BasketDrawer() {
  const basket = useBasket()
  const { drawer, closeDrawer, cart, quote, subtotal, setCartQty, removeFromCart, removeFromQuote } =
    basket

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer()
    if (drawer) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [drawer, closeDrawer])

  const isCart = drawer === 'cart'

  return (
    <>
      <div
        onClick={closeDrawer}
        className={cx(
          'fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300',
          drawer ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-label={isCart ? 'Shopping cart' : 'Quote list'}
        aria-hidden={!drawer}
        className={cx(
          'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          drawer ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {isCart ? 'Your cart' : 'Your quote list'}
            </h2>
            <p className="text-[12px] text-muted">
              {isCart
                ? 'Ready-made stock, pay on checkout'
                : 'Made-to-measure items we price for you'}
            </p>
          </div>
          <button onClick={closeDrawer} aria-label="Close" className="rounded-full p-2 hover:bg-shell">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Cross-link so a shopper never loses sight of the other basket. */}
        <div className="flex border-b border-line text-sm">
          <button
            onClick={() => basket.openDrawer('cart')}
            className={cx(
              'flex-1 py-2.5 font-medium transition-colors',
              isCart ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink',
            )}
          >
            Cart ({basket.cartCount})
          </button>
          <button
            onClick={() => basket.openDrawer('quote')}
            className={cx(
              'flex-1 py-2.5 font-medium transition-colors',
              !isCart ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink',
            )}
          >
            Quote list ({basket.quoteCount})
          </button>
        </div>

        {isCart && cart.length > 0 && <ProgressToFreeDelivery subtotal={subtotal} />}

        <div className="flex-1 overflow-y-auto px-5">
          {isCart ? (
            cart.length === 0 ? (
              <Empty
                title="Your cart is empty"
                body="Cushion covers, towels and fabric by the metre ship the same day."
                cta={{ to: '/shop?mode=buy', label: 'Shop ready-made' }}
                onNavigate={closeDrawer}
              />
            ) : (
              <ul className="divide-y divide-line">
                {cart.map((line, i) => {
                  const p = bySlug(line.slug)
                  if (!p) return null
                  const c = p.colours.find((v) => v.id === line.colour)
                  const s = p.sizes?.find((v) => v.id === line.size)
                  return (
                    <li key={`${line.slug}-${i}`} className="flex gap-3 py-4">
                      <img
                        src={swatch(p.pattern, c?.swatch || p.accent, i)}
                        alt=""
                        className="h-20 w-16 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/product/${p.slug}`}
                          onClick={closeDrawer}
                          className="block truncate text-sm font-medium hover:text-brand"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[12px] text-muted">
                          {c?.label}
                          {s ? ` · ${s.label}` : ''}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center rounded-full border border-line">
                            <button
                              onClick={() => setCartQty(i, line.qty - 1)}
                              className="px-2.5 py-1 text-sm hover:text-brand"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm">{line.qty}</span>
                            <button
                              onClick={() => setCartQty(i, line.qty + 1)}
                              className="px-2.5 py-1 text-sm hover:text-brand"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(i)}
                            className="text-[12px] text-muted underline hover:text-brand"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">
                        {money(priceOf(p, line.colour, line.size) * line.qty)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )
          ) : quote.length === 0 ? (
            <Empty
              title="No items to quote yet"
              body="Curtains, rails and canopies are made to your window. Add them here and we come back with a fixed price."
              cta={{ to: '/shop?mode=quote', label: 'Browse made-to-measure' }}
              onNavigate={closeDrawer}
            />
          ) : (
            <ul className="divide-y divide-line">
              {quote.map((line, i) => {
                const p = bySlug(line.slug)
                if (!p) return null
                const c = p.colours.find((v) => v.id === line.colour)
                return (
                  <li key={`${line.slug}-${i}`} className="flex gap-3 py-4">
                    <img
                      src={swatch(p.pattern, c?.swatch || p.accent, i)}
                      alt=""
                      className="h-20 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${p.slug}`}
                        onClick={closeDrawer}
                        className="block truncate text-sm font-medium hover:text-brand"
                      >
                        {p.name}
                      </Link>
                      <p className="text-[12px] text-muted">
                        {c?.label} · {line.room}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-soft">
                        {line.widthCm && line.dropCm
                          ? `${line.widthCm} × ${line.dropCm} cm`
                          : 'Measurements to be taken on site'}
                        {line.windows > 1 ? ` · ${line.windows} windows` : ''}
                      </p>
                      <button
                        onClick={() => removeFromQuote(i)}
                        className="mt-2 text-[12px] text-muted underline hover:text-brand"
                      >
                        Remove
                      </button>
                    </div>
                    <span className="text-[12px] whitespace-nowrap text-muted">
                      from {money(p.price)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {(isCart ? cart.length : quote.length) > 0 && (
          <div className="space-y-3 border-t border-line bg-shell px-5 py-4">
            {isCart ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Delivery (Nairobi)</span>
                  <span className={cx('font-semibold', basket.delivery === 0 && 'text-[#1a6b39]')}>
                    {basket.delivery === 0 ? 'Free' : money(basket.delivery)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-3 font-display text-base font-semibold">
                  <span>Total</span>
                  <span>{money(basket.total)}</span>
                </div>
                <Button to="/checkout" full size="lg" onClick={closeDrawer}>
                  Checkout with M-Pesa
                </Button>
              </>
            ) : (
              <>
                <p className="text-[12px] leading-relaxed text-muted">
                  We reply with a fixed, itemised quote within one working day. No obligation.
                </p>
                <Button to="/quote" full size="lg" variant="dark" onClick={closeDrawer}>
                  Request my quote
                </Button>
                <Button
                  variant="whatsapp"
                  full
                  href={whatsappLink(
                    `Hello Kipekee, I would like a quote for: ${quote
                      .map((l) => bySlug(l.slug)?.name)
                      .filter(Boolean)
                      .join(', ')}`,
                  )}
                >
                  <WhatsAppIcon />
                  Send on WhatsApp instead
                </Button>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

function Empty({
  title,
  body,
  cta,
  onNavigate,
}: {
  title: string
  body: string
  cta: { to: string; label: string }
  onNavigate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-2 mb-6 max-w-xs text-sm leading-relaxed text-muted">{body}</p>
      <Button to={cta.to} onClick={onNavigate} variant="outline">
        {cta.label}
      </Button>
    </div>
  )
}
