import { useId, useMemo } from 'react'
import { cx } from './ui'

/**
 * Live room visualiser.
 *
 * The curtain is drawn as a recolourable layer over a fixed room scene, so
 * changing the colour on the product page repaints the fabric in place. The
 * scene is procedural SVG here because the prototype has no photography, but
 * the technique is the one a photographic version uses: a fixed base plate, a
 * flat colour layer clipped to the curtain shape, and a separate shading layer
 * multiplied on top to put the folds back. Swapping in a real photo means
 * replacing the base and the clip path, not rewriting the recolour logic.
 */

export type SceneKind = 'curtains' | 'sheer' | 'canopy' | 'rail'

interface RoomPreviewProps {
  colour: string
  kind?: SceneKind
  /** Curtains drawn across the window, or stacked back at the sides. */
  drawn?: boolean
  /** Daylight outside, or night, which is how blockout earns its money. */
  night?: boolean
  hardware?: string
  className?: string
}

const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const r = clamp(((n >> 16) & 255) + amount)
  const g = clamp(((n >> 8) & 255) + amount)
  const b = clamp((n & 255) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Fold shading. A curtain reads as cloth rather than a coloured rectangle
 * because of the vertical light and shade running down the pleats, so the
 * gradient is built from the panel width rather than painted on.
 */
function folds(x: number, width: number, count: number, id: string) {
  const stops: { offset: number; colour: string; opacity: number }[] = []
  for (let i = 0; i <= count; i += 1) {
    const t = i / count
    // Alternate the crest and the trough of each pleat.
    const crest = i % 2 === 0
    stops.push({
      offset: t,
      colour: crest ? '#ffffff' : '#000000',
      opacity: crest ? 0.17 : 0.28,
    })
  }
  return (
    <linearGradient id={id} x1={x} y1="0" x2={x + width} y2="0" gradientUnits="userSpaceOnUse">
      {stops.map((s, i) => (
        <stop key={i} offset={`${s.offset * 100}%`} stopColor={s.colour} stopOpacity={s.opacity} />
      ))}
    </linearGradient>
  )
}

export function RoomPreview({
  colour,
  kind = 'curtains',
  drawn = true,
  night = false,
  hardware = '#2c2c2c',
  className,
}: RoomPreviewProps) {
  const uid = useId().replace(/:/g, '')
  const ids = useMemo(
    () => ({
      leftFold: `lf-${uid}`,
      rightFold: `rf-${uid}`,
      sky: `sky-${uid}`,
      wall: `wall-${uid}`,
      glow: `glow-${uid}`,
      sheer: `sh-${uid}`,
    }),
    [uid],
  )

  const wallTop = night ? '#2b2d33' : '#efeae3'
  const wallBottom = night ? '#212227' : '#e2dbd1'
  const floor = night ? '#1b1c20' : '#c9b9a4'

  // Panel geometry. Drawn panels meet in the middle; open ones stack at the
  // reveal edges, which is what makes the toggle read as a real curtain.
  const panelW = drawn ? 150 : 64
  const leftX = 60
  const rightX = drawn ? 480 - 60 - panelW : 480 - 60 - panelW

  const isSheer = kind === 'sheer'
  const railOnly = kind === 'rail'
  const isCanopy = kind === 'canopy'

  return (
    <svg
      viewBox="0 0 480 600"
      className={cx('h-full w-full', className)}
      role="img"
      aria-label={`Room preview with the fabric in the selected colour${night ? ', at night' : ''}`}
    >
      <defs>
        <linearGradient id={ids.wall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBottom} />
        </linearGradient>

        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          {night ? (
            <>
              <stop offset="0" stopColor="#0f1a2e" />
              <stop offset="1" stopColor="#1d2b41" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#bfe0f5" />
              <stop offset="0.62" stopColor="#e8f2f8" />
              <stop offset="1" stopColor="#cfdcc9" />
            </>
          )}
        </linearGradient>

        <radialGradient id={ids.glow} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity={night ? 0.05 : 0.55} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={ids.sheer} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.42" />
        </linearGradient>

        {folds(leftX, panelW, 9, ids.leftFold)}
        {folds(rightX, panelW, 9, ids.rightFold)}
      </defs>

      {/* Wall and floor */}
      <rect width="480" height="600" fill={`url(#${ids.wall})`} />
      <rect y="520" width="480" height="80" fill={floor} />
      <rect y="516" width="480" height="5" fill={shade(floor, -22)} />

      {/* Window reveal */}
      <rect x="92" y="96" width="296" height="404" rx="3" fill={shade(wallBottom, -26)} />
      <rect x="100" y="104" width="280" height="388" fill={`url(#${ids.sky})`} />

      {/* A hint of a view, so the glass does not read as a flat panel. */}
      {!night && (
        <>
          <path d="M100 420 q40 -46 82 -10 q34 30 74 4 q40 -26 124 12 v66 H100 Z" fill="#a9bda0" opacity="0.75" />
          <circle cx="318" cy="168" r="26" fill="#ffffff" opacity="0.5" />
        </>
      )}
      {night && (
        <>
          <circle cx="318" cy="166" r="18" fill="#f4f1e4" opacity="0.85" />
          <circle cx="150" cy="200" r="1.6" fill="#ffffff" opacity="0.7" />
          <circle cx="210" cy="150" r="1.2" fill="#ffffff" opacity="0.5" />
          <circle cx="262" cy="228" r="1.4" fill="#ffffff" opacity="0.6" />
        </>
      )}

      {/* Glazing bars */}
      <rect x="236" y="104" width="8" height="388" fill={shade(wallBottom, -14)} />
      <rect x="100" y="292" width="280" height="8" fill={shade(wallBottom, -14)} />

      {/* Daylight spill onto the wall and floor */}
      <ellipse cx="240" cy="300" rx="250" ry="280" fill={`url(#${ids.glow})`} />

      {/* Sheer inner layer, always behind the main curtains */}
      {!railOnly && !isCanopy && (
        <rect
          x="104"
          y="84"
          width="272"
          height="412"
          fill={isSheer ? colour : `url(#${ids.sheer})`}
          opacity={isSheer ? 0.72 : 0.55}
        />
      )}

      {/* Rail and finials */}
      <rect x="44" y="74" width="392" height="9" rx="4.5" fill={hardware} />
      <circle cx="46" cy="78.5" r="9" fill={hardware} />
      <circle cx="434" cy="78.5" r="9" fill={hardware} />
      <rect x="120" y="66" width="7" height="24" rx="3" fill={shade(hardware, 18)} />
      <rect x="353" y="66" width="7" height="24" rx="3" fill={shade(hardware, 18)} />

      {!railOnly && !isCanopy && (
        <>
          {/* Left panel: flat colour, then folds multiplied over it. */}
          <g>
            <path
              d={`M${leftX} 84 h${panelW} v412 q-${panelW / 2} 12 -${panelW} 0 Z`}
              fill={colour}
            />
            <path
              d={`M${leftX} 84 h${panelW} v412 q-${panelW / 2} 12 -${panelW} 0 Z`}
              fill={`url(#${ids.leftFold})`}
              style={{ mixBlendMode: 'multiply' }}
            />
          </g>

          {/* Right panel */}
          <g>
            <path
              d={`M${rightX} 84 h${panelW} v412 q-${panelW / 2} 12 -${panelW} 0 Z`}
              fill={colour}
            />
            <path
              d={`M${rightX} 84 h${panelW} v412 q-${panelW / 2} 12 -${panelW} 0 Z`}
              fill={`url(#${ids.rightFold})`}
              style={{ mixBlendMode: 'multiply' }}
            />
          </g>

          {/* Heading tape shadow under the rail */}
          <rect x={leftX} y="84" width={panelW} height="14" fill="#000000" opacity="0.14" />
          <rect x={rightX} y="84" width={panelW} height="14" fill="#000000" opacity="0.14" />
        </>
      )}

      {/* Canopy variant drapes from a ceiling ring instead of a rail. */}
      {isCanopy && (
        <>
          <circle cx="240" cy="70" r="14" fill={hardware} opacity="0.9" />
          <path d="M240 78 L96 500 q144 26 288 0 Z" fill={colour} opacity="0.72" />
          <path
            d="M240 78 L96 500 q144 26 288 0 Z"
            fill={`url(#${ids.leftFold})`}
            style={{ mixBlendMode: 'multiply' }}
            opacity="0.7"
          />
        </>
      )}

      {/* Floor shadow anchors the whole thing */}
      <ellipse cx="240" cy="512" rx="200" ry="16" fill="#000000" opacity={night ? 0.22 : 0.12} />
    </svg>
  )
}
