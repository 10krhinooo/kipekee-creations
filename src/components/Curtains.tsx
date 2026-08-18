import { useId, type CSSProperties } from 'react'
import { patternDefs } from '../lib/swatch'

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
 */

const VIEW_W = 1000
const VIEW_H = 620
/** Panels overlap at the centre so the closed pair meets with no seam. */
const PANEL_W = VIEW_W / 2 + 8

export function CurtainCloth({
  /** The daylight behind the cloth. Off for the page transition, which covers rather than reveals. */
  glow = true,
  /** The rail. Off on narrow screens, where a squashed ring reads as a smudge. */
  rail = true,
  className,
  style,
}: {
  glow?: boolean
  rail?: boolean
  className?: string
  style?: CSSProperties
}) {
  const raw = useId()

  // SVG ids are global to the document, and two of these can be mounted at once
  // - the page transition sits above whatever the page already draws - so every
  // def is scoped rather than trusting that names like `cloth` stay unique.
  const uid = raw.replace(/[^A-Za-z0-9_-]/g, '')
  const id = {
    cloth: `cloth-${uid}`,
    glow: `glow-${uid}`,
    shade: `shade-${uid}`,
    rail: `rail-${uid}`,
  }

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {/* The same fabric definition the storefront swatches and the room
            visualiser use, so this is cloth we actually sell. */}
        <g dangerouslySetInnerHTML={{ __html: patternDefs('damask', '#4d0d0f', id.cloth) }} />

        <radialGradient id={id.glow} cx="50%" cy="34%" r="62%">
          <stop offset="0" stopColor="#fbedd8" stopOpacity="0.92" />
          <stop offset="0.45" stopColor="#e8bf86" stopOpacity="0.34" />
          <stop offset="1" stopColor="#17181a" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={id.shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0.42" />
          <stop offset="0.4" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.5" />
        </linearGradient>

        <linearGradient id={id.rail} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a15e" />
          <stop offset="0.5" stopColor="#8d6a34" />
          <stop offset="1" stopColor="#5d4520" />
        </linearGradient>
      </defs>

      {glow && <rect data-glow width={VIEW_W} height={VIEW_H} fill={`url(#${id.glow})`} />}

      <Panel side="left" clothId={id.cloth} shadeId={id.shade} />
      <Panel side="right" clothId={id.cloth} shadeId={id.shade} />

      {/* Above the cloth and fixed, because a real rail is. */}
      {rail && (
        <>
          <rect x="0" y="0" width={VIEW_W} height="14" fill={`url(#${id.rail})`} />
          {Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx={22 + i * 41} cy="16" r="5.5" fill="none" stroke="#8d6a34" strokeWidth="3" />
          ))}
        </>
      )}
    </svg>
  )
}

function Panel({ side, clothId, shadeId }: { side: 'left' | 'right'; clothId: string; shadeId: string }) {
  const left = side === 'left'
  const x = left ? 0 : VIEW_W - PANEL_W
  // Gathers to the outer wall, the way a drawn curtain actually stacks.
  const anchor = left ? 0 : VIEW_W

  return (
    <g data-curtain style={{ transformBox: 'view-box', transformOrigin: `${anchor}px 0px` }}>
      <rect x={x} y="0" width={PANEL_W} height={VIEW_H} fill={`url(#${clothId})`} />
      {/* Folds. Uneven spacing and alternating weight so the drop does not read
          as a flat printed sheet. */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={x + 14 + i * (PANEL_W / 9)}
          y="0"
          width={i % 2 === 0 ? 26 : 13}
          height={VIEW_H}
          fill="#000000"
          opacity={i % 2 === 0 ? 0.22 : 0.1}
        />
      ))}
      <rect x={x} y="0" width={PANEL_W} height={VIEW_H} fill={`url(#${shadeId})`} />
      {/* The leading edge catches the light coming through the gap. */}
      <rect x={left ? x + PANEL_W - 3 : x} y="0" width="3" height={VIEW_H} fill="#e8bf86" opacity="0.28" />
    </g>
  )
}
