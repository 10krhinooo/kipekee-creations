import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBasket, FREE_DELIVERY_THRESHOLD } from '../store/basket'
import { useSaved } from '../store/saved'
import { priceOf, rooms, stockCapOf } from '../data/catalogue'
import { useCatalogue } from '../store/catalogue'
import type { Product, QuoteLine } from '../data/types'
import { money } from '../lib/format'
import { mediaUrl } from '../lib/api'
import { swatch } from '../lib/swatch'
import { Button, WhatsAppIcon, cx } from './ui'
import { quoteWhatsAppLink } from '../lib/whatsapp'

/**
 * Everything the tab trap will cycle through. The panel itself is excluded by
 * the `tabindex="-1"` clause, so focusing it does not make it a stop.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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

/**
 * The line's thumbnail.
 *
 * A photograph of the chosen colourway wins, then any photograph of the
 * product, then the generated swatch. A shopper picks from photography on the
 * product page, so showing them a rendered pattern back in the basket reads as
 * the wrong item having been added.
 */
function LineImage({
  product,
  colour,
  seed,
}: {
  product: Product
  colour: string
  seed: number
}) {
  const photos = product.photos ?? []
  const photo = photos.find((p) => p.colourId === colour) ?? photos[0]
  const variant = product.colours.find((v) => v.id === colour)

  return (
    <img
      src={photo ? mediaUrl(photo.src) : swatch(product.pattern, variant?.swatch || product.accent, seed)}
      alt=""
      className="h-20 w-16 shrink-0 rounded-lg object-cover"
    />
  )
}

export function BasketDrawer() {

  const { bySlug } = useCatalogue()
  const basket = useBasket()
  const {
    drawer,
    closeDrawer,
    cart,
    quote,
    subtotal,
    setCartQty,
    removeFromCart,
    removeFromQuote,
    updateQuote,
    removed,
    undoRemove,
  } = basket
  const { isSaved, toggleSaved } = useSaved()

  const panelRef = useRef<HTMLElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  /** Which quote line has its measurement fields open, by index. */
  const [editing, setEditing] = useState<number | null>(null)

  const open = drawer !== null
  const isCart = drawer === 'cart'

  /*
   * Keyed on whether the panel is open, not on which basket it shows. Swapping
   * tabs is not a re-open, and re-running this on that change would snatch
   * focus back to the top of the panel mid-interaction.
   */
  useEffect(() => {
    if (!open) return

    restoreRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer()
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      // Read on each Tab rather than once: lines are removed, the undo strip
      // appears and disappears, and a cached list would send focus nowhere.
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // Back to the cart button that opened it, so a keyboard shopper is not
      // dropped at the top of the document.
      restoreRef.current?.focus()
    }
  }, [open, closeDrawer])

  // A line edited into view then removed would leave the form open over its
  // replacement, so the editor closes whenever the list changes underneath it.
  useEffect(() => setEditing(null), [quote.length, drawer])

  /** Undo has to be a true inverse, so a save-for-later undo un-saves too. */
  const onUndo = () => {
    if (removed?.reason === 'saved' && isSaved(removed.line.slug)) {
      toggleSaved(removed.line.slug)
    }
    undoRemove()
  }

  const saveForLater = (index: number, slug: string) => {
    if (!isSaved(slug)) toggleSaved(slug)
    removeFromCart(index, 'saved')
  }

  return (
    <>
      <div
        onClick={closeDrawer}
        className={cx(
          'fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isCart ? 'Shopping cart' : 'Quote list'}
        tabIndex={-1}
        /* Off-screen is not out of the tab order. Without `inert` a keyboard
           shopper tabs straight into a panel they cannot see. */
        inert={!open}
        className={cx(
          'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
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
          <button onClick={closeDrawer} aria-label="Close" title="Close" className="rounded-full p-2 hover:bg-shell">
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
                  const cap = stockCapOf(p)
                  const atCap = line.qty >= cap
                  return (
                    <li key={`${line.slug}-${i}`} className="flex gap-3 py-4">
                      <LineImage product={p} colour={line.colour} seed={i} />
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
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm">{line.qty}</span>
                            <button
                              onClick={() => setCartQty(i, line.qty + 1)}
                              disabled={atCap}
                              className="px-2.5 py-1 text-sm hover:text-brand disabled:pointer-events-none disabled:opacity-35"
                              aria-label="Increase quantity"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => saveForLater(i, p.slug)}
                            className="text-[12px] text-muted underline hover:text-brand"
                          >
                            Save for later
                          </button>
                          <button
                            onClick={() => removeFromCart(i)}
                            className="text-[12px] text-muted underline hover:text-brand"
                          >
                            Remove
                          </button>
                        </div>
                        {/* Only worth saying near the end of the shelf. A count
                            on every line reads as a scarcity gimmick. */}
                        {Number.isFinite(cap) && cap - line.qty <= 2 && (
                          <p className="mt-1.5 text-[12px] text-brand">
                            {atCap
                              ? `That is all ${cap} we have in stock`
                              : `Only ${cap - line.qty} more in stock`}
                          </p>
                        )}
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
                const isEditing = editing === i
                return (
                  <li key={`${line.slug}-${i}`} className="py-4">
                    <div className="flex gap-3">
                      <LineImage product={p} colour={line.colour} seed={i} />
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
                        <div className="mt-2 flex items-center gap-3">
                          {/* Measurements are the whole content of a quote line.
                              Sending someone back to the product page to change
                              one number loses the rest of what they entered. */}
                          <button
                            onClick={() => setEditing(isEditing ? null : i)}
                            aria-expanded={isEditing}
                            className="text-[12px] text-muted underline hover:text-brand"
                          >
                            {isEditing ? 'Done' : 'Edit measurements'}
                          </button>
                          <button
                            onClick={() => removeFromQuote(i)}
                            className="text-[12px] text-muted underline hover:text-brand"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <span className="text-[12px] whitespace-nowrap text-muted">
                        from {money(p.price)}
                      </span>
                    </div>

                    {isEditing && (
                      <QuoteEditor
                        line={line}
                        onChange={(patch) => updateQuote(i, patch)}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Outside the footer's `length > 0` guard on purpose: removing the last
            line is exactly when the offer to undo matters most. */}
        {removed && removed.basket === drawer && (
          <UndoStrip
            name={bySlug(removed.line.slug)?.name ?? 'Item'}
            saved={removed.reason === 'saved'}
            onUndo={onUndo}
            onDismiss={basket.dismissUndo}
          />
        )}

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
                  href={quoteWhatsAppLink(
                    quote.flatMap((line) => {
                      const product = bySlug(line.slug)
                      return product ? [{ product, line }] : []
                    }),
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

function UndoStrip({
  name,
  saved,
  onUndo,
  onDismiss,
}: {
  name: string
  saved: boolean
  onUndo: () => void
  onDismiss: () => void
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border-t border-line bg-ink px-5 py-3 text-white"
    >
      <p className="min-w-0 truncate text-[13px]">
        <span className="font-medium">{name}</span>
        <span className="text-white/70"> {saved ? 'saved for later' : 'removed'}</span>
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <button onClick={onUndo} className="text-[13px] font-semibold underline hover:text-white/80">
          Undo
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          title="Dismiss"
          className="rounded-full p-1 text-white/60 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const fieldClass =
  'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-brand'

function QuoteEditor({
  line,
  onChange,
}: {
  line: QuoteLine
  onChange: (patch: Partial<QuoteLine>) => void
}) {
  /** Empty clears the measurement rather than recording a window 0 cm wide. */
  const num = (value: string) => (value === '' ? undefined : Math.max(0, Number(value)))

  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl bg-shell p-3">
      <label className="col-span-2 block">
        <span className="mb-1 block text-[12px] font-medium">Room</span>
        <select
          value={line.room}
          onChange={(e) => onChange({ room: e.target.value })}
          className={fieldClass}
        >
          {rooms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium">Width (cm)</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={line.widthCm ?? ''}
          onChange={(e) => onChange({ widthCm: num(e.target.value) })}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium">Drop (cm)</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={line.dropCm ?? ''}
          onChange={(e) => onChange({ dropCm: num(e.target.value) })}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium">Windows</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={line.windows}
          onChange={(e) => onChange({ windows: Math.max(1, Number(e.target.value) || 1) })}
          className={fieldClass}
        />
      </label>
      <label className="col-span-2 block">
        <span className="mb-1 block text-[12px] font-medium">Notes</span>
        <textarea
          rows={2}
          value={line.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value || undefined })}
          placeholder="Rail already fitted, blackout lining, anything else we should know"
          className={cx(fieldClass, 'resize-none')}
        />
      </label>
      <p className="col-span-2 text-[12px] text-muted">
        Leave the measurements blank and we take them on site at no charge.
      </p>
    </div>
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
