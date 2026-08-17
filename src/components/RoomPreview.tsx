import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react'
import { animate, utils } from 'animejs'
import { cx } from './ui'
import { patternDefs } from '../lib/swatch'
import type { PatternKind } from '../data/types'

/**
 * Live product visualiser.
 *
 * Every product is shown in the setting it belongs to: curtains at a window,
 * linen made up on a bed, cushions on a sofa, towels in a bathroom, mats on a
 * dining table. Each scene paints its fabric with the product's real pattern
 * and colour, so changing either repaints the scene rather than a placeholder.
 *
 * Layering is the same everywhere, and is the structure a photographic version
 * would use: a fixed base plate, a fabric layer filled with the pattern, and a
 * shading layer multiplied on top to put folds and creases back. Only the
 * fabric layer changes when the customer picks a colour.
 *
 * Motion runs through anime.js. React owns the shape of the scene and anime
 * owns two properties on top of it: `transform` on the curtain panels and
 * `opacity` on everything tied to the light source. Those two are deliberately
 * never written by React, so a re-render cannot fight the tween mid-flight.
 * Elements opt in with `data-panel` and `data-night`, and the first paint is
 * set with `utils.set` so the scene does not animate itself open on load.
 */

export type SceneKind = 'window' | 'bed' | 'sofa' | 'bath' | 'dining'
export type SceneVariant = 'curtains' | 'sheer' | 'rail' | 'canopy' | 'default'
export type Heading = 'pencil' | 'wave' | 'eyelet'
export type Finial = 'ball' | 'scroll' | 'spear'

/** What the room tab is called, per scene. */
export const sceneTabLabel: Record<SceneKind, string> = {
  window: 'In the room',
  bed: 'On the bed',
  sofa: 'On the sofa',
  bath: 'In the bathroom',
  dining: 'On the table',
}

/** Tune the feel of the whole visualiser from here. */
const CURTAIN_MS = 900
/** Light changes slower than fabric moves, which is what makes it read as light. */
const LIGHT_MS = 1400
/** Physical, not linear: eased at both ends, quick through the middle. */
const CURTAIN_EASE = 'inOut(2.2)'
const LIGHT_EASE = 'inOutQuad'

/** How far a panel gathers when it is drawn back. */
const GATHERED = 0.36

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface RoomPreviewProps {
  colour: string
  pattern: PatternKind
  scene: SceneKind
  /** Window scene only. */
  heading?: Heading
  finial?: Finial
  drawn?: boolean
  /** Window scene shows a sheer only for curtains, not for a bare rail. */
  variant?: SceneVariant
  night?: boolean
  /** Bed scenes only: relative bed width for the selected size. */
  bedScale?: number
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

const headingSpec: Record<Heading, { pleats: number; drop: number }> = {
  pencil: { pleats: 13, drop: 2.5 },
  wave: { pleats: 7, drop: 7 },
  eyelet: { pleats: 8, drop: 1.5 },
}

/* ------------------------------------------------------------------ shapes */

function panelPath(x: number, w: number, top: number, bottom: number, heading: Heading) {
  const { pleats, drop } = headingSpec[heading]
  const step = w / pleats
  let d = `M${x} ${top}`

  for (let i = 0; i < pleats; i += 1) {
    const x0 = x + i * step
    const dip = heading === 'wave' && i % 2 === 1 ? -drop * 0.4 : drop
    d += ` Q${x0 + step / 2} ${top + dip} ${x0 + step} ${top}`
  }

  d += ` L${x + w} ${bottom}`

  const hemSteps = 4
  const hemStep = w / hemSteps
  for (let i = 0; i < hemSteps; i += 1) {
    const x0 = x + w - i * hemStep
    d += ` Q${x0 - hemStep / 2} ${bottom + (i % 2 === 0 ? 9 : 3)} ${x0 - hemStep} ${bottom}`
  }

  return `${d} Z`
}

/** Vertical light and shade down the pleats. Travels with the fabric. */
function foldGradient(x: number, width: number, count: number, id: string) {
  return (
    <linearGradient id={id} x1={x} y1="0" x2={x + width} y2="0" gradientUnits="userSpaceOnUse">
      {Array.from({ length: count + 1 }, (_, i) => {
        const crest = i % 2 === 0
        return (
          <stop
            key={i}
            offset={`${(i / count) * 100}%`}
            stopColor={crest ? '#ffffff' : '#000000'}
            stopOpacity={crest ? 0.16 : 0.3}
          />
        )
      })}
    </linearGradient>
  )
}

/**
 * One piece of cloth: the pattern, then its shading. Both live on the same
 * shape, so anything that transforms the shape transforms the pattern with it
 * and the weave never slides across the fabric.
 */
function Fabric({
  d,
  fabricId,
  shadeId,
  opacity,
}: {
  d: string
  fabricId: string
  shadeId?: string
  opacity?: number
}) {
  return (
    <>
      <path d={d} fill={`url(#${fabricId})`} opacity={opacity} />
      {shadeId && (
        <path d={d} fill={`url(#${shadeId})`} style={{ mixBlendMode: 'multiply' }} opacity={opacity} />
      )}
    </>
  )
}

function FinialShape({ x, y, kind, fill }: { x: number; y: number; kind: Finial; fill: string }) {
  if (kind === 'scroll')
    return (
      <g>
        <circle cx={x} cy={y} r="8" fill="none" stroke={fill} strokeWidth="3.4" />
        <circle cx={x} cy={y} r="2.4" fill={fill} />
      </g>
    )
  if (kind === 'spear')
    return <path d={`M${x} ${y - 12} L${x + 6} ${y} L${x} ${y + 12} L${x - 6} ${y} Z`} fill={fill} />
  return <circle cx={x} cy={y} r="8.5" fill={fill} />
}

/* ------------------------------------------------------------------- scene */

export function RoomPreview({
  colour,
  pattern,
  scene,
  heading = 'pencil',
  finial = 'ball',
  drawn = true,
  variant = 'default',
  night = false,
  bedScale = 1,
  hardware = '#2c2c2c',
  className,
}: RoomPreviewProps) {
  const uid = useId().replace(/:/g, '')
  const id = useMemo(
    () => ({
      fabric: `fab-${uid}`,
      left: `l-${uid}`,
      right: `r-${uid}`,
      soft: `s-${uid}`,
      daySky: `dsky-${uid}`,
      nightSky: `nsky-${uid}`,
      glow: `glow-${uid}`,
      lamp: `lamp-${uid}`,
      floor: `flr-${uid}`,
    }),
    [uid],
  )

  const { pleats } = headingSpec[heading]

  // Panels are always drawn closed and full width. Opening is a horizontal
  // gather anchored to the outer edge, which is both what a real curtain does
  // and what lets the whole thing animate as one transform.
  const top = 82
  const hem = 486
  const outerL = 58
  const outerR = 422
  const centre = 240
  // 6px of overlap at the centre, so the closed panels meet with no gap.
  const panelW = centre - outerL + 6

  /**
   * Anchors the gather to the outer wall. anime owns `transform` from here on,
   * so React sets the origin once and never the transform itself.
   */
  const panelStyle = (anchor: number): CSSProperties => ({
    transformBox: 'view-box',
    transformOrigin: `${anchor}px 0px`,
  })

  const root = useRef<SVGSVGElement>(null)

  /**
   * Latest state, read by the seeding effect without becoming a dependency of
   * it. Seeding must fire only when the scene swaps in fresh elements; if it
   * re-ran on a state change it would snap to the destination first and leave
   * the tween below with nothing to travel.
   */
  const latest = useRef({ drawn, night })
  latest.current = { drawn, night }
  const latestBed = useRef(bedScale)
  latestBed.current = bedScale

  // Newly mounted elements land on the current state with no tween, so loading
  // the page does not play an animation nobody asked for.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const { drawn: d, night: n } = latest.current
    utils.set(el.querySelectorAll('[data-panel]'), { scaleX: d ? 1 : GATHERED })
    utils.set(el.querySelectorAll('[data-night="in"]'), { opacity: n ? 1 : 0 })
    utils.set(el.querySelectorAll('[data-night="out"]'), { opacity: n ? 0 : 1 })
    utils.set(el.querySelectorAll('[data-bed]'), { scaleX: latestBed.current })
  }, [scene, variant, heading])

  // Curtains gather to the walls and sweep back to the centre.
  useEffect(() => {
    const el = root.current
    if (!el) return
    animate(el.querySelectorAll('[data-panel]'), {
      scaleX: drawn ? 1 : GATHERED,
      duration: reducedMotion() ? 0 : CURTAIN_MS,
      ease: CURTAIN_EASE,
    })
  }, [drawn])

  // A bigger bed size widens the bed in the scene.
  useEffect(() => {
    const el = root.current
    if (!el) return
    animate(el.querySelectorAll('[data-bed]'), {
      scaleX: bedScale,
      duration: reducedMotion() ? 0 : CURTAIN_MS,
      ease: CURTAIN_EASE,
    })
  }, [bedScale])

  // Every element tied to the light source crossfades as one.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const duration = reducedMotion() ? 0 : LIGHT_MS
    animate(el.querySelectorAll('[data-night="in"]'), {
      opacity: night ? 1 : 0,
      duration,
      ease: LIGHT_EASE,
    })
    animate(el.querySelectorAll('[data-night="out"]'), {
      opacity: night ? 0 : 1,
      duration,
      ease: LIGHT_EASE,
    })
  }, [night])

  const isWindow = scene === 'window'

  return (
    <svg
      ref={root}
      viewBox="0 0 480 600"
      className={cx('h-full w-full', className)}
      role="img"
      aria-label={`${sceneLabel[scene]} showing the product in the selected colour and pattern${
        isWindow ? `, ${heading} heading, curtains ${drawn ? 'closed' : 'open'}` : ''
      }${night ? ', at night' : ''}`}
    >
      <defs>
        {/* One shared fabric definition, straight from the swatch library. */}
        <g dangerouslySetInnerHTML={{ __html: patternDefs(pattern, colour, id.fabric) }} />

        <linearGradient id={id.daySky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6dcf4" />
          <stop offset="0.6" stopColor="#e6f1f8" />
          <stop offset="1" stopColor="#cddcc6" />
        </linearGradient>
        <linearGradient id={id.nightSky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1729" />
          <stop offset="1" stopColor="#1c2a40" />
        </linearGradient>

        <radialGradient id={id.glow} cx="0.5" cy="0.34" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id.lamp} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd89b" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd89b" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={id.floor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#96754f" />
          <stop offset="1" stopColor="#b08c63" />
        </linearGradient>

        <linearGradient id={id.soft} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="0.7" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>

        {foldGradient(outerL, panelW, pleats, id.left)}
        {foldGradient(centre - 6, panelW, pleats, id.right)}
      </defs>

      {/* Shell: wall, cornice, skirting, floor. Shared by every scene. */}
      <rect width="480" height="600" fill="#f1ece4" />
      <rect width="480" height="14" fill="#f6f2ea" />
      <rect y="14" width="480" height="3" fill="#d3c9ba" opacity="0.5" />
      <rect y="498" width="480" height="102" fill={`url(#${id.floor})`} />
      {[0, 96, 192, 288, 384].map((x) => (
        <rect key={x} x={x} y="498" width="2" height="102" fill="#000" opacity="0.08" />
      ))}
      <rect y="486" width="480" height="14" fill="#e9e1d4" />
      <rect y="486" width="480" height="3" fill="#c6bbaa" opacity="0.6" />

      {scene === 'window' && (
        <WindowScene
          id={id}
          colour={colour}
          heading={heading}
          finial={finial}
          hardware={hardware}
          variant={variant}
          panelW={panelW}
          outerL={outerL}
          outerR={outerR}
          centre={centre}
          top={top}
          hem={hem}
          pleats={pleats}
          panelStyle={panelStyle}
        />
      )}
      {scene === 'bed' && (
        <BedScene id={id} variant={variant} />
      )}
      {scene === 'sofa' && <SofaScene id={id} colour={colour} />}
      {scene === 'bath' && <BathScene id={id} colour={colour} />}
      {scene === 'dining' && <DiningScene id={id} colour={colour} />}

      {/* Ambient daylight, fading out as night comes in. */}
      <ellipse
        cx="240"
        cy="290"
        rx="260"
        ry="300"
        fill={`url(#${id.glow})`}
        data-night="out"
        pointerEvents="none"
      />

      {/*
        The night layer. Everything that responds to the light source lives
        here and crossfades as one: the darkened room, the deeper shadows and
        the warm lamp. Nothing swaps instantly.
      */}
      <g data-night="in" pointerEvents="none">
        <rect width="480" height="600" fill="#101827" opacity="0.62" />
        <rect y="498" width="480" height="102" fill="#0a0f18" opacity="0.45" />
        <ellipse cx="240" cy="530" rx="230" ry="46" fill="#000000" opacity="0.3" />
        <circle cx="424" cy="470" r="86" fill={`url(#${id.lamp})`} />
        <ellipse cx="240" cy="496" rx="210" ry="12" fill="#000" opacity="0.3" />
      </g>
    </svg>
  )
}

const sceneLabel: Record<SceneKind, string> = {
  window: 'Room preview',
  bed: 'Bedroom preview',
  sofa: 'Living room preview',
  bath: 'Bathroom preview',
  dining: 'Dining table preview',
}

/* ------------------------------------------------------------------ scenes */

type Ids = Record<string, string>

function WindowScene({
  id,
  colour,
  heading,
  finial,
  hardware,
  variant,
  panelW,
  outerL,
  outerR,
  centre,
  top,
  hem,
  pleats,
  panelStyle,
}: {
  id: Ids
  colour: string
  heading: Heading
  finial: Finial
  hardware: string
  variant: string
  panelW: number
  outerL: number
  outerR: number
  centre: number
  top: number
  hem: number
  pleats: number
  panelStyle: (anchor: number) => CSSProperties
}) {
  const railY = 70
  const showPanels = variant !== 'rail'
  const isEyelet = heading === 'eyelet'

  // Eyelet fabric starts above the pole so the holes sit inside cloth. Every
  // other heading hangs from below the track.
  const eyeletY = railY + 3.5
  const fabricTop = isEyelet ? eyeletY - 15 : top

  const eyeletCentres = (x0: number) =>
    Array.from({ length: pleats }, (_, i) => x0 + (i + 0.5) * (panelW / pleats))

  const panels = [
    {
      x0: outerL,
      anchor: outerL,
      shadeId: id.left,
      maskId: `mL-${id.fabric}`,
      d: panelPath(outerL, panelW, fabricTop, hem, heading),
    },
    {
      x0: centre - 6,
      anchor: outerR,
      shadeId: id.right,
      maskId: `mR-${id.fabric}`,
      d: panelPath(centre - 6, panelW, fabricTop, hem, heading),
    },
  ]

  return (
    <>
      {/* Reveal and glass */}
      <rect x="96" y="92" width="288" height="392" rx="2" fill="#c9bfae" />
      <rect x="104" y="100" width="272" height="376" fill={`url(#${id.daySky})`} />
      <rect
        x="104"
        y="100"
        width="272"
        height="376"
        fill={`url(#${id.nightSky})`}
        data-night="in"
      />

      {/* Daytime view */}
      <g data-night="out">
        <path d="M104 404 q38 -44 78 -10 q32 28 70 4 q38 -24 124 12 v66 H104 Z" fill="#9fb597" opacity="0.8" />
        <rect x="104" y="440" width="272" height="36" fill="#8ca285" opacity="0.55" />
        <circle cx="312" cy="158" r="24" fill="#ffffff" opacity="0.45" />
        <ellipse cx="180" cy="146" rx="34" ry="12" fill="#ffffff" opacity="0.55" />
      </g>

      {/* Night view */}
      <g data-night="in">
        <circle cx="312" cy="156" r="17" fill="#f6f2e2" opacity="0.9" />
        <circle cx="312" cy="156" r="30" fill="#f6f2e2" opacity="0.12" />
        {[
          [148, 190],
          [206, 146],
          [258, 224],
          [340, 250],
          [178, 268],
        ].map(([cx2, cy2], i) => (
          <circle key={i} cx={cx2} cy={cy2} r={i % 2 ? 1.1 : 1.6} fill="#fff" opacity="0.7" />
        ))}
        <rect x="104" y="430" width="272" height="46" fill="#0a1120" opacity="0.6" />
        {[130, 168, 214, 268, 326].map((x, i) => (
          <rect key={x} x={x} y={438 + (i % 2) * 6} width="3" height="4" fill="#ffd89b" opacity="0.8" />
        ))}
      </g>

      <rect x="236" y="100" width="7" height="376" fill="#bdb2a0" />
      <rect x="104" y="284" width="272" height="7" fill="#bdb2a0" />
      <rect x="88" y="476" width="304" height="12" rx="2" fill="#e0d7c8" />

      {/* Sheer inner layer, behind the main curtains */}
      {showPanels && variant !== 'canopy' && (
        <rect
          x="108"
          y={top}
          width="264"
          height={hem - top}
          fill={variant === 'sheer' ? `url(#${id.fabric})` : '#ffffff'}
          opacity={variant === 'sheer' ? 0.68 : 0.48}
        />
      )}

      {/* Track or pole */}
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

      {showPanels && (
        <>
          {/*
            Eyelets are threaded, not drawn on top. The fabric rises above the
            pole and has real holes punched through it, so the pole shows in
            each hole and is covered by cloth between them, which is how an
            eyelet curtain actually hangs. The grommet ring then trims the hole.
          */}
          {isEyelet && (
            <defs>
              {panels.map((p) => (
                <mask key={p.x0} id={p.maskId} maskUnits="userSpaceOnUse">
                  <rect x={p.x0 - 4} y={fabricTop - 8} width={panelW + 8} height={hem + 40} fill="#fff" />
                  {eyeletCentres(p.x0).map((cx2, i) => (
                    <circle key={i} cx={cx2} cy={eyeletY} r="6.6" fill="#000" />
                  ))}
                </mask>
              ))}
            </defs>
          )}

          {panels.map((p) => (
            <g key={p.x0} data-panel style={panelStyle(p.anchor)}>
              <g mask={isEyelet ? `url(#${p.maskId})` : undefined}>
                <Fabric d={p.d} fabricId={id.fabric} shadeId={p.shadeId} />
              </g>

              {/* Heading tape shadow belongs to a gathered tape, not an eyelet. */}
              {!isEyelet && (
                <rect x={p.x0} y={fabricTop} width={panelW} height="12" fill="#000" opacity="0.13" />
              )}

              {isEyelet &&
                eyeletCentres(p.x0).map((cx2, i) => (
                  <g key={i}>
                    {/* Shadow the cloth drops where it pinches at the ring. */}
                    <ellipse cx={cx2} cy={eyeletY + 12} rx="7" ry="10" fill="#000" opacity="0.1" />
                    <circle
                      cx={cx2}
                      cy={eyeletY}
                      r="6.6"
                      fill="none"
                      stroke={shade(hardware, 46)}
                      strokeWidth="2.8"
                    />
                    <circle
                      cx={cx2}
                      cy={eyeletY}
                      r="6.6"
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity="0.35"
                      strokeWidth="1"
                    />
                  </g>
                ))}
            </g>
          ))}
        </>
      )}

      <Plant />
      <SideTable />
      <SofaBack colour={colour} fabricId={id.fabric} />
    </>
  )
}

/** Hotel linen and canopies: a made-up bed. */
/**
 * Hotel linen and canopies: a bed seen from the foot, in perspective.
 *
 * A flat elevation made the duvet read as a rectangle of cloth on a wall, so
 * the mattress is built as a trapezoid receding to the headboard and the duvet
 * drapes over its front and sides. The fabric surfaces are the duvet, the
 * pillows and the valance, which is exactly what a linen set contains.
 */
function BedScene({ id, variant }: { id: Ids; variant: string }) {
  // Perspective plate. Back edge is narrower and higher; front edge is wider
  // and lower, which is what sells the depth.
  const backL = 148
  const backR = 332
  const frontL = 74
  const frontR = 406
  const backY = 322
  const frontY = 508

  const mattress = `M${backL} ${backY} H${backR} L${frontR} ${frontY} H${frontL} Z`
  // The duvet starts below the turned-back sheet and runs to the foot.
  const duvetTop = 356
  const dBackL = backL - 10
  const dBackR = backR + 10
  const duvet = `M${dBackL} ${duvetTop} H${dBackR} L${frontR + 8} ${frontY} H${frontL - 8} Z`
  // Skirt hanging off the front edge, and down each side.
  const skirt = `M${frontL - 8} ${frontY} H${frontR + 8} L${frontR + 2} ${frontY + 54} H${frontL - 2} Z`

  return (
    <>
      {/* Wall art, centred over the headboard */}
      <rect x="186" y="58" width="108" height="82" rx="3" fill="#e5dccd" />
      <rect x="194" y="66" width="92" height="66" fill="#c3cfc0" />
      <circle cx="240" cy="94" r="14" fill="#e8dcc0" opacity="0.85" />

      <g data-bed style={{ transformBox: 'view-box', transformOrigin: '240px 520px' }}>
        {/* Headboard, buttoned and set behind the pillows */}
        <path d="M138 174 q0 -22 22 -22 h160 q22 0 22 22 v152 H138 Z" fill="#7d6349" />
        <path d="M150 186 q0 -12 12 -12 h156 q12 0 12 12 v134 H150 Z" fill="#95795c" />
        {[178, 214, 250, 286].map((x) => (
          <rect key={x} x={x} y="188" width="2" height="126" fill="#7d6349" opacity="0.55" />
        ))}

        {/* Mattress base, seen edge on under the linen */}
        <path d={mattress} fill="#f2ece1" />
        <path d={`M${frontL} ${frontY} H${frontR} v18 q-166 14 -332 0 Z`} fill="#e3dacb" />

        {/* Pillows, angled as they would actually sit */}
        {[
          { x: 152, r: -4 },
          { x: 248, r: 4 },
        ].map((pl) => (
          <g key={pl.x} transform={`rotate(${pl.r} ${pl.x + 40} 300)`}>
            <rect x={pl.x} y="262" width="80" height="56" rx="20" fill={`url(#${id.fabric})`} />
            <rect
              x={pl.x}
              y="262"
              width="80"
              height="56"
              rx="20"
              fill={`url(#${id.soft})`}
              style={{ mixBlendMode: 'multiply' }}
            />
            <path
              d={`M${pl.x + 12} 312 q28 -10 56 0`}
              fill="none"
              stroke="#000"
              strokeOpacity="0.12"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* Turned-back top sheet at the head of the bed */}
        <path d={`M${dBackL} ${duvetTop - 18} H${dBackR} l4 20 H${dBackL - 4} Z`} fill="#ffffff" opacity="0.75" />

        {/* Duvet: the main fabric surface, draping over the mattress */}
        <Fabric d={duvet} fabricId={id.fabric} shadeId={id.soft} />
        {/* Creases running down the fall of the duvet */}
        {[0.3, 0.5, 0.7].map((f) => (
          <path
            key={f}
            d={`M${dBackL + (dBackR - dBackL) * f} ${duvetTop} L${
              frontL - 8 + (frontR - frontL + 16) * f
            } ${frontY}`}
            stroke="#000"
            strokeOpacity="0.08"
            strokeWidth="3"
            fill="none"
          />
        ))}

        {/* Skirt over the foot of the bed */}
        <path d={skirt} fill={`url(#${id.fabric})`} />
        <path d={skirt} fill={`url(#${id.soft})`} style={{ mixBlendMode: 'multiply' }} />
        <path d={skirt} fill="#000" opacity="0.08" />

        {/* Feet */}
        <rect x="80" y={frontY + 52} width="16" height="26" rx="4" fill="#6d5842" />
        <rect x="386" y={frontY + 52} width="16" height="26" rx="4" fill="#6d5842" />

        {/* Four-poster frame, with the canopy draped over the top rails */}
        {variant === 'canopy' && (
          <>
            {[
              { x: 132, y: 150, h: 190 },
              { x: 338, y: 150, h: 190 },
              { x: 66, y: 120, h: 400 },
              { x: 406, y: 120, h: 400 },
            ].map((post) => (
              <rect key={post.x} x={post.x} y={post.y} width="9" height={post.h} rx="3" fill="#5f4b36" />
            ))}
            <rect x="62" y="112" width="352" height="10" rx="4" fill="#5f4b36" />
            <path
              d="M66 122 q174 34 344 0 v54 q-172 30 -344 0 Z"
              fill={`url(#${id.fabric})`}
              opacity="0.85"
            />
            <path
              d="M66 176 q10 150 4 300 h-14 q-8 -160 -2 -300 Z"
              fill={`url(#${id.fabric})`}
              opacity="0.5"
            />
            <path
              d="M414 176 q-10 150 -4 300 h14 q8 -160 2 -300 Z"
              fill={`url(#${id.fabric})`}
              opacity="0.5"
            />
          </>
        )}
      </g>

      {/* Nightstands and lamps, outside the bed group so they hold their place */}
      {[
        { x: 36, lamp: 62 },
        { x: 404, lamp: 430 },
      ].map((n) => (
        <g key={n.x}>
          <rect x={n.x} y="446" width="72" height="62" rx="6" fill="#8a6444" />
          <rect x={n.x + 8} y="462" width="56" height="20" rx="4" fill="#9c7752" />
          <rect x={n.x + 6} y="508" width="10" height="22" fill="#6d5842" />
          <rect x={n.x + 56} y="508" width="10" height="22" fill="#6d5842" />
          <rect x={n.lamp - 3} y="410" width="8" height="38" fill="#b4a894" />
          <path d={`M${n.lamp - 22} 412 h44 l-9 -38 h-26 Z`} fill="#e8dcc6" data-night="out" />
          <path d={`M${n.lamp - 22} 412 h44 l-9 -38 h-26 Z`} fill="#f7e6bd" data-night="in" />
        </g>
      ))}

      <ellipse cx="240" cy="574" rx="210" ry="18" fill="#000" opacity="0.09" />
    </>
  )
}


/** Cushion covers: on a sofa, at the scale you would actually see them. */
function SofaScene({ id, colour }: { id: Ids; colour: string }) {
  return (
    <>
      <rect x="150" y="60" width="180" height="120" rx="3" fill="#e5dccd" />
      <rect x="160" y="70" width="160" height="100" fill="#cbd6c8" />

      {/* Sofa body */}
      <rect x="48" y="250" width="384" height="140" rx="22" fill="#8d9187" />
      <rect x="48" y="360" width="384" height="120" rx="18" fill="#7e8279" />
      <rect x="66" y="372" width="170" height="92" rx="14" fill="#9ba095" />
      <rect x="244" y="372" width="170" height="92" rx="14" fill="#9ba095" />
      {/* Arms */}
      <rect x="30" y="300" width="46" height="190" rx="20" fill="#82867d" />
      <rect x="404" y="300" width="46" height="190" rx="20" fill="#82867d" />
      {/* Feet */}
      <rect x="70" y="482" width="16" height="26" rx="4" fill="#6d5842" />
      <rect x="394" y="482" width="16" height="26" rx="4" fill="#6d5842" />

      {/* The cushions themselves: the product, in its real place and scale. */}
      {[
        { x: 84, y: 272, s: 104, r: -6 },
        { x: 196, y: 262, s: 116, r: 3 },
        { x: 314, y: 276, s: 96, r: 8 },
      ].map((c) => (
        <g key={c.x} transform={`rotate(${c.r} ${c.x + c.s / 2} ${c.y + c.s / 2})`}>
          <rect x={c.x} y={c.y} width={c.s} height={c.s} rx="14" fill={`url(#${id.fabric})`} />
          <rect
            x={c.x}
            y={c.y}
            width={c.s}
            height={c.s}
            rx="14"
            fill={`url(#${id.soft})`}
            style={{ mixBlendMode: 'multiply' }}
          />
          {/* Piped edge, the detail the product copy sells on. */}
          <rect
            x={c.x}
            y={c.y}
            width={c.s}
            height={c.s}
            rx="14"
            fill="none"
            stroke={shade(colour, -34)}
            strokeWidth="2"
            opacity="0.5"
          />
        </g>
      ))}

      <Plant />
      <ellipse cx="240" cy="522" rx="200" ry="22" fill="#000" opacity="0.09" />
    </>
  )
}

/** Towels and ceramics: on a rail in a bathroom. */
function BathScene({ id, colour }: { id: Ids; colour: string }) {
  return (
    <>
      {/* Tiled wall */}
      <rect y="17" width="480" height="330" fill="#e8eae7" />
      {Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 60 + (row % 2 ? -30 : 0)}
            y={17 + row * 48}
            width="58"
            height="46"
            fill="#f1f3f0"
            stroke="#dfe3de"
            strokeWidth="1.5"
          />
        )),
      )}

      {/* Basin */}
      <rect x="150" y="352" width="180" height="16" rx="4" fill="#f6f6f4" />
      <path d="M172 368 h136 l-16 54 h-104 Z" fill="#fbfbfa" />
      <rect x="236" y="316" width="8" height="36" fill="#b9bcbb" />
      <rect x="222" y="310" width="36" height="8" rx="4" fill="#b9bcbb" />

      {/* Towel rail with the product hanging on it */}
      <rect x="72" y="196" width="10" height="10" rx="3" fill="#b9bcbb" />
      <rect x="398" y="196" width="10" height="10" rx="3" fill="#b9bcbb" />
      <rect x="72" y="198" width="336" height="7" rx="3.5" fill="#c6c9c8" />

      {[
        { x: 92, w: 104, h: 190 },
        { x: 214, w: 104, h: 214 },
        { x: 330, w: 74, h: 150 },
      ].map((t) => {
        const d = `M${t.x} 202 h${t.w} v${t.h} q-${t.w / 2} 14 -${t.w} 0 Z`
        return (
          <g key={t.x}>
            <Fabric d={d} fabricId={id.fabric} shadeId={id.soft} />
            {/* Folded-over top, so it reads as hung rather than painted on. */}
            <rect x={t.x} y="196" width={t.w} height="22" rx="6" fill={`url(#${id.fabric})`} />
            <rect x={t.x} y="196" width={t.w} height="22" rx="6" fill="#000" opacity="0.12" />
          </g>
        )
      })}

      {/* Ceramic set on the basin ledge */}
      <g>
        <rect x="158" y="330" width="20" height="24" rx="5" fill={shade(colour, 30)} />
        <rect x="163" y="322" width="10" height="10" rx="3" fill="#b9bcbb" />
        <rect x="186" y="336" width="18" height="18" rx="4" fill={shade(colour, 10)} />
        <ellipse cx="306" cy="348" rx="18" ry="6" fill={shade(colour, 18)} />
      </g>

      <ellipse cx="240" cy="516" rx="180" ry="18" fill="#000" opacity="0.08" />
    </>
  )
}

/** Table mats and household pieces: laid on a dining table. */
function DiningScene({ id, colour }: { id: Ids; colour: string }) {
  return (
    <>
      <rect x="150" y="52" width="180" height="110" rx="3" fill="#e5dccd" />
      <rect x="160" y="62" width="160" height="90" fill="#d3c6ae" />
      {/* Pendant light */}
      <rect x="238" y="0" width="4" height="60" fill="#5c5c5c" />
      <path d="M206 108 h68 l-16 -48 h-36 Z" fill="#3f4a44" />

      {/* Table top in perspective */}
      <path d="M46 300 h388 l40 128 H6 Z" fill="#a97c50" />
      <path d="M46 300 h388 l6 20 H40 Z" fill="#c39764" />
      <rect x="86" y="428" width="18" height="82" fill="#8a6440" />
      <rect x="376" y="428" width="18" height="82" fill="#8a6440" />

      {/* Mats and a runner, laid out as they would be at a setting. */}
      <path d="M118 336 h108 l14 46 h-136 Z" fill={`url(#${id.fabric})`} />
      <path
        d="M118 336 h108 l14 46 h-136 Z"
        fill={`url(#${id.soft})`}
        style={{ mixBlendMode: 'multiply' }}
      />
      <path d="M262 336 h108 l14 46 h-136 Z" fill={`url(#${id.fabric})`} />
      <path
        d="M262 336 h108 l14 46 h-136 Z"
        fill={`url(#${id.soft})`}
        style={{ mixBlendMode: 'multiply' }}
      />
      <path d="M60 392 h360 l12 30 H50 Z" fill={`url(#${id.fabric})`} opacity="0.92" />

      {/* Place settings, for scale */}
      {[172, 316].map((cx2) => (
        <g key={cx2}>
          <ellipse cx={cx2} cy="358" rx="34" ry="13" fill="#fbfaf7" />
          <ellipse cx={cx2} cy="358" rx="22" ry="8" fill="#f0ede6" />
        </g>
      ))}
      <ellipse cx="240" cy="410" rx="26" ry="10" fill={shade(colour, 22)} />

      <ellipse cx="240" cy="546" rx="200" ry="20" fill="#000" opacity="0.08" />
    </>
  )
}

/* --------------------------------------------------------------- furniture */

function Plant() {
  return (
    <g>
      <path d="M34 560 h44 l-6 -46 h-32 Z" fill="#a9683f" />
      <path d="M34 514 h44 v7 h-44 Z" fill="#bd7748" />
      {[
        'M56 514 q-26 -34 -6 -66 q14 26 6 66',
        'M56 514 q26 -30 10 -60 q-16 24 -10 60',
        'M56 514 q-34 -18 -34 -46 q26 12 34 46',
        'M56 514 q32 -14 38 -40 q-26 8 -38 40',
      ].map((d, i) => (
        <path key={i} d={d} fill="#4d7150" />
      ))}
    </g>
  )
}

function SideTable() {
  return (
    <g>
      <ellipse cx="424" cy="524" rx="42" ry="9" fill="#8a6444" />
      <rect x="420" y="524" width="8" height="34" fill="#8a6444" />
      <ellipse cx="424" cy="558" rx="26" ry="7" fill="#7a583c" />
      <path d="M406 512 h36 l-7 -34 h-22 Z" fill="#e8dcc6" />
    </g>
  )
}

function SofaBack({ colour, fabricId }: { colour: string; fabricId: string }) {
  return (
    <g>
      <rect x="96" y="546" width="248" height="54" rx="14" fill="#8d9187" />
      <rect x="112" y="558" width="100" height="42" rx="10" fill="#9ba095" />
      <rect x="228" y="558" width="100" height="42" rx="10" fill="#9ba095" />
      {/* Cushions pick up the curtain fabric, which is how a room is dressed. */}
      <rect x="130" y="556" width="40" height="40" rx="8" fill={`url(#${fabricId})`} />
      <rect x="268" y="556" width="40" height="40" rx="8" fill={`url(#${fabricId})`} opacity="0.8" />
      <rect x="130" y="556" width="40" height="40" rx="8" fill="none" stroke={shade(colour, -30)} strokeWidth="1.5" opacity="0.4" />
    </g>
  )
}
