import type { PatternKind } from '../data/types'

/**
 * Procedural textile swatches.
 *
 * The prototype ships without the client's photography, so every product image
 * is generated as an SVG data URI keyed on the product's pattern and accent
 * colour. This keeps the layout honest about real image proportions and colour
 * weight, and each of these is a one-for-one drop-in slot for a real photo.
 */

const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const r = clamp(((n >> 16) & 255) + amount)
  const g = clamp(((n >> 8) & 255) + amount)
  const b = clamp((n & 255) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const readable = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#17181a' : '#ffffff'
}

/**
 * The tile size, in user units, of each pattern below.
 *
 * Lives here rather than beside its consumer because it is not a choice, it is a
 * fact about `patternDefs` — change a `<pattern>`'s width and this must change
 * with it, in the same edit. The 3D renderer needs it to rasterise a whole
 * number of tiles into a square texture; a texture holding 6.4 tiles has a hard
 * seam down two of its edges.
 *
 * `plain` is a gradient rather than a pattern, so it has no tile and answers
 * with the full span. It is the reason the 3D maps wrap mirrored.
 */
export const patternTile = (kind: PatternKind): number => {
  switch (kind) {
    case 'weave':
      return 8
    case 'sheer':
      return 10
    case 'stripe':
      return 24
    case 'ceramic':
      return 40
    case 'geometric':
      return 48
    case 'embroidery':
      return 56
    case 'damask':
      return 64
    case 'iron':
      return 72
    default:
      return 0
  }
}

/**
 * The pattern definitions, as raw SVG markup for a `<defs>` block.
 *
 * Exported because two consumers need the identical fabric: `swatch()` bakes it
 * into a data URI for the product gallery, and `RoomPreview` drops it straight
 * into a live scene so the curtain on the window is the same cloth as the
 * swatch. Keeping one definition is what stops the two drifting apart.
 */
export const patternDefs = (kind: PatternKind, rawBase: string, rawId = 'p'): string => {
  // These strings are interpolated into markup, so both are constrained to a
  // safe shape here rather than trusted. Today they come from our own
  // catalogue; tomorrow the colour could arrive from the API.
  const base = /^#[0-9a-fA-F]{6}$/.test(rawBase) ? rawBase : '#888888'
  const id = rawId.replace(/[^A-Za-z0-9_-]/g, '')
  const light = shade(base, 26)
  const dark = shade(base, -26)
  const ink = readable(base)

  switch (kind) {
    case 'weave':
      return `
        <pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="${base}"/>
          <rect width="4" height="4" fill="${light}"/>
          <rect x="4" y="4" width="4" height="4" fill="${dark}"/>
        </pattern>`
    case 'embroidery':
      return `
        <pattern id="${id}" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="56" height="56" fill="${base}"/>
          <g stroke="${ink}" stroke-opacity="0.5" fill="none" stroke-width="1.6">
            <circle cx="28" cy="28" r="13"/>
            <path d="M28 8 L34 22 L48 28 L34 34 L28 48 L22 34 L8 28 L22 22 Z"/>
          </g>
        </pattern>`
    case 'geometric':
      return `
        <pattern id="${id}" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill="${base}"/>
          <path d="M0 24 L24 0 L48 24 L24 48 Z" fill="${light}"/>
          <path d="M12 24 L24 12 L36 24 L24 36 Z" fill="${dark}"/>
        </pattern>`
    case 'damask':
      return `
        <pattern id="${id}" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="${base}"/>
          <g fill="${light}">
            <path d="M32 6 C44 18 44 28 32 34 C20 28 20 18 32 6 Z"/>
            <path d="M32 58 C20 46 20 36 32 30 C44 36 44 46 32 58 Z"/>
          </g>
          <circle cx="4" cy="32" r="3" fill="${dark}"/>
          <circle cx="60" cy="32" r="3" fill="${dark}"/>
        </pattern>`
    case 'stripe':
      return `
        <pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="${base}"/>
          <rect width="9" height="24" fill="${light}"/>
          <rect x="16" width="3" height="24" fill="${dark}"/>
        </pattern>`
    case 'sheer':
      return `
        <pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="${base}"/>
          <path d="M0 0 H10 M0 5 H10" stroke="${light}" stroke-width="1"/>
          <path d="M0 0 V10 M5 0 V10" stroke="${dark}" stroke-opacity="0.35" stroke-width="0.8"/>
        </pattern>`
    case 'iron':
      return `
        <pattern id="${id}" width="72" height="72" patternUnits="userSpaceOnUse">
          <rect width="72" height="72" fill="${base}"/>
          <g stroke="${light}" fill="none" stroke-width="3" stroke-linecap="round">
            <path d="M36 4 V68"/>
            <path d="M36 20 C18 26 18 44 36 50"/>
            <path d="M36 20 C54 26 54 44 36 50"/>
          </g>
        </pattern>`
    case 'ceramic':
      return `
        <pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="${base}"/>
          <circle cx="20" cy="20" r="14" fill="${light}"/>
          <circle cx="20" cy="20" r="6" fill="${dark}" fill-opacity="0.4"/>
        </pattern>`
    default:
      return `
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${light}"/>
          <stop offset="1" stop-color="${dark}"/>
        </linearGradient>`
  }
}

/**
 * Build a swatch as an inline data URI.
 * @param seed shifts the fold highlights so sibling images do not look cloned.
 */
export const swatch = (kind: PatternKind, accent: string, seed = 0): string => {
  const folds = Array.from({ length: 5 }, (_, i) => {
    const x = 40 + i * 96 + ((seed * 17) % 40)
    return `<rect x="${x}" y="0" width="26" height="600" fill="#000" opacity="${
      i % 2 === 0 ? 0.07 : 0.03
    }"/>`
  }).join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600" preserveAspectRatio="xMidYMid slice">
    <defs>${patternDefs(kind, accent)}</defs>
    <rect width="480" height="600" fill="url(#p)"/>
    ${folds}
    <rect width="480" height="600" fill="url(#g)"/>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
        <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.14"/>
      </linearGradient>
    </defs>
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * One repeat of a pattern, as a CSS-ready `url(...)`.
 *
 * `swatch()` bakes a whole product image; this bakes only the tile, so a plain
 * element can wear the fabric as a repeating background at a fixed pixel size.
 * `CurtainCloth` uses it: a background image is rasterised once into a
 * composited layer, where a live `<pattern>` fill is re-tiled every time the
 * element it fills changes shape.
 *
 * Still the same `patternDefs`, so this is the cloth we actually sell.
 */
export const clothTile = (kind: PatternKind, accent: string): string => {
  const size = patternTile(kind) || 64
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${patternDefs(kind, accent, 'p')}</defs>
    <rect width="${size}" height="${size}" fill="url(#p)"/>
  </svg>`

  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}
