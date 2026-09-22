import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { savingOf } from '../data/catalogue'
import type { Product } from '../data/types'
import { heroImageFor } from '../lib/productImage'
import { money } from '../lib/format'
import { Badge, Button, Stars, cx } from './ui'
import { Photo } from './Photo'
import { useBasket } from '../store/basket'
import { usePhotos } from '../store/photos'
import { COMPARE_LIMIT, useSaved } from '../store/saved'

/**
 * One card, two behaviours. A `buy` product shows a firm price and adds
 * straight to the cart; a `quote` product shows an honest "from" price and
 * routes into the quote basket. Neither ever shows a blank price, which is the
 * failure mode of the current site.
 *
 * This is the most-rendered component in the app: the shop grid, best sellers,
 * search, wishlist, compare and recently-viewed all come through here. It is
 * therefore the one place where switching from a generated swatch to a real
 * photograph changes how the whole site reads.
 */
export function ProductCard({
  product,
  index = 0,
  sizes = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 92vw',
}: {
  product: Product
  index?: number
  /** The slot this card occupies, so the browser downloads the right width. */
  sizes?: string
}) {
  const { addToCart, addToQuote } = useBasket()
  const { photosFor } = usePhotos()
  const { isSaved, toggleSaved, isComparing, toggleCompare, compare } = useSaved()

  const isQuote = product.mode === 'quote'
  const saved = isSaved(product.slug)
  const comparing = isComparing(product.slug)
  const compareFull = !comparing && compare.length >= COMPARE_LIMIT

  const uploads = photosFor(product)

  /*
   * One photograph per card, and it moves on hover rather than being replaced.
   *
   * There was a cross-fade to a second shot. It went for two reasons: a second
   * <img> inside a card already on screen is in the viewport too, so
   * `loading="lazy"` does nothing and every grid pulled twice the photography
   * it showed; and on a phone, which is most of this audience, there is no
   * hover to reveal it with, so the cost was being paid for an effect half the
   * traffic could never see. The slow zoom below gives the same feeling of the
   * card being alive under the cursor for one composited transform and no
   * extra bytes.
   */
  const hero = heroImageFor(product, uploads, index)

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

  const saving = savingOf(product)

  return (
    <article
      /*
       * The card's place in the cascade, wrapped every eighth rather than
       * clamped there.
       *
       * Clamping looked equivalent and was not: callers offset `index` to vary
       * the procedural fallback - `Home` passes `i + 8` for its second grid and
       * `ProductPage` passes `i + 3` - so every card in those grids clamped to
       * the same 7 and the cascade collapsed into one block. Wrapping keeps the
       * offset harmless, and a ninth card arriving with the first is invisible
       * because they are rows apart by then.
       *
       * Cast through `CSSProperties` because a custom property is not in
       * React's style type.
       */
      style={{ '--i': index % 8 } as CSSProperties}
      className={cx(
        'group animate-rise-stagger relative flex flex-col overflow-hidden rounded-card border border-line bg-white',
        /* Lift, shadow and border on hover, shared with the category and room
           tiles so the whole homepage responds the same way. */
        'card-lift',
      )}
    >
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden bg-sand"
        aria-label={product.name}
      >
        <Photo
          name={hero.name}
          src={hero.src}
          alt={hero.alt}
          aspect={4 / 5}
          sizes={sizes}
          className="w-full"
          imgClassName="card-zoom"
        />

        {/* Depth on hover. Without it the zoom reads as the image simply
            getting bigger; with it the card looks lit. */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/*
          Only the discount stays on the photograph. Everything else moved into
          the body below: a stack of pills over a product shot is the thing that
          made the old grid read as a template rather than a shop.
        */}
        {saving > 0 && (
          <span className="absolute top-3 left-3">
            <Badge tone="brand">Save {money(saving)}</Badge>
          </span>
        )}
      </Link>

      {/*
        Outside the <Link> and lifted above it. The title link below stretches
        an ::after pseudo-element across the whole card to make it clickable, so
        anything interactive has to clear that overlay or the card swallows the
        click. Same shape, same row: both are circular icon buttons side by
        side, so the corner reads as one group.
      */}
      <div className="absolute top-3 right-3 z-10 flex items-start gap-1.5">
        <button
          onClick={() => toggleSaved(product.slug)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          title={saved ? 'Remove from saved' : 'Save for later'}
          className={cx(
            'rounded-full bg-white/92 p-2 shadow-raise backdrop-blur transition-colors hover:bg-white',
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
            'rounded-full p-2 shadow-raise backdrop-blur transition-colors',
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

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center gap-2">
          {isQuote ? (
            <span className="eyebrow text-brass-deep">Made to measure</span>
          ) : product.leadTimeDays === 0 ? (
            <span className="eyebrow text-ok-ink">In stock</span>
          ) : (
            <span className="eyebrow text-muted-foreground">{product.leadTimeDays} day lead time</span>
          )}
        </div>

        <h3 className="mb-2 font-display text-[17px] leading-snug font-semibold text-ink transition-colors duration-200 group-hover:text-brand">
          <Link to={`/product/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>

        <p className="mb-3.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{product.summary}</p>

        <div className="mb-3.5">
          <Stars rating={product.rating} count={product.reviewCount} />
        </div>

        {/* Colour swatches double as a signal that the product is real and configurable. */}
        <div className="mb-5 flex items-center gap-1.5">
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
            <span className="font-ui text-[11px] text-muted-foreground">+{product.colours.length - 5}</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div className="font-ui">
            {isQuote && <span className="block text-[11px] text-muted-foreground">From</span>}
            <span className="text-lg font-semibold text-ink tabular">{money(product.price)}</span>
            {saving > 0 && (
              <span className="ml-2 text-sm text-muted-foreground line-through tabular">
                {money(product.compareAt!)}
              </span>
            )}
            <span className="block text-[11px] text-muted-foreground">{product.unit}</span>
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
