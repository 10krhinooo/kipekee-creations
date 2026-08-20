import type { CSSProperties } from 'react'
import { clothTile } from '../lib/swatch'

/**
 * The cloth, as a component.
 *
 * Two very different things draw curtains now - the staff auth screens and the
 * transition between pages - and they have to be the same cloth, for the same
 * reason `patternDefs` is shared between the gallery swatch and the room
 * visualiser: two curtains that do not match read as two products.
 *
 * This component owns only the shape. It never animates anything. Callers seed
 * and tween `[data-curtain]` and `[data-glow]` themselves, because the auth
 * screen and the page transition want very different timings out of the same
 * geometry.
 *
 * Why HTML and CSS rather than one stretched SVG, which is what this was:
 *
 * 1. Cost. `scaleX` on an SVG `<g>` is geometry, so every frame of a transition
 *    re-recorded and re-rasterised a pattern-filled, gradient-overlaid half of
 *    the viewport, twice. Traced over one page change that was 1141 raster
 *    tasks and 605ms of raster work, against 31 tasks and 8ms for the same
 *    navigation with the curtain switched off. Each panel is now a promoted
 *    layer (`will-change: transform`) holding a bitmap the compositor scales,
 *    so the same transition rasters about as much as no transition at all.
 * 2. Shape. The old SVG stretched a 1000x620 viewBox over whatever the viewport
 *    was, so on a phone the damask was squashed to 39% of its width and pulled
 *    to 136% of its height, and the rail's rings flattened into smudges. Fixed
 *    pixel tiles keep the weave square and the rings round at every size, which
 *    is also what lets the rail stay on below `sm` - and that matters, because
 *    the transition and the auth staging have to agree about whether a rail is
 *    there or the handoff between them flickers.
 */

/** Panels overlap at the centre so the closed pair meets with no seam. */
const PANEL_W = 'calc(50% + 8px)'

/** Apparent size of one damask repeat. Matches what the SVG showed on a laptop. */
const TILE = '92px'

const CLOTH = clothTile('damask', '#4d0d0f')

/**
 * Folds, as soft troughs and crests rather than the hard black bars this used
 * to draw. Cloth has no edges in it, and those flat stripes were the main
 * reason the old panel read as a printed sheet. Two pitches alternate so the
 * drop does not look mechanically repeated.
 */
const FOLDS = `repeating-linear-gradient(90deg,
  rgba(0,0,0,0.34) 0px,
  rgba(0,0,0,0.04) 22px,
  rgba(255,255,255,0.06) 38px,
  rgba(0,0,0,0.04) 54px,
  rgba(0,0,0,0.28) 74px,
  rgba(0,0,0,0.03) 92px,
  rgba(255,255,255,0.04) 105px,
  rgba(0,0,0,0.03) 118px,
  rgba(0,0,0,0.34) 146px)`

/** Top and hem fall into shadow, which is what gives the drop its depth. */
const SHADE = `linear-gradient(180deg,
  rgba(0,0,0,0.42) 0%,
  rgba(0,0,0,0) 40%,
  rgba(0,0,0,0) 55%,
  rgba(0,0,0,0.5) 100%)`

/** Daylight behind the cloth. */
const GLOW = `radial-gradient(62% 62% at 50% 34%,
  rgba(251,237,216,0.92) 0%,
  rgba(232,191,134,0.34) 45%,
  rgba(23,24,26,0) 100%)`

const RAIL_BAR = 'linear-gradient(180deg, #c9a15e 0%, #8d6a34 50%, #5d4520 100%)'

/**
 * The rings, as one repeating tile. Drawn at a fixed pixel size so they stay
 * circular whatever the viewport is doing.
 */
const RAIL_RINGS = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="24" viewBox="0 0 56 24">' +
    '<circle cx="28" cy="16" r="5.5" fill="none" stroke="#8d6a34" stroke-width="3"/></svg>',
)}")`

export function CurtainCloth({
  /** The daylight behind the cloth. Off for the page transition, which covers rather than reveals. */
  glow = true,
  /** The rail. */
  rail = true,
  className,
  style,
}: {
  glow?: boolean
  rail?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      aria-hidden
    >
      {glow && <div data-glow style={{ position: 'absolute', inset: 0, backgroundImage: GLOW }} />}

      <Panel side="left" />
      <Panel side="right" />

      {/* Above the cloth and fixed, because a real rail is. */}
      {rail && (
        <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 24 }}>
          <div
            style={{ position: 'absolute', insetInline: 0, top: 0, height: 14, backgroundImage: RAIL_BAR }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: RAIL_RINGS,
              backgroundRepeat: 'repeat-x',
              backgroundSize: '56px 24px',
            }}
          />
        </div>
      )}
    </div>
  )
}

function Panel({ side }: { side: 'left' | 'right' }) {
  const left = side === 'left'

  // The leading edge catches the light coming through the gap, so it goes on
  // whichever side of the panel faces the centre.
  const edge = left
    ? 'linear-gradient(90deg, rgba(232,191,134,0) calc(100% - 3px), rgba(232,191,134,0.28) calc(100% - 3px))'
    : 'linear-gradient(90deg, rgba(232,191,134,0.28) 3px, rgba(232,191,134,0) 3px)'

  return (
    <div
      data-curtain
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [left ? 'left' : 'right']: 0,
        width: PANEL_W,
        // Gathers to the outer wall, the way a drawn curtain actually stacks.
        transformOrigin: left ? 'left center' : 'right center',
        // The whole point of the rewrite: this promotes the panel to its own
        // layer, so a `scaleX` tween is the compositor scaling a bitmap that
        // has already been painted rather than a repaint of the pattern on
        // every frame.
        willChange: 'transform',
        // Topmost first. Fold shading sits over the weave, the vertical shade
        // over both, and the lit edge over everything.
        backgroundImage: [edge, SHADE, FOLDS, CLOTH].join(','),
        backgroundRepeat: 'no-repeat,no-repeat,repeat,repeat',
        backgroundSize: `auto,auto,auto,${TILE} ${TILE}`,
        // Anchored to the leading edge, so the weave and the folds stay put
        // against the gap rather than sliding as the panel is drawn.
        backgroundPosition: left ? 'right top' : 'left top',
      }}
    />
  )
}
