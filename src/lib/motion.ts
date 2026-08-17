/**
 * The feel of the visualiser, in one place.
 *
 * These were tuned inside `RoomPreview` and are lifted out because a second
 * renderer is coming. A curtain that opens in 900ms in one tier and 600ms in
 * another reads as two different products rather than one product degrading
 * gracefully, so both renderers import these rather than keeping their own.
 */

/** Fabric moves at this speed. */
export const CURTAIN_MS = 900
/** Light changes slower than fabric moves, which is what makes it read as light. */
export const LIGHT_MS = 1400
/** Physical, not linear: eased at both ends, quick through the middle. */
export const CURTAIN_EASE = 'inOut(2.2)'
export const LIGHT_EASE = 'inOutQuad'

/**
 * How far a panel gathers when it is drawn back.
 *
 * In the SVG tier this is a `scaleX` factor. In a 3D tier it becomes the
 * compression of the gathered morph target. Same number either way, so the two
 * open to the same silhouette and swapping tiers mid-session is invisible.
 */
export const GATHERED = 0.36

export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
