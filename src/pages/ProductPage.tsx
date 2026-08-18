import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bySlug, categoryBySlug, priceOf, products, rooms } from '../data/catalogue'
import type { Room } from '../data/types'
import { swatch } from '../lib/swatch'
import { leadTime, money } from '../lib/format'
import { useBasket } from '../store/basket'
import { usePhotos } from '../store/photos'
import { useSaved } from '../store/saved'
import { ProductCard } from '../components/ProductCard'
import { PhotoGrid } from '../components/PhotoGrid'
import { Lightbox } from '../components/Lightbox'
import { RecentlyViewed } from '../components/RecentlyViewed'
import { sceneTabLabel } from '../components/RoomPreview'
import { RoomView } from '../components/preview/RoomView'
import { TierToggle } from '../components/preview/TierToggle'
import type {
  Finial,
  Heading,
  SceneKind,
  SceneVariant,
} from '../components/preview/types'
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

/**
 * Keyed on the slug so every product gets a clean slate. Navigating between
 * products reuses this route, and without the key the previously chosen colour
 * and heading leak into the next product, which can select a style it does not
 * even offer.
 */
export function ProductPage() {
  const { slug = '' } = useParams()
  return <ProductDetail key={slug} slug={slug} />
}

function ProductDetail({ slug }: { slug: string }) {
  const product = bySlug(slug)
  const { addToCart, addToQuote } = useBasket()
  const { photosFor } = usePhotos()
  const { recordView } = useSaved()

  const [colour, setColour] = useState(product?.colours[0].id ?? '')
  const [size, setSize] = useState(product?.sizes?.[0].id ?? '')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<Tab>('overview')
  const [activeImage, setActiveImage] = useState(0)
  const [view, setView] = useState<'room' | 'photos' | 'fabric'>('room')
  /** Which swatch the lightbox is showing, or null when it is closed. */
  const [zoom, setZoom] = useState<number | null>(null)
  const [drawn, setDrawn] = useState(true)
  const [night, setNight] = useState(false)

  // Quote-mode measurement inputs, the data a real quote actually needs.
  const [room, setRoom] = useState(product?.rooms[0] ?? 'Living room')
  const [width, setWidth] = useState('')
  const [drop, setDrop] = useState('')
  const [windows, setWindows] = useState(1)

  // Recorded here rather than in the route so a direct link counts as a view.
  useEffect(() => {
    if (product) recordView(product.slug)
  }, [product, recordView])

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

  /**
   * Every product gets shown where it actually lives. A towel on a window tells
   * you nothing, so the scene follows the category, with two overrides for
   * products filed under a category they do not visually belong to.
   */
  const sceneBySlug: Record<string, SceneKind> = {
    'hotel-pool-towels': 'bath',
    'decor-towel-pair': 'bath',
  }

  const sceneByCategory: Record<string, SceneKind> = {
    curtains: 'window',
    fabrics: 'window',
    'wrought-iron': 'window',
    'bed-canopies': 'bed',
    'hotel-linen': 'bed',
    'cushion-covers': 'sofa',
    towels: 'bath',
    household: 'dining',
  }

  const scene: SceneKind = sceneBySlug[product.slug] ?? sceneByCategory[product.category] ?? 'sofa'

  const variant: SceneVariant =
    product.category === 'wrought-iron'
      ? product.slug === 'wrought-iron-curtain-rail' ? 'rail' : 'bracket'
      : product.category === 'bed-canopies'
        ? 'canopy'
        : product.pattern === 'sheer'
          ? 'sheer'
          : product.category === 'curtains' || product.category === 'fabrics'
            ? 'curtains'
            : 'default'

  /** Only a window scene with real panels can be opened and closed. */
  const canDraw = scene === 'window' && variant !== 'rail' && variant !== 'bracket'
  // Curtains remain a single, deliberately 2D experience. The other room
  // products have a real 3D view and may offer the flat renderer as a lighter
  // alternative or fallback.
  const supports3D = scene !== 'window' || variant === 'rail' || variant === 'bracket'
  const showTierToggle = supports3D && product.slug !== 'woven-table-mats'

  /**
   * Bed scenes resize with the selected size, so a king reads as wider than a
   * single instead of the size buttons only changing the price.
   */
  const bedScale = size.includes('king')
    ? 1.14
    : size.includes('queen')
      ? 1.0
      : size.includes('four-poster')
        ? 1.08
        : size.includes('double')
          ? 0.9
          : size.includes('single')
            ? 0.76
            : 1.0

  /**
   * The style selector drives the scene. Picking wave heading should change the
   * silhouette in the room, not just the price, because the heading is the
   * hardest part of a curtain to picture from words alone.
   */
  const heading: Heading = size.includes('wave')
    ? 'wave'
    : size.includes('eyelet')
      ? 'eyelet'
      : 'pencil'

  const finial: Finial = size.includes('scroll')
    ? 'scroll'
    : size.includes('spear')
      ? 'spear'
      : 'ball'

  const gallery = [
    swatch(product.pattern, selectedColour.swatch || product.accent, 0),
    swatch(product.pattern, selectedColour.swatch || product.accent, 5),
    swatch('plain', selectedColour.swatch || product.accent, 2),
    swatch(product.pattern, selectedColour.swatch || product.accent, 9),
  ]

  /**
   * Catalogue photography merged with anything staff have uploaded. A renderer
   * proves the colour and the drape; only a photograph proves the stitching, so
   * where photos exist they earn their own tab.
   */
  const photos = photosFor(product)

  /** The swatches as lightbox items, so the fabric view zooms too. */
  const fabricItems = gallery.map((src, i) => ({
    src,
    alt: `${product.name} in ${selectedColour.label}, detail ${i + 1}`,
  }))

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
          {/* For anything that hangs at a window, seeing it hung beats seeing a
              flat swatch, so the room view is the default where it applies. */}
          {scene && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-full bg-shell p-1">
                {/* Photos only appears when there are some. A tab that opens
                    onto "no photos yet" is worse than no tab, and most of the
                    catalogue has none until the shoot happens. */}
                {([
                  { id: 'room' as const, label: sceneTabLabel[scene] },
                  ...(photos.length
                    ? [{ id: 'photos' as const, label: `Photos (${photos.length})` }]
                    : []),
                  { id: 'fabric' as const, label: 'Fabric' },
                ]).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={cx(
                      'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                      view === v.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {/* Only meaningful while the room is on screen. Offering a
                  renderer choice next to a flat swatch would be noise. */}
              {view === 'room' && showTierToggle && <TierToggle />}
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl bg-sand">
            {view === 'photos' ? (
              <div className="p-2">
                <PhotoGrid
                  photos={photos}
                  colourId={selectedColour.id}
                  label={`${product.name} photographs`}
                />
              </div>
            ) : scene && view === 'room' ? (
              <div className="aspect-4/5 w-full">
                <RoomView
                  colour={selectedColour.swatch || product.accent}
                  pattern={product.pattern}
                  scene={scene}
                  productSlug={product.slug}
                  variant={variant}
                  heading={heading}
                  finial={finial}
                  drawn={drawn}
                  night={night}
                  bedScale={bedScale}
                  sizeVariant={selectedSize?.id}
                  hardware={product.category === 'wrought-iron' ? selectedColour.swatch : '#2c2c2c'}
                />
              </div>
            ) : (
              <button
                onClick={() => setZoom(activeImage)}
                className="block w-full cursor-zoom-in"
                aria-label="Enlarge this swatch"
              >
                <img
                  src={gallery[activeImage]}
                  alt={`${product.name} in ${selectedColour.label}`}
                  className="aspect-4/5 w-full object-cover"
                />
              </button>
            )}

            {/*
              Only the saving stays on the image. The service badges said the
              same thing as the panel beside them and covered the very corner of
              the room the customer is trying to look at.
            */}
            {product.compareAt && (
              <div className="absolute top-4 left-4">
                <Badge tone="brand">Save {money(product.compareAt - product.price)}</Badge>
              </div>
            )}

            {/* Scene controls. Drawing them closed at night is the clearest way
                to show what a blockout lining actually buys you, so both
                controls belong to the curtain scene and nowhere else. */}
            {canDraw && view === 'room' && (
              <div className="absolute right-4 bottom-4 left-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setDrawn((d) => !d)}
                  className="rounded-full bg-white/92 px-3.5 py-2 text-[12px] font-medium shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  {drawn ? 'Open the curtains' : 'Close the curtains'}
                </button>
                <button
                  onClick={() => setNight((n) => !n)}
                  className="rounded-full bg-white/92 px-3.5 py-2 text-[12px] font-medium shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  {night ? 'Daytime' : 'See it at night'}
                </button>
              </div>
            )}
          </div>

          {view === 'photos' ? (
            <p className="mt-3 text-center text-[12px] text-muted">
              Photographs of the finished piece. Tap any one to see it full size.
            </p>
          ) : scene && view === 'room' ? (
            <p className="mt-3 text-center text-[12px] text-muted">
              Showing {selectedColour.label}
              {product.sizes && selectedSize ? `, ${selectedSize.label.toLowerCase()}` : ''}. Change
              the colour or style to update the room.
            </p>
          ) : (
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
          )}

          {zoom !== null && (
            <Lightbox
              items={fabricItems}
              index={zoom}
              onIndex={setZoom}
              onClose={() => setZoom(null)}
              label={`${product.name} fabric detail`}
            />
          )}
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
                    the Katani Road workshop
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

      {/* TABS. Specs, care and delivery terms, so the detail is there without
          burying the buy panel. */}
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

      <RecentlyViewed exclude={product.slug} />
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
