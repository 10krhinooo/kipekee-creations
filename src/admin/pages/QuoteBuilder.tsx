import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { money } from '../../lib/format'
import { Button, WhatsAppIcon, cx, whatsappLink } from '../../components/ui'
import { Card, CardHeader, PageHeader, StatusPill } from '../components/AdminUI'
import {
  quotePipeline,
  quoteStatusLabel,
  quotes,
  type QuoteLineItem,
} from '../data/operations'

/** Fitting and delivery are quoted as a line, not buried in the item prices. */
const FITTING_PER_WINDOW = 800

/**
 * The quote builder is the screen that makes the whole model work. Staff take
 * the raw measurements the customer submitted, price each window, and send a
 * fixed total. Until this exists, "request a quote" on the storefront is just
 * an inbox.
 */
export function QuoteBuilder() {
  const { id = '' } = useParams()
  const quote = quotes.find((q) => q.id === id)

  const [items, setItems] = useState<QuoteLineItem[]>(quote?.items ?? [])
  const [discount, setDiscount] = useState(0)
  const [includeFitting, setIncludeFitting] = useState(true)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  if (!quote) {
    return (
      <>
        <PageHeader title="Quote not found" />
        <Button to="/admin/quotes">Back to quotes</Button>
      </>
    )
  }

  const windows = items.reduce((n, i) => n + i.windows, 0)
  const itemsTotal = items.reduce((sum, i) => sum + (i.pricedTotal ?? 0), 0)
  const fitting = includeFitting ? windows * FITTING_PER_WINDOW : 0
  const subtotal = itemsTotal + fitting
  const discountValue = Math.round((subtotal * discount) / 100)
  const total = subtotal - discountValue
  const priced = items.every((i) => i.pricedTotal !== null && i.pricedTotal > 0)

  const setPrice = (index: number, value: number | null) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, pricedTotal: value } : it)))

  const stageIndex = quotePipeline.indexOf(quote.status)

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
        <Link to="/admin/quotes" className="hover:text-brand">
          Quotes
        </Link>
        <span>/</span>
        <span className="text-ink">{quote.id}</span>
      </nav>

      <PageHeader
        title={quote.customer}
        intro={`${quote.area} · ${quote.phone} · came in via ${quote.source}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="whatsapp"
              href={whatsappLink(`Hello ${quote.customer.split(' ')[0]}, about your Kipekee quote ${quote.id}:`)}
            >
              <WhatsAppIcon />
              Message
            </Button>
            <Button size="sm" variant="outline">
              Book a measure
            </Button>
          </div>
        }
      />

      {/* Pipeline tracker */}
      <Card className="mb-5">
        <ol className="flex flex-wrap items-center gap-y-3">
          {quotePipeline.map((stage, i) => {
            const done = i < stageIndex
            const current = i === stageIndex
            return (
              <li key={stage} className="flex items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                      done && 'bg-[#e8f5ec] text-[#1a6b39]',
                      current && 'bg-brand text-white',
                      !done && !current && 'bg-shell text-muted',
                    )}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span
                    className={cx(
                      'text-[12px] whitespace-nowrap',
                      current ? 'font-semibold text-ink' : 'text-muted',
                    )}
                  >
                    {quoteStatusLabel[stage]}
                  </span>
                </div>
                {i < quotePipeline.length - 1 && (
                  <span className={cx('mx-2 h-px w-6', done ? 'bg-[#1a6b39]' : 'bg-line')} />
                )}
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card padded={false}>
            <div className="p-5 pb-3">
              <CardHeader
                title="Price the job"
                hint="One line per product. Measurements come straight from the customer's request."
              />
            </div>

            <ul className="divide-y divide-line">
              {items.map((item, i) => (
                <li key={i} className="p-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-[15px] font-semibold">{item.product}</h3>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {item.colour} · {item.room} · {item.windows}{' '}
                        {item.windows === 1 ? 'window' : 'windows'}
                      </p>
                    </div>
                    <span className="rounded-lg bg-shell px-3 py-1.5 text-[12px] font-medium">
                      {item.widthCm && item.dropCm
                        ? `${item.widthCm} x ${item.dropCm} cm`
                        : item.widthCm
                          ? `${item.widthCm} cm wide`
                          : 'To be measured'}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="mb-3 rounded-lg border-l-2 border-brand bg-shell px-3 py-2 text-[13px] leading-relaxed text-ink-soft">
                      <strong className="text-ink">Customer note:</strong> {item.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-medium">Price for this line</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-muted">KSh</span>
                        <input
                          type="number"
                          value={item.pricedTotal ?? ''}
                          placeholder="0"
                          onChange={(e) =>
                            setPrice(i, e.target.value === '' ? null : Number(e.target.value))
                          }
                          className="w-36 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                        />
                      </div>
                    </label>

                    {item.widthCm && (
                      <button
                        onClick={() =>
                          setPrice(i, Math.round((item.widthCm! / 100) * 3200 * item.windows))
                        }
                        className="rounded-full border border-line px-3.5 py-2 text-[12px] font-medium hover:border-brand hover:text-brand"
                      >
                        Use list rate
                      </button>
                    )}

                    {item.pricedTotal ? (
                      <span className="ml-auto text-[12px] text-muted">
                        {money(Math.round(item.pricedTotal / item.windows))} per window
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Note to the customer"
              hint="Appears at the top of the quote they receive"
            />
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Priced with the wave heading you asked about. The olive is in stock, so we can fit the week of the 25th."
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </Card>
        </div>

        {/* Sticky totals and send */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[15px] font-semibold">Quote total</h2>
              <StatusPill kind="quote" status={quote.status} label={quoteStatusLabel[quote.status]} />
            </div>

            <div className="space-y-2.5 text-sm">
              <Row label={`Items (${items.length})`} value={itemsTotal ? money(itemsTotal) : 'Not priced'} />

              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    checked={includeFitting}
                    onChange={(e) => setIncludeFitting(e.target.checked)}
                    className="h-4 w-4 accent-[#a11c20]"
                  />
                  Fitting, {windows} windows
                </span>
                <span className="font-medium">{money(fitting)}</span>
              </label>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted">
                  Discount
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(30, Math.max(0, Number(e.target.value))))}
                    className="w-16 rounded-lg border border-line px-2 py-1 text-[13px] outline-none focus:border-brand"
                  />
                  %
                </span>
                <span className="font-medium text-brand">
                  {discountValue ? `-${money(discountValue)}` : money(0)}
                </span>
              </div>

              <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-bold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              <p className="text-[12px] text-muted">Inclusive of VAT. Valid 30 days.</p>
            </div>

            <div className="mt-5 space-y-2.5">
              <Button full disabled={!priced || sent} onClick={() => setSent(true)}>
                {sent ? 'Quote sent' : 'Send quote to customer'}
              </Button>
              <Button full variant="outline">
                Save draft
              </Button>
            </div>

            {!priced && (
              <p className="mt-3 text-center text-[12px] text-brand">
                Every line needs a price before this can be sent.
              </p>
            )}
            {sent && (
              <p className="mt-3 text-center text-[12px] text-[#1a6b39]">
                Sent by SMS and email. Prototype only, nothing left the building.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Deposit split" hint="How the customer pays" />
            <div className="space-y-2 text-sm">
              <Row label="On approval, 50%" value={money(Math.round(total / 2))} />
              <Row label="On fitting, 50%" value={money(total - Math.round(total / 2))} />
            </div>
          </Card>

          <Card>
            <CardHeader title="History" />
            <ol className="space-y-3 text-[13px]">
              {[
                { t: 'Request received', d: new Date(quote.requestedAt).toLocaleString('en-KE') },
                quote.measureSlot ? { t: 'Measure booked', d: quote.measureSlot } : null,
                quote.sentAt ? { t: 'Quote sent', d: new Date(quote.sentAt).toLocaleString('en-KE') } : null,
              ]
                .filter((x): x is { t: string; d: string } => x !== null)
                .map((e) => (
                  <li key={e.t} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>
                      <span className="block font-medium">{e.t}</span>
                      <span className="block text-[12px] text-muted">{e.d}</span>
                    </span>
                  </li>
                ))}
            </ol>
          </Card>
        </aside>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
