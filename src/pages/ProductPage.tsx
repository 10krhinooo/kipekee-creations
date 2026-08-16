import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bySlug, categoryBySlug, priceOf, products, rooms } from '../data/catalogue'
import type { Room } from '../data/types'
import { swatch } from '../lib/swatch'
import { leadTime, money } from '../lib/format'
import { useBasket } from '../store/basket'
import { ProductCard } from '../components/ProductCard'
import {
  Badge,
  Button,
  Container,
  SectionHeading,
  Stars,
  WhatsAppIcon,
  cx,
  whatsappLink,
} from '../components/ui'

type Tab = 'overview' | 'specs' | 'care' | 'delivery' | 'reviews'

export function ProductPage() {
  const { slug = '' } = useParams()
  const product = bySlug(slug)
  const { addToCart, addToQuote } = useBasket()

  const [colour, setColour] = useState(product?.colours[0].id ?? '')
  const [size, setSize] = useState(product?.sizes?.[0].id ?? '')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<Tab>('overview')
  const [activeImage, setActiveImage] = useState(0)

  // Quote-mode measurement inputs, the data a real quote actually needs.
  const [room, setRoom] = useState(product?.rooms[0] ?? 'Living room')
  const [width, setWidth] = useState('')
  const [drop, setDrop] = useState('')
  const [windows, setWindows] = useState(1)

  const related = useMemo(
    () =>
      product
        ? products.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4)
        : [],
    [product],
  )

  if (!product) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Product not found</h1>
        <p className="mt-3 mb-6 text-muted">It may have been renamed or retired.</p>
        <Button to="/shop">Back to shop</Button>
      </Container>
    )
  }

  const isQuote = product.mode === 'quote'
  const selectedColour = product.colours.find((c) => c.id === colour) ?? product.colours[0]
  const selectedSize = product.sizes?.find((s) => s.id === size)
  const unitPrice = priceOf(product, colour, size)
  const category = categoryBySlug(product.category)

  // For fabric and track-metre pricing, the running total is what a shopper
  // actually wants to know before committing.
  const estimate = isQuote
    ? unitPrice * (Number(width || 0) / 100 || 1) * windows
    : unitPrice * qty

  const gallery = [
    swatch(product.pattern, selectedColour.swatch || product.accent, 0),
    swatch(product.pattern, selectedColour.swatch || product.accent, 5),
    swatch('plain', selectedColour.swatch || product.accent, 2),
    swatch(product.pattern, selectedColour.swatch || product.accent, 9),
  ]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specifications' },
    { id: 'care', label: 'Care' },
    { id: 'delivery', label: 'Delivery & returns' },
    { id: 'reviews', label: `Reviews (${product.reviewCount})` },
  ]

  return (
    <Container className="py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <Link to="/" className="hover:text-brand">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category}`} className="hover:text-brand">
          {category?.name}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* GALLERY */}
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-sand">
            <img
              src={gallery[activeImage]}
              alt={`${product.name} in ${selectedColour.label}`}
              className="aspect-4/5 w-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {isQuote ? <Badge tone="quote">Made to measure</Badge> : null}
              {product.compareAt && (
                <Badge tone="brand">Save {money(product.compareAt - product.price)}</Badge>
              )}
              {product.badges?.map((b) => (
                <Badge key={b}>{b}</Badge>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cx(
                  'overflow-hidden rounded-xl border-2 transition-colors',
                  i === activeImage ? 'border-brand' : 'border-transparent hover:border-line',
                )}
                aria-label={`View image ${i + 1}`}
              >
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* BUY / QUOTE PANEL */}
        <div>
          <h1 className="font-display text-2xl leading-tight font-semibold text-ink sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Stars rating={product.rating} count={product.reviewCount} />
            <button
              onClick={() => setTab('reviews')}
              className="text-[13px] text-muted underline hover:text-brand"
            >
              Read reviews
            </button>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{product.summary}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-3 border-y border-line py-5">
            {isQuote && <span className="text-sm text-muted">From</span>}
            <span className="font-display text-3xl font-bold text-ink">{money(unitPrice)}</span>
            {product.compareAt && (
              <span className="text-lg text-muted line-through">{money(product.compareAt)}</span>
            )}
            <span className="text-sm text-muted">{product.unit}</span>
          </div>

          {/* Colour */}
          <div className="mt-6">
            <p className="mb-2.5 text-sm font-medium">
              Colour: <span className="text-muted">{selectedColour.label}</span>
              {!selectedColour.inStock && (
                <span className="ml-2 text-[12px] text-brand">Out of stock, 3 week lead time</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.colours.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColour(c.id)}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={c.id === colour}
                  className={cx(
                    'relative h-10 w-10 rounded-full border-2 transition-transform hover:scale-110',
                    c.id === colour ? 'border-brand' : 'border-line',
                    !c.inStock && 'opacity-45',
                  )}
                  style={{ background: c.swatch }}
                >
                  {!c.inStock && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mix-blend-difference">
                      ✕
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Size / heading / finial */}
          {product.sizes && (
            <div className="mt-6">
              <p className="mb-2.5 text-sm font-medium">
                {isQuote ? 'Style' : 'Size'}:{' '}
                <span className="text-muted">{selectedSize?.label}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    aria-pressed={s.id === size}
                    className={cx(
                      'rounded-full border px-4 py-2 text-sm transition-colors',
                      s.id === size
                        ? 'border-brand bg-brand-50 text-brand'
                        : 'border-line hover:border-ink/30',
                    )}
                  >
                    {s.label}
                    {s.delta ? (
                      <span className="ml-1.5 text-[12px] text-muted">
                        {s.delta > 0 ? '+' : ''}
                        {money(s.delta)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isQuote ? (
            /* QUOTE PATH, collect what a quote needs, but keep every field
               optional so an unmeasured visitor is never blocked. */
            <div className="mt-7 rounded-2xl border border-line bg-shell p-5">
              <h2 className="font-display text-base font-semibold">Get your fixed price</h2>
              <p className="mt-1 mb-4 text-[13px] leading-relaxed text-muted">
                Fill in what you know. Leave the rest. Our fitter measures for free across Nairobi.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Room">
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value as Room)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    {rooms.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Number of windows">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={windows}
                    onChange={(e) => setWindows(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </Field>
                <Field label="Track width (cm)" hint="optional">
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g. 220"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </Field>
                <Field label="Drop (cm)" hint="optional">
                  <input
                    type="number"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    placeholder="e.g. 240"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </Field>
              </div>

              <Link
                to="/measure-guide"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-brand underline"
              >
                How do I measure?
              </Link>

              {width && (
                <div className="mt-4 rounded-xl border border-line bg-white px-4 py-3">
                  <p className="text-[12px] text-muted">Indicative estimate</p>
                  <p className="font-display text-xl font-semibold text-ink">
                    ~{money(Math.round(estimate))}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">
                    Based on {width} cm × {windows} {windows === 1 ? 'window' : 'windows'}. Your
                    written quote confirms the final price.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                <Button
                  full
                  size="lg"
                  onClick={() =>
                    addToQuote({
                      slug: product.slug,
                      colour,
                      room,
                      widthCm: width ? Number(width) : undefined,
                      dropCm: drop ? Number(drop) : undefined,
                      windows,
                    })
                  }
                >
                  Add to quote list
                </Button>
                <Button
                  full
                  variant="whatsapp"
                  href={whatsappLink(
                    `Hello Kipekee, I would like a quote for ${product.name} (${selectedColour.label}) for my ${room.toLowerCase()}.`,
                  )}
                >
                  <WhatsAppIcon />
                  Ask on WhatsApp
                </Button>
              </div>

              <p className="mt-4 text-center text-[12px] text-muted">
                Written quote within 1 working day · No obligation · {leadTime(product.leadTimeDays)}{' '}
                once approved
              </p>
            </div>
          ) : (
            /* BUY PATH */
            <div className="mt-7">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:text-brand"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-4 py-3 hover:text-brand"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-muted">
                  Total <strong className="text-ink">{money(estimate)}</strong>
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                <Button
                  full
                  size="lg"
                  disabled={!selectedColour.inStock}
                  onClick={() => addToCart({ slug: product.slug, qty, colour, size: size || undefined })}
                >
                  {selectedColour.inStock ? 'Add to cart' : 'Out of stock in this colour'}
                </Button>
                <Button
                  full
                  variant="outline"
                  href={whatsappLink(
                    `Hello Kipekee, is ${product.name} (${selectedColour.label}) available?`,
                  )}
                >
                  <WhatsAppIcon />
                  Check stock on WhatsApp
                </Button>
              </div>

              <ul className="mt-5 space-y-2 text-[13px] text-ink-soft">
                <li className="flex gap-2">
                  <Tick />
                  <span>
                    <strong>{leadTime(product.leadTimeDays)}</strong>, {product.stock} in stock at
                    the Mombasa Road workshop
                  </span>
                </li>
                <li className="flex gap-2">
                  <Tick />
                  <span>Free Nairobi delivery over {money(10000)}, otherwise {money(450)}</span>
                </li>
                <li className="flex gap-2">
                  <Tick />
                  <span>14-day returns on unused stock, no questions asked</span>
                </li>
                <li className="flex gap-2">
                  <Tick />
                  <span>Pay by M-Pesa, card or on delivery within Nairobi</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* TABS, the old product page had these headings but no content behind them. */}
      <div className="mt-16">
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === 'overview' && (
            <div className="max-w-3xl space-y-4">
              {product.description.map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-ink-soft">
                  {para}
                </p>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                {product.rooms.map((r) => (
                  <Link
                    key={r}
                    to={`/shop?room=${encodeURIComponent(r)}`}
                    className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-soft hover:border-brand hover:text-brand"
                  >
                    {r}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tab === 'specs' && (
            <div className="max-w-2xl overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {product.specs.map((s) => (
                    <tr key={s.label}>
                      <th scope="row" className="w-2/5 bg-shell px-4 py-3 text-left font-medium">
                        {s.label}
                      </th>
                      <td className="px-4 py-3 text-ink-soft">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'care' && (
            <ul className="max-w-2xl space-y-3">
              {product.care.map((c) => (
                <li key={c} className="flex gap-2.5 text-[15px] text-ink-soft">
                  <Tick />
                  {c}
                </li>
              ))}
            </ul>
          )}

          {tab === 'delivery' && (
            <div className="grid max-w-4xl gap-6 sm:grid-cols-3">
              {[
                {
                  h: 'Nairobi',
                  b: `Next-day delivery, free over ${money(10000)}. Otherwise ${money(450)}. Order before 2pm on a weekday and stock items leave the same afternoon.`,
                },
                {
                  h: 'Rest of Kenya',
                  b: 'Courier to any town, 2–4 working days, quoted at checkout. We use G4S and Wells Fargo depending on your town.',
                },
                {
                  h: 'Returns',
                  b: '14 days on unused ready-made stock in its original packaging. Made-to-measure work is cut to your window, so it is non-returnable unless we got the measurements wrong, in which case we remake it free.',
                },
              ].map((x) => (
                <div key={x.h}>
                  <h3 className="mb-2 font-display text-base font-semibold">{x.h}</h3>
                  <p className="text-[14px] leading-relaxed text-muted">{x.b}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="max-w-3xl">
              <div className="mb-8 flex flex-wrap items-center gap-6 rounded-2xl bg-shell p-6">
                <div className="text-center">
                  <p className="font-display text-4xl font-bold text-ink">{product.rating}</p>
                  <Stars rating={product.rating} />
                  <p className="mt-1 text-[12px] text-muted">{product.reviewCount} reviews</p>
                </div>
                <div className="min-w-48 flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const share =
                      star === 5 ? 78 : star === 4 ? 16 : star === 3 ? 4 : star === 2 ? 1 : 1
                    return (
                      <div key={star} className="flex items-center gap-2 text-[12px]">
                        <span className="w-3 text-muted">{star}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                          <div className="h-full bg-[#e0a422]" style={{ width: `${share}%` }} />
                        </div>
                        <span className="w-8 text-right text-muted">{share}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <ul className="divide-y divide-line">
                {product.reviews.map((rev) => (
                  <li key={rev.author + rev.date} className="py-5">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <Stars rating={rev.rating} />
                      <span className="text-sm font-semibold">{rev.author}</span>
                      <span className="text-[12px] text-muted">
                        {rev.location} · {rev.date}
                      </span>
                      <Badge tone="stock">Verified purchase</Badge>
                    </div>
                    <p className="text-[15px] leading-relaxed text-ink-soft">{rev.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="You may also like" title={`More from ${category?.name}`} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i + 3} />
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {hint && <span className="ml-1 font-normal text-muted">({hint})</span>}
      </span>
      {children}
    </label>
  )
}

function Tick() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-1 h-4 w-4 shrink-0 text-brand"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  )
}
