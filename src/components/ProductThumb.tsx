import type { Product } from '../data/types'
import { heroImageFor } from '../lib/productImage'
import { usePhotos } from '../store/photos'
import { Photo } from './Photo'

/**
 * A product at small fixed size: a search result, a basket line, a compare
 * chip, an order-summary row, a recently-viewed tile.
 *
 * Eight surfaces were each building this out of a raw `<img>` and a call to
 * `swatch()`, which is why a photo-first catalogue still looked like a
 * prototype everywhere except the shop grid. One component instead, so the
 * fallback order, the responsive sources and the colourway rule are decided
 * once.
 *
 * The box is set by the caller's `className` (`h-20 w-16` and so on) rather
 * than by an aspect ratio. A thumbnail lives inside a row whose height is
 * already fixed by its neighbours, so it has to crop to fit rather than ask
 * for a shape.
 */
export function ProductThumb({
  product,
  colourId,
  index = 0,
  className,
  sizes = '80px',
  rounded = 'rounded-lg',
  alt = '',
}: {
  product: Product
  /** The chosen colourway, so a basket line shows the shade that was added. */
  colourId?: string
  /** Varies the procedural fallback, so a grid of them is not one flat block. */
  index?: number
  className?: string
  sizes?: string
  rounded?: string
  /**
   * Empty by default. Every one of these sits beside the product's name in the
   * same row or tile, so describing the picture as well just makes a screen
   * reader say the product twice.
   */
  alt?: string
}) {
  const { photosFor } = usePhotos()
  const image = heroImageFor(product, photosFor(product), index, colourId)

  return (
    <Photo
      name={image.name}
      src={image.src}
      alt={alt}
      sizes={sizes}
      tint={product.accent}
      className={`shrink-0 ${rounded} ${className ?? ''}`}
    />
  )
}
