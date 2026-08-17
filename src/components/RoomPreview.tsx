import { useId, useMemo } from 'react'
import { cx } from './ui'

/**
 * Live room visualiser.
 *
 * The curtain is drawn as a recolourable layer inside a furnished room, so
 * changing the colour or the heading on the product page repaints and reshapes
 * the fabric in place. The scene is procedural SVG because the prototype has no
 * photography, but the layering is the one a photographic version uses: a fixed
 * base plate, a flat colour layer clipped to the curtain shape, and a shading
 * layer multiplied on top to put the folds back. Swapping in a real photograph
 * means replacing the base and the clip path, not the recolour logic.
 */

export type SceneKind = 'curtains' | 'sheer' | 'canopy' | 'rail'

/** Heading styles change the whole silhouette, not just the top edge. */
export type Heading = 'pencil' | 'wave' | 'eyelet'

export type Finial = 'ball' | 'scroll' | 'spear'

interface RoomPreviewProps {
  colour: string
  kind?: SceneKind
  heading?: Heading
  finial?: Finial
  drawn?: boolean
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

/** Pleat count and depth per heading, which is what the eye actually reads. */
const headingSpec: Record<Heading, { pleats: number; amp: number; topDrop: number }> = {
  pencil: { pleats: 13, amp: 3, topDrop: 0 },
  wave: { pleats: 7, amp: 7, topDrop: 5 },
  eyelet: { pleats: 8, amp: 6, topDrop: 9 },
}

/**
 * Build one curtain panel. The top edge carries the heading: flat and gathered
 * for pencil pleat, a continuous S wave for wave heading, and scallops slung
 * between rings for eyelets. The hem always falls in a soft wave.
 */
function panelPath(
  x: number,
  w: number,
  top: number,
  bottom: number,
  heading: Heading,
): string {
  const { pleats, topDrop } = headingSpec[heading]
  const step = w / pleats
  let d = `M${x} ${top}`

  if (heading === 'pencil') {
    // Gathered tape reads as an almost straight top with a shallow ripple.
    for (let i = 0; i < pleats; i += 1) {
      const x0 = x + i * step
      d += ` Q${x0 + step / 2} ${top + 2.5} ${x0 + step} ${top}`
    }
  } else if (heading === 'wave') {
    // One continuous S curve, alternating in front of and behind the track.
    for (let i = 0; i < pleats; i += 1) {
      const x0 = x + i * step
      const dir = i % 2 === 0 ? topDrop : -topDrop * 0.4
      d += ` Q${x0 + step / 2} ${top + dir} ${x0 + step} ${top}`
    }
  } else {
    // Eyelets: fabric slings down between each ring.
    for (let i = 0; i < pleats; i += 1) {
      const x0 = x + i * step
      d += ` Q${x0 + step / 2} ${top + topDrop} ${x0 + step} ${top}`
    }
  }

  d += ` L${x + w} ${bottom}`

  // Hem, drawn right to left so the path closes cleanly.
  const hemSteps = 4
  const hemStep = w / hemSteps
  for (let i = 0; i < hemSteps; i += 1) {
    const x0 = x + w - i * hemStep
    d += ` Q${x0 - hemStep / 2} ${bottom + (i % 2 === 0 ? 9 : 3)} ${x0 - hemStep} ${bottom}`
  }

  return `${d} Z`
}

/** Vertical light and shade down the pleats, which is what makes it cloth. */
function foldGradient(x: number, width: number, count: number, id: string) {
  const stops = []
  for (let i = 0; i <= count; i += 1) {
    const crest = i % 2 === 0
    stops.push(
      <stop
        key={i}
        offset={`${(i / count) * 100}%`}
        stopColor={crest ? '#ffffff' : '#000000'}
        stopOpacity={crest ? 0.16 : 0.3}
      />,
    )
  }
  return (
    <linearGradient id={id} x1={x} y1="0" x2={x + width} y2="0" gradientUnits="userSpaceOnUse">
      {stops}
    </linearGradient>
  )
}

function FinialShape({ x, y, kind, fill }: { x: number; y: number; kind: Finial; fill: string }) {
  if (kind === 'scroll') {
    return (
      <g>
        <circle cx={x} cy={y} r="8" fill="none" stroke={fill} strokeWidth="3.4" />
        <circle cx={x} cy={y} r="2.4" fill={fill} />
      </g>
    )
  }
  if (kind === 'spear') {
    return <path d={`M${x} ${y - 12} L${x + 6} ${y} L${x} ${y + 12} L${x - 6} ${y} Z`} fill={fill} />
  }
  return <circle cx={x} cy={y} r="8.5" fill={fill} />
}

export function RoomPreview({
  colour,
  kind = 'curtains',
  heading = 'pencil',
  finial = 'ball',
  drawn = true,
  night = false,
  hardware = '#2c2c2c',
  className,
}: RoomPreviewProps) {
  const uid = useId().replace(/:/g, '')
  const ids = useMemo(
    () => ({
      left: `l-${uid}`,
      right: `r-${uid}`,
      sky: `sky-${uid}`,
      wall: `wall-${uid}`,
      glow: `glow-${uid}`,
      lamp: `lamp-${uid}`,
      floor: `flr-${uid}`,
    }),
    [uid],
  )

  const wallTop = night ? '#2f3038' : '#f1ece4'
  const wallBottom = night ? '#24252b' : '#e4ddd2'
  const woodTone = night ? '#2a241f' : '#b08c63'
  const rugTone = night ? '#33302c' : '#cfc3b2'

  const railY = 70
  const top = 82
  const hem = 486
  const panelW = drawn ? 148 : 62
  const leftX = 62
  const rightX = 480 - 62 - panelW

  const { pleats } = headingSpec[heading]
  const isSheer = kind === 'sheer'
  const railOnly = kind === 'rail'
  const isCanopy = kind === 'canopy'
  const showPanels = !railOnly && !isCanopy

  return (
    <svg
      viewBox="0 0 480 600"
      className={cx('h-full w-full', className)}
      role="img"
      aria-label={`Room preview, ${heading} heading, fabric in the selected colour${
        night ? ', at night' : ''
      }`}
    >
      <defs>
        <linearGradient id={ids.wall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBottom} />
        </linearGradient>

        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          {night ? (
            <>
              <stop offset="0" stopColor="#0d1729" />
              <stop offset="1" stopColor="#1c2a40" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#b6dcf4" />
              <stop offset="0.6" stopColor="#e6f1f8" />
              <stop offset="1" stopColor="#cddcc6" />
            </>
          )}
        </linearGradient>

        <radialGradient id={ids.glow} cx="0.5" cy="0.34" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity={night ? 0.04 : 0.5} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={ids.lamp} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd89b" stopOpacity={night ? 0.55 : 0.12} />
          <stop offset="1" stopColor="#ffd89b" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={ids.floor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(woodTone, -18)} />
          <stop offset="1" stopColor={woodTone} />
        </linearGradient>

        {foldGradient(leftX, panelW, pleats, ids.left)}
        {foldGradient(rightX, panelW, pleats, ids.right)}
      </defs>

      {/* ROOM SHELL */}
      <rect width="480" height="600" fill={`url(#${ids.wall})`} />
      {/* Cornice */}
      <rect y="0" width="480" height="14" fill={shade(wallTop, night ? 8 : 10)} />
      <rect y="14" width="480" height="3" fill={shade(wallBottom, -18)} opacity="0.5" />

      {/* Floor and skirting */}
      <rect y="498" width="480" height="102" fill={`url(#${ids.floor})`} />
      {[0, 96, 192, 288, 384].map((x) => (
        <rect key={x} x={x} y="498" width="2" height="102" fill="#000" opacity="0.08" />
      ))}
      <rect y="486" width="480" height="14" fill={shade(wallBottom, night ? 6 : 14)} />
      <rect y="486" width="480" height="3" fill={shade(wallBottom, -26)} opacity="0.6" />

      {/* WINDOW */}
      <rect x="96" y="92" width="288" height="392" rx="2" fill={shade(wallBottom, -30)} />
      <rect x="104" y="100" width="272" height="376" fill={`url(#${ids.sky})`} />

      {!night ? (
        <>
          <path
            d="M104 404 q38 -44 78 -10 q32 28 70 4 q38 -24 124 12 v66 H104 Z"
            fill="#9fb597"
            opacity="0.8"
          />
          <rect x="104" y="440" width="272" height="36" fill="#8ca285" opacity="0.55" />
          <circle cx="312" cy="158" r="24" fill="#ffffff" opacity="0.45" />
          <ellipse cx="180" cy="146" rx="34" ry="12" fill="#ffffff" opacity="0.55" />
        </>
      ) : (
        <>
          <circle cx="312" cy="156" r="17" fill="#f6f2e2" opacity="0.9" />
          <circle cx="312" cy="156" r="30" fill="#f6f2e2" opacity="0.12" />
          {[
            [148, 190],
            [206, 146],
            [258, 224],
            [340, 250],
            [178, 268],
          ].map(([cx2, cy2], i) => (
            <circle key={i} cx={cx2} cy={cy2} r={i % 2 ? 1.1 : 1.6} fill="#fff" opacity="0.65" />
          ))}
          <rect x="104" y="430" width="272" height="46" fill="#0a1120" opacity="0.55" />
          {[130, 168, 214, 268, 326].map((x, i) => (
            <rect key={x} x={x} y={438 + (i % 2) * 6} width="3" height="4" fill="#ffd89b" opacity="0.75" />
          ))}
        </>
      )}

      {/* Glazing bars and sill */}
      <rect x="236" y="100" width="7" height="376" fill={shade(wallBottom, -16)} />
      <rect x="104" y="284" width="272" height="7" fill={shade(wallBottom, -16)} />
      <rect x="88" y="476" width="304" height="12" rx="2" fill={shade(wallBottom, night ? 4 : 18)} />

      {/* Daylight spilling into the room */}
      <ellipse cx="240" cy="290" rx="260" ry="300" fill={`url(#${ids.glow})`} />
      {!night && (
        <path d="M120 498 L360 498 L410 570 L70 570 Z" fill="#ffffff" opacity="0.18" />
      )}

      {/* Sheer inner layer */}
      {showPanels && (
        <rect
          x="108"
          y={top}
          width="264"
          height={hem - top}
          fill={isSheer ? colour : '#ffffff'}
          opacity={isSheer ? 0.7 : 0.5}
        />
      )}

      {/* TRACK OR POLE. Eyelets need a visible pole, wave heading a slim track. */}
      {heading === 'wave' && showPanels ? (
        <rect x="46" y={railY} width="388" height="7" rx="2" fill={hardware} />
      ) : (
        <>
          <rect x="46" y={railY - 1} width="388" height="9" rx="4.5" fill={hardware} />
          <FinialShape x={44} y={railY + 3.5} kind={finial} fill={hardware} />
          <FinialShape x={436} y={railY + 3.5} kind={finial} fill={hardware} />
        </>
      )}
      <rect x="122" y={railY - 8} width="7" height="24" rx="3" fill={shade(hardware, 20)} />
      <rect x="351" y={railY - 8} width="7" height="24" rx="3" fill={shade(hardware, 20)} />

      {/* CURTAIN PANELS */}
      {showPanels && (
        <>
          {[
            { x: leftX, grad: ids.left },
            { x: rightX, grad: ids.right },
          ].map((panel) => {
            const d = panelPath(panel.x, panelW, top, hem, heading)
            return (
              <g key={panel.grad}>
                <path d={d} fill={colour} />
                <path d={d} fill={`url(#${panel.grad})`} style={{ mixBlendMode: 'multiply' }} />
                {/* Heading tape shadow, tight under the track */}
                <rect x={panel.x} y={top} width={panelW} height="12" fill="#000" opacity="0.13" />
              </g>
            )
          })}

          {/* Eyelet rings sit over the pole and read instantly as the style. */}
          {heading === 'eyelet' &&
            [leftX, rightX].flatMap((x) =>
              Array.from({ length: pleats }, (_, i) => (
                <circle
                  key={`${x}-${i}`}
                  cx={x + (i + 0.5) * (panelW / pleats)}
                  cy={railY + 3.5}
                  r="6"
                  fill="none"
                  stroke={shade(hardware, 40)}
                  strokeWidth="2.6"
                />
              )),
            )}
        </>
      )}

      {/* Canopy variant hangs from a ceiling ring */}
      {isCanopy && (
        <>
          <circle cx="240" cy="58" r="12" fill={hardware} opacity="0.9" />
          <path d="M240 66 L104 486 q136 24 272 0 Z" fill={colour} opacity="0.72" />
          <path
            d="M240 66 L104 486 q136 24 272 0 Z"
            fill={`url(#${ids.left})`}
            style={{ mixBlendMode: 'multiply' }}
            opacity="0.65"
          />
        </>
      )}

      {/* FURNITURE. A window on a bare wall gives no sense of scale, so the
          room is dressed: rug, sofa, side table with a lamp, and a plant. */}
      <ellipse cx="240" cy="556" rx="196" ry="40" fill={rugTone} />
      <ellipse cx="240" cy="556" rx="166" ry="30" fill="none" stroke={shade(rugTone, -22)} strokeWidth="2" />

      {/* Plant, left */}
      <g>
        <path d="M34 560 h44 l-6 -46 h-32 Z" fill={night ? '#3a3128' : '#a9683f'} />
        <path d="M34 514 h44 v7 h-44 Z" fill={night ? '#463a2e' : '#bd7748'} />
        {[
          'M56 514 q-26 -34 -6 -66 q14 26 6 66',
          'M56 514 q26 -30 10 -60 q-16 24 -10 60',
          'M56 514 q-34 -18 -34 -46 q26 12 34 46',
          'M56 514 q32 -14 38 -40 q-26 8 -38 40',
        ].map((d, i) => (
          <path key={i} d={d} fill={night ? '#2d4034' : '#4d7150'} />
        ))}
      </g>

      {/* Side table and lamp, right */}
      <g>
        <ellipse cx="424" cy="524" rx="42" ry="9" fill={night ? '#3b322a' : '#8a6444'} />
        <rect x="420" y="524" width="8" height="34" fill={night ? '#3b322a' : '#8a6444'} />
        <ellipse cx="424" cy="558" rx="26" ry="7" fill={night ? '#332b24' : '#7a583c'} />
        <circle cx="424" cy="470" r="52" fill={`url(#${ids.lamp})`} />
        <path d="M406 512 h36 l-7 -34 h-22 Z" fill={night ? '#f2dcb0' : '#e8dcc6'} />
      </g>

      {/* Sofa back, foreground. Cropped by the frame so the room has depth. */}
      <g>
        <rect x="96" y="546" width="248" height="54" rx="14" fill={night ? '#3a3b42' : '#8d9187'} />
        <rect x="112" y="558" width="100" height="42" rx="10" fill={night ? '#43444c' : '#9ba095'} />
        <rect x="228" y="558" width="100" height="42" rx="10" fill={night ? '#43444c' : '#9ba095'} />
        {/* Cushions pick up the curtain colour, which is how a room is actually put together. */}
        <rect x="130" y="556" width="40" height="40" rx="8" fill={colour} opacity="0.92" />
        <rect x="268" y="556" width="40" height="40" rx="8" fill={colour} opacity="0.72" />
      </g>

      {/* Contact shadow under the window wall */}
      <ellipse cx="240" cy="496" rx="210" ry="10" fill="#000" opacity={night ? 0.24 : 0.1} />
    </svg>
  )
}
