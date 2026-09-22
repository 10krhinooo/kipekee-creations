import type { Product, ProductPhoto } from '../data/types'
import { photoSets, photoSetsBySlug } from '../data/photoSets'
import { swatch } from './swatch'

/**
 * Which image a product shows, and where it comes from.
 *
 * Three sources feed one list, and no consumer should ever branch on which:
 *
 * 1. Photography from `scripts/photos/manifest.json`, described by the
 *    generated `src/data/photoSets.ts`. Responsive, self-hosted, the default.
 * 2. Photos staff uploaded at `/admin/products/:slug/photos`, which live in
 *    IndexedDB as object URLs and cannot be pre-rendered.
 * 3. A procedural swatch from `lib/swatch.ts`, for a product with neither.
 *
 * The rule the whole redesign turns on: a shopper sees a photograph wherever
 * one exists. `swatch()` proves a colourway and a drape, which is exactly what
 * the Fabric tab and the colour chips need it for, and exactly what a shop grid
 * does not. Nobody buys curtains from a generated pattern.
 */

export interface ProductImage {
  /** A key in the generated photo set. Renders as a responsive `<picture>`. */
  name?: string
  /** A single URL: an upload object URL, or a swatch data URI. */
  src?: string
  alt: string
  colourId?: string
  caption?: string
  /** Landscape shots take a two-column cell so the grid does not letterbox them. */
  wide?: boolean
  /** Width over height. Only set for `src` images, which carry no dimensions. */
  aspect?: number
}

/**
 * The nine `PHOTOGRAPH PENDING` placeholders that shipped with the prototype.
 * Any catalogue `photos` entry still pointing at one is dropped rather than
 * shown, so a half-migrated catalogue never puts a grey "photograph pending"
 * card in front of a customer.
 */
const isPlaceholder = (src: string) => /^\/photos\/[^/]+\.svg$/.test(src)

/** Photography we ship, for this product, in manifest order. */
export function cataloguePhotos(product: Product): ProductImage[] {
  return (photoSetsBySlug[product.slug] ?? []).map((set) => ({
    name: set.key,
    alt: set.alt,
    wide: set.role === 'wide',
  }))
}

/**
 * The full gallery: shipped photography, then anything still listed on the
 * catalogue entry that is not a placeholder, then staff uploads.
 *
 * `uploads` comes from `usePhotos().photosFor(product)`, which already merges
 * the catalogue list in. Passing it here rather than calling the hook keeps
 * this module pure, so `ProductCard` can call it inside a grid without
 * subscribing every card to the photo provider.
 */
export function galleryFor(product: Product, uploads: ProductPhoto[] = []): ProductImage[] {
  const shipped = cataloguePhotos(product)

  const rest = uploads
    .filter((p) => !isPlaceholder(p.src))
    .map<ProductImage>((p) => ({
      src: p.src,
      alt: p.alt,
      colourId: p.colourId,
      caption: p.caption,
      wide: p.wide,
      aspect: p.wide ? 16 / 10 : 4 / 5,
    }))

  return [...shipped, ...rest]
}

/** True when this product has any real photograph, shipped or uploaded. */
export function hasPhotography(product: Product, uploads: ProductPhoto[] = []): boolean {
  return galleryFor(product, uploads).length > 0
}

/**
 * The single image that represents a product in a grid, a search result, a
 * basket line or a compare column. Never null: a product without photography
 * falls back to its swatch rather than to an empty box.
 */
export function heroImageFor(
  product: Product,
  uploads: ProductPhoto[] = [],
  index = 0,
  colourId?: string,
): ProductImage {
  const gallery = galleryFor(product, uploads)

  // A chosen colourway surfaces its own photograph when one is tagged for it.
  const preferred = colourId ? gallery.find((p) => p.colourId === colourId) : undefined
  const first = preferred ?? gallery.find((p) => !p.wide) ?? gallery[0]
  if (first) return first

  const colour = product.colours.find((c) => c.id === colourId) ?? product.colours[0]
  return {
    src: swatch(product.pattern, colour?.swatch || product.accent, index),
    alt: `${product.name} in ${colour?.label ?? 'the house colourway'}`,
    aspect: 4 / 5,
  }
}

/**
 * A plain URL for an image, at its largest committed width.
 *
 * `Photo` should be used wherever a `<picture>` can be, because it picks a
 * width for the slot. This is for the places that genuinely need one string:
 * the lightbox, which is already showing the image as large as the screen
 * allows, and anything handing a URL to the platform rather than the layout.
 */
export function fullSizeSrc(image: ProductImage): string {
  if (image.src) return image.src
  const set = image.name ? photoSets[image.name] : undefined
  return set ? `/photos/${set.key}-${set.widths.at(-1)}.jpg` : ''
}

/** A page image by manifest key, for heroes, room tiles and editorial slots. */
export function pageImage(key: string): ProductImage | undefined {
  const set = photoSets[key]
  return set ? { name: set.key, alt: set.alt } : undefined
}
