import { useState } from 'react'
import { useBasket } from '../store/basket'
import { bySlug, rooms } from '../data/catalogue'
import { money } from '../lib/format'
import { swatch } from '../lib/swatch'
import { Button, Container, WhatsAppIcon, whatsappLink } from '../components/ui'

/**
 * The quote request is the conversion path the old site had no equivalent of.
 * Every measurement field is optional and editable here, because the point is
 * to capture the lead, not to interrogate the visitor.
 */
export function QuoteRequest() {
  const { quote, updateQuote, removeFromQuote, clear } = useBasket()
  const [sent, setSent] = useState(false)

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
        <p className="mx-auto mt-3 mb-8 max-w-md text-[15px] leading-relaxed text-muted">
          One of our fitters will call within one working day to confirm the details and book your
          free measure. Nothing is charged until you approve the written quote.
        </p>
        <Button to="/shop" size="lg">Keep browsing</Button>
      </Container>
    )
  }

  if (quote.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Your quote list is empty</h1>
        <p className="mx-auto mt-3 mb-6 max-w-md text-muted">
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
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
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
                  <img
                    src={swatch(p.pattern, c?.swatch || p.accent, i)}
                    alt=""
                    className="h-20 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-base font-semibold">{p.name}</h2>
                    <p className="text-[13px] text-muted">
                      {c?.label} · from {money(p.price)} {p.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromQuote(i)}
                    className="self-start text-[13px] text-muted underline hover:text-brand"
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
                    Notes <span className="font-normal text-muted">(optional)</span>
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
              <Field label="Full name" placeholder="Jane Wanjiru" />
              <Field label="Phone number" placeholder="07XX XXX XXX" type="tel" />
              <Field label="Email" placeholder="jane@example.com" type="email" className="sm:col-span-2" />
              <Field
                label="Where are you?"
                placeholder="Estate or area, e.g. Kileleshwa"
                className="sm:col-span-2"
              />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">
                  When suits you for the measure?
                </span>
                <select className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand">
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
            <p className="mb-4 text-[12px] leading-relaxed text-muted">
              A rough figure from the sizes you've entered. Your written quote is the real number, and it will never be higher than what you approve.
            </p>
            <p className="font-display text-3xl font-bold text-ink">
              ~{money(Math.round(indicative))}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {quote.length} {quote.length === 1 ? 'item' : 'items'} · fitting included in Nairobi
            </p>

            <div className="mt-5 space-y-2.5">
              <Button size="lg" full onClick={() => { clear('quote'); setSent(true) }}>
                Send my quote request
              </Button>
              <Button
                full
                variant="whatsapp"
                href={whatsappLink(
                  `Hello Kipekee, I would like a quote for: ${quote
                    .map((l) => {
                      const p = bySlug(l.slug)
                      const dims = l.widthCm && l.dropCm ? ` (${l.widthCm}x${l.dropCm}cm)` : ''
                      return `${p?.name}${dims} for the ${l.room.toLowerCase()}`
                    })
                    .join('; ')}`,
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
}: {
  label: string
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}
