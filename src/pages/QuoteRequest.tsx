import { useState } from 'react'
import { useBasket } from '../store/basket'
import { bySlug, rooms } from '../data/catalogue'
import { money } from '../lib/format'
import { Button, Container, WhatsAppIcon, cx } from '../components/ui'
import { quoteWhatsAppLink } from '../lib/whatsapp'
import { isValidEmail, isValidKenyanPhone } from '../lib/validate'
import { post } from '../lib/api'
import { ProductThumb } from '../components/ProductThumb'
import { downloadDocument, printDocument, type OrderDocument } from '../lib/documents'

/**
 * The quote request is the conversion path for made-to-measure work.
 * Every measurement field is optional and editable here, because the point is
 * to capture the lead, not to interrogate the visitor.
 */
export function QuoteRequest() {
  const { quote, updateQuote, removeFromQuote, clear } = useBasket()
  const [sent, setSent] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  /*
   * A snapshot for the take-away copy, captured before `clear('quote')` empties
   * the list. Measurements somebody climbed a ladder for are the last thing
   * that should exist only in a cleared basket.
   */
  const [quoteDoc, setQuoteDoc] = useState<OrderDocument | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [preferredTime, setPreferredTime] = useState('As soon as possible')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')
  const [touched, setTouched] = useState({ name: false, phone: false, email: false })
  const touch = (field: keyof typeof touched) => setTouched((t) => ({ ...t, [field]: true }))

  const nameError = touched.name && !name.trim() ? 'Enter your name' : undefined
  const phoneError =
    touched.phone && !isValidKenyanPhone(phone)
      ? phone.trim()
        ? 'Enter a valid Kenyan phone number, e.g. 07XX XXX XXX'
        : 'Enter your phone number'
      : undefined
  const emailError = touched.email && email.trim() && !isValidEmail(email) ? 'Enter a valid email address' : undefined
  const canSend = name.trim() !== '' && isValidKenyanPhone(phone) && (email.trim() === '' || isValidEmail(email))

  const sendQuote = async () => {
    setTouched({ name: true, phone: true, email: true })
    if (!canSend || sending) return

    setSendError(null)
    setSending(true)
    const result = await post<{ reference: string }>('/api/quotes/request', {
      name,
      phone,
      email: email.trim() || null,
      area: area.trim() || null,
      preferredTime,
      lines: quote.map((line) => {
        const product = bySlug(line.slug)
        const metres = line.widthCm ? line.widthCm / 100 : 1
        return {
          productName: product?.name ?? line.slug,
          colour: product?.colours.find((c) => c.id === line.colour)?.label ?? null,
          room: line.room,
          widthCm: line.widthCm ?? null,
          dropCm: line.dropCm ?? null,
          windows: line.windows,
          notes: line.notes?.trim() || null,
          indicativeAmount: product ? Math.round(product.price * metres * line.windows) : null,
        }
      }),
    })
    setSending(false)

    if (!result.ok) {
      setSendError(result.message)
      return
    }

    // Only cleared once the workshop has it. Clearing first would throw away
    // measurements the visitor took off a window if the request never landed.
    const ref = result.data?.reference ?? null
    setReference(ref)

    if (ref) {
      setQuoteDoc({
        kind: 'quote-request',
        reference: ref,
        issuedAt: new Date(),
        name,
        email: email.trim() || null,
        phone,
        address: area.trim() || null,
        county: null,
        paymentMethod: 'Not yet quoted',
        deliveryEstimate: `Preferred measure: ${preferredTime}`,
        lines: quote.map((line) => {
          const product = bySlug(line.slug)
          const colour = product?.colours.find((c) => c.id === line.colour)?.label
          const size =
            line.widthCm && line.dropCm ? `${line.widthCm}cm wide x ${line.dropCm}cm drop` : null
          return {
            productName: product?.name ?? line.slug,
            detail: [colour, line.room].filter(Boolean).join(' · ') || null,
            measurements: [size, line.notes?.trim()].filter(Boolean).join(' · ') || null,
            qty: line.windows,
            amount: 0,
            priced: false,
          }
        }),
        subtotal: 0,
        total: 0,
      })
    }

    clear('quote')
    setSent(true)
  }

  const indicative = quote.reduce((sum, line) => {
    const p = bySlug(line.slug)
    if (!p) return sum
    const metres = line.widthCm ? line.widthCm / 100 : 1
    return sum + p.price * metres * line.windows
  }, 0)

  if (sent) {
    return (
      <Container className="py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ec]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#1a6b39]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold">Quote request sent</h1>
        {reference && (
          <p className="mx-auto mt-4 inline-block rounded-full bg-sand px-4 py-1.5 font-display text-sm font-semibold text-ink">
            Reference {reference}
          </p>
        )}
        <p className="mx-auto mt-3 mb-8 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          One of our fitters will call within one working day to confirm the details and book your
          free measure. Nothing is charged until you approve the written quote.
        </p>

        {quoteDoc && (
          <div className="mx-auto mb-8 max-w-md rounded-panel border border-line bg-shell p-5 text-left">
            <p className="font-display text-[15px] font-semibold text-ink">Your quote request</p>
            <p className="mt-1 mb-4 text-[13px] leading-relaxed text-muted-foreground">
              Every room, size and note you entered, with your details and reference {reference}.
              Keep it so you can check our quotation against what you asked for.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => downloadDocument(quoteDoc)}>
                Download a copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => printDocument(quoteDoc)}>
                Print or save as PDF
              </Button>
            </div>
          </div>
        )}

        <Button to="/shop" size="lg">Keep browsing</Button>
      </Container>
    )
  }

  if (quote.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Your quote list is empty</h1>
        <p className="mx-auto mt-3 mb-6 max-w-md text-muted-foreground">
          Add curtains, rails or canopies and we'll come back with a fixed price for the whole job.
        </p>
        <Button to="/shop?mode=quote">Browse made-to-measure</Button>
      </Container>
    )
  }

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Request your quote</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Confirm what you know below. Anything you leave blank, our fitter measures on site for free,
          anywhere in Nairobi. You'll get an itemised written quote within one working day.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {quote.map((line, i) => {
            const p = bySlug(line.slug)
            if (!p) return null
            const c = p.colours.find((v) => v.id === line.colour)
            return (
              <div key={i} className="rounded-2xl border border-line p-5">
                <div className="mb-4 flex gap-4">
                  <ProductThumb
                    product={p}
                    colourId={line.colour}
                    index={i}
                    className="h-20 w-16"
                    sizes="64px"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-base font-semibold">{p.name}</h2>
                    <p className="text-[13px] text-muted-foreground">
                      {c?.label} · from {money(p.price)} {p.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromQuote(i)}
                    className="self-start text-[13px] text-muted-foreground underline hover:text-brand"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium">Room</span>
                    <select
                      value={line.room}
                      onChange={(e) => updateQuote(i, { room: e.target.value })}
                      className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                    >
                      {rooms.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <NumField
                    label="Width (cm)"
                    value={line.widthCm}
                    onChange={(v) => updateQuote(i, { widthCm: v })}
                  />
                  <NumField
                    label="Drop (cm)"
                    value={line.dropCm}
                    onChange={(v) => updateQuote(i, { dropCm: v })}
                  />
                  <NumField
                    label="Windows"
                    value={line.windows}
                    min={1}
                    onChange={(v) => updateQuote(i, { windows: Math.max(1, v ?? 1) })}
                  />
                </div>

                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[12px] font-medium">
                    Notes <span className="font-normal text-muted-foreground">(optional)</span>
                  </span>
                  <textarea
                    rows={2}
                    value={line.notes ?? ''}
                    onChange={(e) => updateQuote(i, { notes: e.target.value })}
                    placeholder="e.g. bay window, existing rail to reuse, north-facing so it gets hot"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
              </div>
            )
          })}

          <div className="rounded-2xl border border-line p-5 sm:p-6">
            <h2 className="mb-5 font-display text-lg font-semibold">Your details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                placeholder="Jane Wanjiru"
                value={name}
                onChange={setName}
                onBlur={() => touch('name')}
                error={nameError}
              />
              <Field
                label="Phone number"
                placeholder="07XX XXX XXX"
                type="tel"
                value={phone}
                onChange={setPhone}
                onBlur={() => touch('phone')}
                error={phoneError}
              />
              <Field
                label="Email"
                placeholder="jane@example.com"
                type="email"
                className="sm:col-span-2"
                value={email}
                onChange={setEmail}
                onBlur={() => touch('email')}
                error={emailError}
              />
              <Field
                label="Where are you?"
                placeholder="Estate or area, e.g. Kileleshwa"
                className="sm:col-span-2"
                value={area}
                onChange={setArea}
              />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">
                  When suits you for the measure?
                </span>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option>As soon as possible</option>
                  <option>This week, weekday morning</option>
                  <option>This week, weekday afternoon</option>
                  <option>Saturday</option>
                  <option>I'll arrange it on the call</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-shell p-5">
            <h2 className="mb-1 font-display text-base font-semibold">Indicative total</h2>
            <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">
              A rough figure from the sizes you've entered. Your written quote is the real number, and it will never be higher than what you approve.
            </p>
            <p className="font-display text-3xl font-bold text-ink">
              ~{money(Math.round(indicative))}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {quote.length} {quote.length === 1 ? 'item' : 'items'} · fitting included in Nairobi
            </p>

            <div className="mt-5 space-y-2.5">
              <Button size="lg" full disabled={sending} onClick={sendQuote}>
                {sending ? 'Sending…' : 'Send my quote request'}
              </Button>
              {sendError && (
                <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2 text-[12.5px] leading-relaxed text-brand-700">
                  {sendError}
                </p>
              )}
              <Button
                full
                variant="whatsapp"
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
            </div>
          </div>

          <ul className="space-y-2.5 rounded-2xl border border-line p-5 text-[13px] text-ink-soft">
            {[
              'Free site measure across Nairobi within 48 hours',
              'Fixed written quote, valid 30 days',
              'Nothing charged until you approve it',
              'Pay half on approval, half on fitting',
            ].map((x) => (
              <li key={x} className="flex gap-2.5">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12l5 5L20 6" />
                </svg>
                {x}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Container>
  )
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
  min?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium">{label}</span>
      <input
        type="number"
        min={min}
        value={value ?? ''}
        placeholder=""
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}

function Field({
  label,
  placeholder,
  type = 'text',
  className = '',
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
    <label className={`block ${className}`}>
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
