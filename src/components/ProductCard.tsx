import { Link } from 'react-router-dom'
import type { Product } from '../data/types'
import { swatch } from '../lib/swatch'
import { money } from '../lib/format'
import { Badge, Button, Stars, cx } from './ui'
import { useBasket } from '../store/basket'
import { COMPARE_LIMIT, useSaved } from '../store/saved'

/**
 * One card, two behaviours. A `buy` product shows a firm price and adds
 * straight to the cart; a `quote` product shows an honest "from" price and
 * routes into the quote basket. Neither ever shows a blank price, which is the
 * failure mode of the current site.
 */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, addToQuote } = useBasket()
  const { isSaved, toggleSaved, isComparing, toggleCompare, compare } = useSaved()
  const isQuote = product.mode === 'quote'
  const saved = isSaved(product.slug)
  const comparing = isComparing(product.slug)
  const compareFull = !comparing && compare.length >= COMPARE_LIMIT

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

      {/*
        Outside the <Link> and lifted above it. The title link below stretches
        an ::after pseudo-element across the whole card to make it clickable, so
        anything interactive has to clear that overlay or the card swallows the
        click.
      */}
      {/*
        Same shape, same row: a text pill stacked under the heart used to read
        as two different controls fighting for the corner. Both are now
        circular icon buttons side by side, so the corner reads as one group.
      */}
      <div className="absolute top-3 right-3 z-10 flex items-start gap-1.5">
        <button
          onClick={() => toggleSaved(product.slug)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          title={saved ? 'Remove from saved' : 'Save for later'}
          className={cx(
            'rounded-full bg-white/92 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white',
            saved ? 'text-brand' : 'text-ink/55 hover:text-brand',
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 20.5l-1.4-1.3C5.4 14.5 2 11.4 2 7.6 2 4.9 4.1 3 6.7 3c1.5 0 3 .7 3.9 1.9l1.4 1.8 1.4-1.8C14.3 3.7 15.8 3 17.3 3 19.9 3 22 4.9 22 7.6c0 3.8-3.4 6.9-8.6 11.6z" />
          </svg>
        </button>

        <button
          onClick={() => toggleCompare(product.slug)}
          disabled={compareFull}
          aria-pressed={comparing}
          aria-label={comparing ? `Remove ${product.name} from compare` : `Add ${product.name} to compare`}
          title={
            compareFull
              ? `Compare holds ${COMPARE_LIMIT} products`
              : comparing
                ? 'Remove from compare'
                : 'Add to compare'
          }
          className={cx(
            'rounded-full p-2 shadow-sm backdrop-blur transition-colors',
            comparing
              ? 'bg-ink text-white'
              : 'bg-white/92 text-ink/55 hover:bg-white hover:text-brand',
            compareFull && 'cursor-not-allowed opacity-45',
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12h11M14 12l-3.5-3.5M14 12l-3.5 3.5" />
            <path d="M21 12h-4M17 12l3.5-3.5M17 12l3.5 3.5" />
          </svg>
        </button>
      </div>

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
