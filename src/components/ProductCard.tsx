import { Link } from 'react-router-dom'
import type { Product } from '../data/types'
import { swatch } from '../lib/swatch'
import { money } from '../lib/format'
import { Badge, Button, Stars, cx } from './ui'
import { useBasket } from '../store/basket'

/**
 * One card, two behaviours. A `buy` product shows a firm price and adds
 * straight to the cart; a `quote` product shows an honest "from" price and
 * routes into the quote basket. Neither ever shows a blank price, which is the
 * failure mode of the current site.
 */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, addToQuote } = useBasket()
  const isQuote = product.mode === 'quote'

  const quickAdd = () => {
    if (isQuote) {
      addToQuote({
        slug: product.slug,
        colour: product.colours[0].id,
        room: product.rooms[0],
        windows: 1,
      })
    } else {
      addToCart({
        slug: product.slug,
        qty: 1,
        colour: product.colours[0].id,
        size: product.sizes?.[0].id,
      })
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(23,24,26,0.45)]">
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-4/5 overflow-hidden bg-sand"
        aria-label={product.name}
      >
        <img
          src={swatch(product.pattern, product.colours[0].swatch || product.accent, index)}
          alt={`${product.name} in ${product.colours[0].label}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.compareAt && (
            <Badge tone="brand">Save {money(product.compareAt - product.price)}</Badge>
          )}
          {isQuote ? <Badge tone="quote">Made to measure</Badge> : null}
          {!isQuote && product.leadTimeDays === 0 && <Badge tone="stock">In stock</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-display text-[15px] leading-snug font-semibold text-ink">
            <Link to={`/product/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">
              {product.name}
            </Link>
          </h3>
        </div>

        <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{product.summary}</p>

        <div className="mb-3 flex items-center gap-2">
          <Stars rating={product.rating} count={product.reviewCount} />
        </div>

        {/* Colour swatches double as a signal that the product is real and configurable. */}
        <div className="mb-4 flex items-center gap-1.5">
          {product.colours.slice(0, 5).map((c) => (
            <span
              key={c.id}
              title={c.label}
              className={cx(
                'h-4 w-4 rounded-full border border-black/10',
                !c.inStock && 'opacity-35',
              )}
              style={{ background: c.swatch }}
            />
          ))}
          {product.colours.length > 5 && (
            <span className="text-[11px] text-muted">+{product.colours.length - 5}</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            {isQuote && <span className="block text-[11px] text-muted">From</span>}
            <span className="font-display text-lg font-semibold text-ink">{money(product.price)}</span>
            {product.compareAt && (
              <span className="ml-2 text-sm text-muted line-through">{money(product.compareAt)}</span>
            )}
            <span className="block text-[11px] text-muted">{product.unit}</span>
          </div>

          <Button
            size="sm"
            variant={isQuote ? 'outline' : 'primary'}
            onClick={quickAdd}
            className="relative z-10"
          >
            {isQuote ? 'Get a quote' : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  )
}
