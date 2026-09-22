import { useCallback, useState } from 'react'
import { PHOTO_FORMATS, photoSets } from '../data/photoSets'
import { cx } from './ui'

/**
 * The one image component.
 *
 * Every photograph in the app goes through here so that four things are true
 * everywhere rather than in the places somebody remembered: the space is
 * reserved before the bytes arrive, the browser is offered AVIF before JPEG,
 * the file it downloads is sized for the slot it lands in, and a slow
 * connection sees the product's own colour instead of a grey hole.
 *
 * Two modes:
 *
 * - `name` is a key in `src/data/photoSets.ts`, the module `npm run
 *   photos:fetch` generates. It produces a full `<picture>` with a srcset per
 *   format. This is the path every catalogue photograph takes.
 * - `src` is a single URL, for the two cases that cannot be pre-rendered: an
 *   object URL for a staff upload held in IndexedDB, and a procedural swatch
 *   data URI for a product whose photography has not landed yet.
 *
 * Passing neither renders the tint alone, which is what an empty slot should
 * look like rather than a broken-image glyph.
 */

export interface PhotoProps {
  /** A key in the generated photo set. Mutually exclusive with `src`. */
  name?: string
  /** A single URL: an upload object URL, or a swatch data URI. */
  src?: string
  alt?: string
  /**
   * The `sizes` attribute. Get this right or the browser downloads the 1600px
   * file for a 240px card. Every caller passes one; the default assumes the
   * image is full width, which is only true of the hero.
   */
  sizes?: string
  /**
   * Width over height. Defaults to the value baked into the photo set, and is
   * required when using `src`, since a raw URL carries no dimensions.
   */
  aspect?: number
  /** Background shown until the image decodes. Defaults to the set's tint. */
  tint?: string
  /**
   * Above the fold. Switches off lazy loading and asks the browser to fetch it
   * at high priority. Exactly one image per page should set this: the hero.
   */
  priority?: boolean
  /**
   * Drop the aspect-ratio box and fill the positioned parent instead. For a
   * full-bleed hero, where the section's own height is the crop and an
   * intrinsic ratio would fight it.
   */
  fill?: boolean
  className?: string
  /** Classes for the `<img>` itself, for hover transforms and object-position. */
  imgClassName?: string
  /**
   * Suppress the fade-in. For an image that is already inside something else
   * that animates on entry, where two overlapping opacity animations read as a
   * stutter rather than as one movement.
   */
  noFade?: boolean
}

const srcSetFor = (key: string, widths: number[], format: string) =>
  widths.map((w) => `/photos/${key}-${w}.${format} ${w}w`).join(', ')

export function Photo({
  name,
  src,
  alt,
  sizes = '100vw',
  aspect,
  tint,
  priority = false,
  fill = false,
  className,
  imgClassName,
  noFade = false,
}: PhotoProps) {
  /*
   * Whether to fade, which is not the same question as whether it has loaded.
   *
   * Three states, and only one of them animates:
   *
   * - `pending`: nothing on screen yet. The tint holds the space.
   * - `arrived`: the bytes came in while we were watching, so the fade covers
   *   the switch from tint to photograph.
   * - `instant`: the image was already `complete` when the element mounted,
   *   which means it came from cache. There was no gap to cover, so fading it
   *   is 450ms of the page looking slower than it is. This is most navigations
   *   after the first, and most of a scroll back up a grid.
   *
   * The `complete` check has to happen in a ref callback rather than an effect:
   * a cached image can finish decoding before React attaches `onLoad`, and
   * without this it would sit at the animation's `both` fill forever.
   */
  const [state, setState] = useState<'pending' | 'arrived' | 'instant'>('pending')
  const onMount = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete) setState((s) => (s === 'pending' ? 'instant' : s))
  }, [])
  const set = name ? photoSets[name] : undefined

  // A `name` with no entry means the manifest and the code have drifted. Fail
  // visibly in development and quietly in production rather than rendering a
  // broken image either way.
  if (name && !set && import.meta.env.DEV) {
    console.warn(`[Photo] no entry for "${name}" in photoSets. Run: npm run photos:fetch`)
  }

  const ratio = aspect ?? set?.aspect ?? 4 / 5
  const background = tint ?? set?.tint ?? 'var(--color-sand)'
  const label = alt ?? set?.alt ?? ''
  const url = src ?? (set ? `/photos/${set.key}-${set.widths.at(-1)}.jpg` : undefined)

  return (
    <span
      className={cx(fill ? 'block overflow-hidden' : 'relative block overflow-hidden', className)}
      style={fill ? { background } : { aspectRatio: String(ratio), background }}
    >
      {url && (
        <picture>
          {set &&
            // JPEG is deliberately skipped here: it is the <img> below, which
            // every browser reaching this point can already read. A <source>
            // for it would only ever match after the two that matter.
            PHOTO_FORMATS.filter((format) => format !== 'jpg').map((format) => (
              <source
                key={format}
                type={`image/${format}`}
                srcSet={srcSetFor(set.key, set.widths, format)}
                sizes={sizes}
              />
            ))}
          <img
            ref={onMount}
            src={url}
            // The JPEG tier needs its own srcset. The <source> elements above
            // only cover the browsers that take AVIF or WebP; anything else
            // falls through to this <img>, and without these two attributes it
            // would download the 1600px file into a 240px card.
            {...(set
              ? { srcSet: srcSetFor(set.key, set.widths, 'jpg'), sizes }
              : null)}
            alt={label}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            // `fetchpriority` is not in React's prop types for every version in
            // the wild, but the DOM takes it and it is what moves the hero
            // image ahead of the font requests.
            {...(priority ? { fetchPriority: 'high' as const } : null)}
            onLoad={() => setState((s) => (s === 'pending' ? 'arrived' : s))}
            className={cx(
              'h-full w-full object-cover',
              // Attached only once the image is there, so the animation's
              // opening frame is the photograph rather than an empty box.
              !noFade && state === 'arrived' && 'animate-photo-in',
              imgClassName,
            )}
            onError={(e) => {
              // A missing file should degrade to the tint, not to a browser
              // glyph with the alt text spilling out of the box.
              e.currentTarget.style.display = 'none'
            }}
          />
        </picture>
      )}
    </span>
  )
}

/**
 * Credit line for a photograph, for the places the licence asks us to show one.
 * Returns null for uploads and swatches, which have nobody to credit.
 */
export function photoCredit(name: string | undefined) {
  const set = name ? photoSets[name] : undefined
  if (!set?.credit) return null
  return { name: set.credit, url: set.creditUrl }
}
