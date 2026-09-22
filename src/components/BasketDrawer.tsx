import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBasket, FREE_DELIVERY_THRESHOLD } from '../store/basket'
import { useSaved } from '../store/saved'
import { bySlug, priceOf, rooms, stockCapOf } from '../data/catalogue'
import type { Product, QuoteLine } from '../data/types'
import { money } from '../lib/format'
import { ProductThumb } from './ProductThumb'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from './shadcn/sheet'
import { Button, WhatsAppIcon, cx } from './ui'
import { quoteWhatsAppLink } from '../lib/whatsapp'

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
  return (
    <ProductThumb
      product={product}
      colourId={colour}
      index={seed}
      className="h-20 w-16"
      sizes="64px"
    />
  )
}

export function BasketDrawer() {
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

  /** Which quote line has its measurement fields open, by index. */
  const [editing, setEditing] = useState<number | null>(null)

  const open = drawer !== null
  const isCart = drawer === 'cart'

  /*
   * The focus trap, the escape key and the scroll lock all used to live here as
   * about forty lines of `keydown` handling and a `FOCUSABLE` selector string.
   * Radix's Dialog does every one of them, and does the parts that were missing
   * too: pointer-down outside, aria-hidden on the rest of the page, and holding
   * the panel in the DOM long enough for its exit animation to finish.
   *
   * Returning focus is the one piece it cannot do for us. Radix hands focus
   * back to the `SheetTrigger` that opened a dialog, and this drawer has no
   * trigger: it is opened from the basket store, by the header button, by a
   * card's Add, and by an empty-state link. With nothing to return to, Radix
   * drops focus on the body and a keyboard shopper who closes the drawer is
   * left at the top of the document. So we remember the opener ourselves.
   *
   * Keyed on `open` rather than on which basket is shown, because switching
   * tabs inside the drawer is not a re-open and would otherwise record a
   * control inside the panel as the thing to go back to.
   */
  const openerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open) openerRef.current = document.activeElement as HTMLElement | null
  }, [open])


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
    <Sheet open={open} onOpenChange={(next) => !next && closeDrawer()}>
      <SheetContent
        side="right"
        /* The default sheet is `w-3/4 sm:max-w-sm` with a `gap-4` column. This
           drawer is full width on a phone and its sections carry their own
           borders, so both are overridden. `cn` resolving the conflict rather
           than letting both land is exactly what it is here for. */
        className="w-full gap-0 sm:max-w-md"
        /* The panel draws its own close button beside the title, so the one in
           the corner would be a second control for the same thing. */
        showCloseButton={false}
        onCloseAutoFocus={(e) => {
          const opener = openerRef.current
          // `isConnected` because the opener is often a card's Add button, and
          // the card may have been unmounted by a filter change while the
          // drawer was covering it. Focusing a detached node silently does
          // nothing, so fall through to Radix's own behaviour instead.
          if (!opener?.isConnected) return
          e.preventDefault()
          opener.focus()
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <SheetTitle className="font-display text-lg font-semibold">
              {isCart ? 'Your cart' : 'Your quote list'}
            </SheetTitle>
            <SheetDescription className="text-[12px] text-muted-foreground">
              {isCart
                ? 'Ready-made stock, pay on checkout'
                : 'Made-to-measure items we price for you'}
            </SheetDescription>
          </div>
          <SheetClose aria-label="Close" title="Close" className="rounded-full p-2 hover:bg-shell">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </SheetClose>
        </div>

        {/* Cross-link so a shopper never loses sight of the other basket. */}
        <div className="flex border-b border-line text-sm">
          <button
            onClick={() => basket.openDrawer('cart')}
            className={cx(
              'flex-1 py-2.5 font-medium transition-colors',
              isCart ? 'border-b-2 border-brand text-brand' : 'text-muted-foreground hover:text-ink',
            )}
          >
            Cart ({basket.cartCount})
          </button>
          <button
            onClick={() => basket.openDrawer('quote')}
            className={cx(
              'flex-1 py-2.5 font-medium transition-colors',
              !isCart ? 'border-b-2 border-brand text-brand' : 'text-muted-foreground hover:text-ink',
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
                        <p className="text-[12px] text-muted-foreground">
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
                            className="text-[12px] text-muted-foreground underline hover:text-brand"
                          >
                            Save for later
                          </button>
                          <button
                            onClick={() => removeFromCart(i)}
                            className="text-[12px] text-muted-foreground underline hover:text-brand"
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
                        <p className="text-[12px] text-muted-foreground">
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
                            className="text-[12px] text-muted-foreground underline hover:text-brand"
                          >
                            {isEditing ? 'Done' : 'Edit measurements'}
                          </button>
                          <button
                            onClick={() => removeFromQuote(i)}
                            className="text-[12px] text-muted-foreground underline hover:text-brand"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <span className="text-[12px] whitespace-nowrap text-muted-foreground">
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
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  {/* Not "(Nairobi)". `DELIVERY_FEE` is one flat rate applied
                      to every county, and labelling it Nairobi told everyone
                      outside Nairobi that the number did not apply to them. */}
                  <span className="text-muted-foreground">Delivery</span>
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
                <p className="text-[12px] leading-relaxed text-muted-foreground">
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
      </SheetContent>
    </Sheet>
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
      <p className="col-span-2 text-[12px] text-muted-foreground">
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
      <p className="mt-2 mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button to={cta.to} onClick={onNavigate} variant="outline">
        {cta.label}
      </Button>
    </div>
  )
}
