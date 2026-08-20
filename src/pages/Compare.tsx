import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCatalogue } from '../store/catalogue'
import type { Product } from '../data/types'
import { leadTime, money } from '../lib/format'
import { swatch } from '../lib/swatch'
import { COMPARE_LIMIT, useSaved } from '../store/saved'
import { Button, Container, SectionHeading, Stars, cx } from '../components/ui'

/**
 * Side-by-side comparison, driven entirely by `?slugs=a,b,c`.
 *
 * The URL is the state, matching the shop's faceted filters, so a comparison is
 * something a customer can send on WhatsApp or a hotel buyer can forward to
 * whoever signs off. Reading it back from the query string rather than from the
 * saved store is what makes a pasted link work for someone who has never
 * visited before.
 */
export function Compare() {
  const { bySlug, categoryBySlug } = useCatalogue()
  const [params, setParams] = useSearchParams()
  const { compare, toggleCompare } = useSaved()

  const slugs = useMemo(
    () =>
      (params.get('slugs') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, COMPARE_LIMIT),
    [params],
  )

  const items = slugs.map((slug) => bySlug(slug)).filter((p) => p !== undefined)

  const remove = (slug: string) => {
    const next = items.filter((p) => p.slug !== slug).map((p) => p.slug)
    // Keep the selection and the URL in step, so the sticky bar does not go on
    // advertising a product this page has just dropped.
    if (compare.includes(slug)) toggleCompare(slug)
    setParams(next.length ? { slugs: next.join(',') } : {}, { replace: true })
  }

  if (items.length === 0) {
    return (
      <Container className="py-10">
        <SectionHeading eyebrow="Compare" title="Nothing to compare yet" />
        <div className="rounded-2xl border border-line bg-shell px-6 py-16 text-center">
          <p className="mx-auto mb-6 max-w-md text-[14px] leading-relaxed text-muted">
            Pick up to {COMPARE_LIMIT} products in the shop and they line up here on price, fabric,
            lead time and every specification either of them lists.
          </p>
          <Button to="/shop">Browse the shop</Button>
        </div>
      </Container>
    )
  }

  /**
   * Specifications are per-product free text, so the row set is their union.
   * A product that does not list a row shows an em dash rather than shifting
   * every column below it out of alignment.
   */
  const specLabels: string[] = []
  items.forEach((p) => p.specs.forEach((s) => {
    if (!specLabels.includes(s.label)) specLabels.push(s.label)
  }))

  const specValue = (p: Product, label: string) =>
    p.specs.find((s) => s.label === label)?.value ?? '—'

  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="Compare"
        title={`${items.length} products side by side`}
        intro="This page is its own link. Copy the address to send the comparison to somebody else."
      />

      {/* One scroll container, so the table can be wider than the phone without
          the page itself scrolling sideways. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-36 bg-white p-2 align-bottom" />
              {items.map((p, i) => (
                <th key={p.slug} className="w-56 p-2 align-bottom">
                  <Link to={`/product/${p.slug}`} className="block">
                    <img
                      src={swatch(p.pattern, p.colours[0].swatch || p.accent, i)}
                      alt=""
                      className="aspect-4/5 w-full rounded-xl object-cover"
                    />
                    <span className="mt-2 block font-display text-[14px] leading-snug font-semibold text-ink">
                      {p.name}
                    </span>
                  </Link>
                  <button
                    onClick={() => remove(p.slug)}
                    className="mt-1 text-[12px] text-muted underline hover:text-brand"
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <Row label="Price" items={items}>
              {(p) => (
                <span className="font-display text-lg font-semibold text-ink">
                  {p.mode === 'quote' && <span className="text-[11px] font-normal text-muted">from </span>}
                  {money(p.price)}
                  <span className="block text-[11px] font-normal text-muted">{p.unit}</span>
                </span>
              )}
            </Row>
            <Row label="Sold as" items={items}>
              {(p) => (
                <span
                  className={cx(
                    'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                    p.mode === 'buy'
                      ? 'border-[#bde2c9] bg-[#e8f5ec] text-[#1a6b39]'
                      : 'border-ink bg-ink text-white',
                  )}
                >
                  {p.mode === 'buy' ? 'Buy now' : 'Made to measure'}
                </span>
              )}
            </Row>
            <Row label="Category" items={items}>
              {(p) => categoryBySlug(p.category)?.name ?? p.category}
            </Row>
            <Row label="Fabric" items={items}>
              {(p) => <span className="capitalize">{p.pattern}</span>}
            </Row>
            <Row label="Rooms" items={items}>{(p) => p.rooms.join(', ')}</Row>
            <Row label="Colours" items={items}>
              {(p) => (
                <span className="flex flex-wrap items-center gap-1.5">
                  {p.colours.map((c) => (
                    <span
                      key={c.id}
                      title={c.label}
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ background: c.swatch }}
                    />
                  ))}
                </span>
              )}
            </Row>
            <Row label="Lead time" items={items}>{(p) => leadTime(p.leadTimeDays)}</Row>
            <Row label="Availability" items={items}>
              {(p) => (p.mode === 'quote' ? 'Made to order' : p.stock > 0 ? `${p.stock} in stock` : 'Out of stock')}
            </Row>
            <Row label="Rating" items={items}>
              {(p) => <Stars rating={p.rating} count={p.reviewCount} />}
            </Row>

            {specLabels.map((label) => (
              <Row key={label} label={label} items={items}>
                {(p) => specValue(p, label)}
              </Row>
            ))}

            <tr>
              <th className="sticky left-0 z-10 bg-white p-3" />
              {items.map((p) => (
                <td key={p.slug} className="border-t border-line p-3">
                  <Button size="sm" variant={p.mode === 'quote' ? 'outline' : 'primary'} to={`/product/${p.slug}`}>
                    {p.mode === 'quote' ? 'Get a quote' : 'View product'}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Container>
  )
}

function Row({
  label,
  items,
  children,
}: {
  label: string
  items: Product[]
  children: (product: Product) => React.ReactNode
}) {
  return (
    <tr className="align-top">
      <th
        scope="row"
        className="sticky left-0 z-10 border-t border-line bg-white p-3 text-[12px] font-semibold tracking-wide text-muted uppercase"
      >
        {label}
      </th>
      {items.map((p) => (
        <td key={p.slug} className="border-t border-line p-3 text-[13px] text-ink-soft">
          {children(p)}
        </td>
      ))}
    </tr>
  )
}
