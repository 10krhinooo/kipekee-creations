import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBasket } from '../store/basket'
import { bySlug, priceOf } from '../data/catalogue'
import { money } from '../lib/format'
import { swatch } from '../lib/swatch'
import { Button, Container, cx } from '../components/ui'

type Pay = 'mpesa' | 'card' | 'cod'

/**
 * Checkout is a single page with three visible steps rather than a multi-page
 * funnel, fewer drop-off points, and the order summary never leaves the
 * screen. Nothing here talks to a payment processor; it is a prototype of the
 * flow, and the real integration lands with the backend.
 */
export function Checkout() {
  const { cart, subtotal, delivery, total, clear } = useBasket()
  const [pay, setPay] = useState<Pay>('mpesa')
  const [town, setTown] = useState('nairobi')
  const [placed, setPlaced] = useState(false)

  if (placed) {
    return (
      <Container className="py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ec]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#1a6b39]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold">Order received</h1>
        <p className="mx-auto mt-3 mb-8 max-w-md text-[15px] leading-relaxed text-muted">
          We've sent a confirmation to your phone. Your order leaves the Mombasa Road workshop this
          afternoon and you'll get a tracking SMS when the rider is on the way.
        </p>
        <Button to="/shop" size="lg">Continue shopping</Button>
      </Container>
    )
  }

  if (cart.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-3 mb-6 text-muted">Add something ready-made and come back.</p>
        <Button to="/shop?mode=buy">Shop ready-made</Button>
      </Container>
    )
  }

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="mb-8 font-display text-3xl font-semibold">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <Step n={1} title="Where are we delivering?">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Full name" placeholder="Jane Wanjiru" />
              <Input label="Phone number" placeholder="07XX XXX XXX" type="tel" />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">Town</span>
                <select
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="nairobi">Nairobi, next day</option>
                  <option value="mombasa">Mombasa, 2–3 days</option>
                  <option value="kisumu">Kisumu, 2–3 days</option>
                  <option value="nakuru">Nakuru, 2 days</option>
                  <option value="other">Elsewhere in Kenya, 3–4 days</option>
                </select>
              </label>
              <Input label="Delivery address" placeholder="Estate, street, house or apartment" className="sm:col-span-2" />
            </div>
          </Step>

          <Step n={2} title="How would you like to pay?">
            <div className="space-y-3">
              {(
                [
                  {
                    id: 'mpesa' as Pay,
                    title: 'M-Pesa',
                    body: 'You get an STK push on your phone. Enter your PIN there. We never see it.',
                  },
                  {
                    id: 'card' as Pay,
                    title: 'Card',
                    body: 'Visa or Mastercard through our payment partner, on their secure page.',
                  },
                  {
                    id: 'cod' as Pay,
                    title: 'Pay on delivery',
                    body: 'Nairobi only. Pay the rider by M-Pesa or cash when it arrives.',
                    disabled: town !== 'nairobi',
                  },
                ]
              ).map((option) => (
                <label
                  key={option.id}
                  className={cx(
                    'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                    pay === option.id ? 'border-brand bg-brand-50' : 'border-line hover:border-ink/25',
                    option.disabled && 'pointer-events-none opacity-45',
                  )}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={pay === option.id}
                    onChange={() => setPay(option.id)}
                    className="mt-0.5 h-4 w-4 accent-[#a11c20]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {option.disabled ? 'Available in Nairobi only' : option.body}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Step>

          <Step n={3} title="Confirm">
            <p className="mb-4 text-[13px] leading-relaxed text-muted">
              By placing the order you agree to our delivery and returns terms. Ready-made stock can
              be returned within 14 days unused.
            </p>
            <Button
              size="lg"
              full
              onClick={() => {
                clear('cart')
                setPlaced(true)
              }}
            >
              Place order · {money(total)}
            </Button>
            <p className="mt-3 text-center text-[12px] text-muted">
              Prototype only. No payment is taken.
            </p>
          </Step>
        </div>

        {/* Sticky summary keeps the total honest and visible throughout. */}
        <aside className="h-fit lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-shell p-5">
            <h2 className="mb-4 font-display text-base font-semibold">Order summary</h2>
            <ul className="mb-4 space-y-3">
              {cart.map((line, i) => {
                const p = bySlug(line.slug)
                if (!p) return null
                const c = p.colours.find((v) => v.id === line.colour)
                return (
                  <li key={i} className="flex gap-3">
                    <img
                      src={swatch(p.pattern, c?.swatch || p.accent, i)}
                      alt=""
                      className="h-14 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{p.name}</p>
                      <p className="text-[12px] text-muted">
                        {c?.label} · Qty {line.qty}
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold">
                      {money(priceOf(p, line.colour, line.size) * line.qty)}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="space-y-2 border-t border-line pt-4 text-sm">
              <Row label="Subtotal" value={money(subtotal)} />
              <Row
                label="Delivery"
                value={delivery === 0 ? 'Free' : money(delivery)}
                highlight={delivery === 0}
              />
              <div className="flex justify-between border-t border-line pt-3 font-display text-base font-semibold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              <p className="pt-1 text-[12px] text-muted">Inclusive of 16% VAT</p>
            </div>
          </div>

          <p className="mt-4 text-center text-[13px] text-muted">
            Buying made-to-measure too?{' '}
            <Link to="/quote" className="text-brand underline">
              Send your quote list
            </Link>
          </p>
        </aside>
      </div>
    </Container>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Input({
  label,
  placeholder,
  type = 'text',
  className,
}: {
  label: string
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={cx('font-medium', highlight && 'text-[#1a6b39]')}>{value}</span>
    </div>
  )
}
