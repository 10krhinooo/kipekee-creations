import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useBasket } from '../store/basket'
import { bySlug, priceOf } from '../data/catalogue'
import { money } from '../lib/format'
import { Button, Container, cx } from '../components/ui'
import { KENYA_COUNTIES, deliveryEtaFor } from '../data/kenya'
import { downloadDocument, printDocument, type OrderDocument } from '../lib/documents'
import {
  isValidEmail,
  isValidKenyanPhone,
  isValidMpesaCode,
  normaliseMpesaCode,
} from '../lib/validate'
import { post } from '../lib/api'
import { ProductThumb } from '../components/ProductThumb'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'

type Pay = 'mpesa' | 'card' | 'cod'

/** What the receipt calls each method. Customer-facing, so not the raw ids. */
const PAY_LABELS: Record<Pay, string> = {
  mpesa: 'M-Pesa',
  card: 'Card',
  cod: 'Cash on delivery',
}

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

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  /**
   * The code from the customer's M-Pesa confirmation SMS.
   *
   * Optional on purpose. Pochi la Biashara has no STK push and no callback, so
   * nothing here can know whether money arrived; the code is the customer
   * telling us, and staff match it against the statement. Requiring it would
   * refuse an order from anyone who has not paid yet, which is most of them.
   */
  const [mpesaCode, setMpesaCode] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
    email: false,
    mpesaCode: false,
  })

  /*
   * Fill the form in for somebody we already know.
   *
   * A signed-in customer had to retype their name, phone, email and address
   * every time, all of which the account already holds. Their default address
   * also carries a county, which is what sets the delivery estimate, so it is
   * applied too.
   *
   * Only ever into fields the visitor has not touched. Prefill that overwrites
   * what somebody is in the middle of typing is worse than no prefill: this
   * form is the last step before an order, and a delivery address silently
   * reverting is how a parcel goes to the wrong house.
   */
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    setName((v) => (touchedRef.current.name || v ? v : user.name))
    setEmail((v) => (touchedRef.current.email || v ? v : user.email))
    if (user.phone) setPhone((v) => (touchedRef.current.phone || v ? v : user.phone ?? ''))
  }, [user])

  useEffect(() => {
    if (!user) return
    let live = true
    void (async () => {
      const result = await api.get<
        { id: number; line1: string; county: string | null; phone: string | null; isDefault: boolean }[]
      >('/api/account/addresses')
      if (!live || !result.ok) return

      const pick = result.data.find((a) => a.isDefault) ?? result.data[0]
      if (!pick) return

      setAddress((v) => (touchedRef.current.address || v ? v : pick.line1))
      if (pick.phone) setPhone((v) => (touchedRef.current.phone || v ? v : pick.phone ?? ''))

      // The county drives the delivery estimate and the fee, so it has to
      // follow the address rather than stay on the Nairobi default.
      const county = KENYA_COUNTIES.find(
        (c) => c.name.toLowerCase() === (pick.county ?? '').toLowerCase(),
      )
      if (county) setTown((v) => (touchedRef.current.address ? v : county.id))
    })()
    return () => {
      live = false
    }
  }, [user])
  const [placing, setPlacing] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  /*
   * A snapshot of the order, taken before `clear('cart')` empties the basket.
   * The confirmation screen needs it to build the payment invoice, and by then
   * the only other copy of the lines is gone.
   */
  const [invoice, setInvoice] = useState<OrderDocument | null>(null)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const touch = (field: keyof typeof touched) => setTouched((t) => ({ ...t, [field]: true }))

  /*
   * `touched` as a ref as well as state. The prefill effects need to know what
   * the visitor has already edited, but must not re-run every time they touch
   * a field, or a slow address fetch could land on top of typing.
   */
  const touchedRef = useRef(touched)
  touchedRef.current = touched

  const nameError = touched.name && !name.trim() ? 'Enter your name' : undefined
  const phoneError =
    touched.phone && !isValidKenyanPhone(phone)
      ? phone.trim()
        ? 'Enter a valid Kenyan phone number, e.g. 07XX XXX XXX'
        : 'Enter your phone number'
      : undefined
  const addressError = touched.address && !address.trim() ? 'Enter a delivery address' : undefined
  const emailError =
    touched.email && !isValidEmail(email)
      ? email.trim()
        ? 'Enter a valid email address'
        : 'Enter your email so we can send the receipt'
      : undefined
  /*
   * Only checked once something has been typed. An empty box means "not paid
   * yet", which is a legitimate answer and not an error to be shouted at
   * somebody on the last screen before an order.
   */
  const mpesaCodeFilled = mpesaCode.trim() !== ''
  const mpesaCodeBad = mpesaCodeFilled && !isValidMpesaCode(mpesaCode)
  const mpesaCodeError =
    touched.mpesaCode && mpesaCodeBad
      ? 'That is not an M-Pesa code. It is 10 letters and numbers, e.g. TEA4XM9KQ2.'
      : undefined

  const canPlaceOrder =
    name.trim() !== '' &&
    isValidKenyanPhone(phone) &&
    address.trim() !== '' &&
    isValidEmail(email) &&
    // A wrong code is worse than none: it sends staff hunting through a
    // statement for a payment that was never made under it.
    !(pay === 'mpesa' && mpesaCodeBad)

  const placeOrder = async () => {
    setTouched({ name: true, phone: true, address: true, email: true, mpesaCode: true })
    if (!canPlaceOrder || placing) return

    setPlaceError(null)
    setPlacing(true)
    const county = KENYA_COUNTIES.find((c) => c.id === town)

    // Hoisted out of the request body: the confirmation screen builds the
    // payment invoice from exactly these lines, and `clear('cart')` below is
    // about to remove the only other copy of them.
    const lines = cart.map((line) => {
      const product = bySlug(line.slug)
      const colour = product?.colours.find((c) => c.id === line.colour)?.label
      const size = product?.sizes?.find((v) => v.id === line.size)?.label
      return {
        slug: line.slug,
        productName: product?.name ?? line.slug,
        detail: [colour, size].filter(Boolean).join(' · ') || null,
        qty: line.qty,
        amount: product ? priceOf(product, line.colour, line.size) * line.qty : 0,
      }
    })

    const result = await post<{ reference: string }>('/api/orders/confirmation', {
      name,
      email,
      phone,
      address,
      county: county?.name ?? null,
      paymentMethod: PAY_LABELS[pay],
      deliveryEstimate: deliveryEtaFor(town),
      deliveryAmount: delivery,
      total,
      lines,
      mpesaCode: pay === 'mpesa' && mpesaCodeFilled ? normaliseMpesaCode(mpesaCode) : null,
    })
    setPlacing(false)

    if (!result.ok) {
      setPlaceError(result.message)
      return
    }

    const ref = result.data?.reference ?? null
    setReference(ref)

    if (ref) {
      setInvoice({
        kind: 'payment-invoice',
        reference: ref,
        issuedAt: new Date(),
        name,
        email,
        phone,
        address,
        county: county?.name ?? null,
        paymentMethod: PAY_LABELS[pay],
        mpesaCode: pay === 'mpesa' && mpesaCodeFilled ? normaliseMpesaCode(mpesaCode) : null,
        deliveryEstimate: deliveryEtaFor(town),
        lines,
        subtotal,
        adjustments: [{ label: 'Delivery', amount: delivery, freeWhenZero: true }],
        total,
      })
    }

    clear('cart')
    setPlaced(true)
  }

  if (placed) {
    return (
      <Container className="py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ec]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#1a6b39]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold">Order received</h1>
        {reference && (
          <p className="mx-auto mt-4 inline-block rounded-full bg-sand px-4 py-1.5 font-display text-sm font-semibold text-ink">
            Order {reference}
          </p>
        )}
        {/*
          Rewritten to what actually happens. This promised an email, an
          afternoon dispatch and a tracking SMS; none of the three is sent by
          anything in this codebase, and a shop that misses three promises in
          two sentences on its confirmation screen has taught the customer to
          phone rather than trust it.
        */}
        {/*
          Two endings, because two things have happened. Telling somebody we
          will ring to arrange payment, seconds after they typed in the code
          proving they made it, reads as though the money went nowhere.
        */}
        <p className="mx-auto mt-3 mb-8 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {invoice?.mpesaCode ? (
            <>
              We have your order and your M-Pesa code{' '}
              <strong className="text-ink">{invoice.mpesaCode}</strong>. We check it against our
              statement, then call you on <strong className="text-ink">{phone}</strong> to confirm
              delivery. Keep your payment invoice below for your records.
            </>
          ) : (
            <>
              We have your order. Someone from the Katani Road workshop will call you on{' '}
              <strong className="text-ink">{phone}</strong> to confirm the details and arrange
              payment. Keep your payment invoice below for your records.
            </>
          )}
        </p>

        {invoice && (
          <div className="mx-auto mb-8 max-w-md rounded-panel border border-line bg-shell p-5 text-left">
            <p className="font-display text-[15px] font-semibold text-ink">Payment invoice</p>
            <p className="mt-1 mb-4 text-[13px] leading-relaxed text-muted-foreground">
              An itemised record of this order and the amount due. Not a tax invoice, we send that
              once payment clears.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => downloadDocument(invoice)}>
                Download invoice
              </Button>
              <Button size="sm" variant="outline" onClick={() => printDocument(invoice)}>
                Print or save as PDF
              </Button>
            </div>
          </div>
        )}

        <Button to="/shop" size="lg">Continue shopping</Button>
      </Container>
    )
  }

  if (cart.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-3 mb-6 text-muted-foreground">Add something ready-made and come back.</p>
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
              <Input
                label="Full name"
                placeholder="Jane Wanjiru"
                value={name}
                onChange={setName}
                onBlur={() => touch('name')}
                error={nameError}
              />
              <Input
                label="Phone number"
                placeholder="07XX XXX XXX"
                type="tel"
                value={phone}
                onChange={setPhone}
                onBlur={() => touch('phone')}
                error={phoneError}
              />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">County</span>
                <select
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  {KENYA_COUNTIES.map((county) => (
                    <option key={county.id} value={county.id}>
                      {county.name}, {deliveryEtaFor(county.id)}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Delivery address"
                placeholder="Estate, street, house or apartment"
                className="sm:col-span-2"
                value={address}
                onChange={setAddress}
                onBlur={() => touch('address')}
                error={addressError}
              />
              <Input
                label="Email"
                type="email"
                placeholder="jane@example.com"
                className="sm:col-span-2"
                value={email}
                onChange={setEmail}
                onBlur={() => touch('email')}
                error={emailError}
              />
            </div>
          </Step>

          <Step n={2} title="How would you like to pay?">
            <div className="space-y-3">
              {/*
                Written to what happens today, not to what the integration will
                do. Nothing here sends an STK push and there is no payment
                partner connected, so promising either taught a customer within
                thirty seconds that this shop says things that are not so.
              */}
              {(
                [
                  {
                    id: 'mpesa' as Pay,
                    title: 'M-Pesa',
                    body: 'Send Money on Pochi la Biashara to 0722 771 321. The number and the amount are on your invoice. Nothing is taken automatically.',
                  },
                  {
                    id: 'card' as Pay,
                    title: 'Card',
                    body: 'Visa or Mastercard. We send a secure payment link once the order is confirmed.',
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
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {option.disabled ? 'Available in Nairobi only' : option.body}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {/*
              Only under M-Pesa. Card is taken through a link we send later and
              pay-on-delivery is settled at the door, so neither has a code to
              give and a box asking for one would read as a step they had
              missed.
            */}
            {pay === 'mpesa' && (
              <div className="mt-4 rounded-xl border border-line bg-shell p-4">
                <label htmlFor="mpesa-code" className="block text-sm font-semibold">
                  Already paid? Enter your M-Pesa code
                </label>
                <p className="mt-1 mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  Send Money on Pochi la Biashara to <strong>0722 771 321</strong> for{' '}
                  {money(total)}, then copy the code from the confirmation SMS. It looks like{' '}
                  <span className="font-ui">TEA4XM9KQ2</span>. Leave it blank if you have not paid
                  yet and we will confirm the order with you first.
                </p>
                <input
                  id="mpesa-code"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, mpesaCode: true }))}
                  // Uppercase in the box as well as on the way out, so what
                  // they see matches what the SMS says.
                  style={{ textTransform: 'uppercase' }}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={12}
                  placeholder="TEA4XM9KQ2"
                  aria-invalid={mpesaCodeError ? true : undefined}
                  aria-describedby={mpesaCodeError ? 'mpesa-code-error' : undefined}
                  className={cx(
                    'w-full rounded-xl border bg-white px-4 py-3 font-ui text-sm tracking-[0.08em] outline-none',
                    mpesaCodeError ? 'border-brand' : 'border-line focus:border-brand',
                  )}
                />
                {mpesaCodeError ? (
                  <p id="mpesa-code-error" role="alert" className="mt-2 text-[12.5px] text-brand">
                    {mpesaCodeError}
                  </p>
                ) : (
                  mpesaCodeFilled &&
                  !mpesaCodeBad && (
                    <p className="mt-2 text-[12.5px] text-[#1a6b39]">
                      Recorded against this order. We check it against our statement before
                      dispatch.
                    </p>
                  )
                )}
              </div>
            )}
          </Step>

          <Step n={3} title="Confirm">
            <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
              By placing the order you agree to our delivery and returns terms. Ready-made stock can
              be returned within 14 days unused.
            </p>
            <Button size="lg" full disabled={placing} onClick={placeOrder}>
              {placing ? 'Placing your order…' : `Place order · ${money(total)}`}
            </Button>
            {placeError && (
              <p role="alert" className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-center text-[12.5px] leading-relaxed text-brand-700">
                {placeError}
              </p>
            )}
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              No payment is taken on this screen. We confirm the total with you before anything is
              charged.
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
                    <ProductThumb
                      product={p}
                      colourId={line.colour}
                      index={i}
                      className="h-14 w-12"
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{p.name}</p>
                      <p className="text-[12px] text-muted-foreground">
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
              <p className="pt-1 text-[12px] text-muted-foreground">Inclusive of 16% VAT</p>
            </div>
          </div>

          <p className="mt-4 text-center text-[13px] text-muted-foreground">
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
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string
  placeholder?: string
  type?: string
  className?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  error?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        className={cx(
          'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-brand',
          error ? 'border-red-400' : 'border-line',
        )}
      />
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cx('font-medium', highlight && 'text-[#1a6b39]')}>{value}</span>
    </div>
  )
}
