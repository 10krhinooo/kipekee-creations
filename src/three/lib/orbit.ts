import { useCallback, useMemo, useRef } from 'react'

/**
 * Drag-to-look for the product vignette.
 *
 * The camera state lives in a ref that a pointer handler writes and `useFrame`
 * reads. Nothing here ever calls `setState`: a drag produces sixty updates a
 * second, and re-rendering the React tree on each one would make the smoothest
 * possible input feel like the jankiest.
 *
 * Pointer input is taken from a plain overlay div in the page, not from the
 * canvas. r3f's own event system would need `eventSource` pointed at the shell,
 * and passing that as a ref stops r3f initialising at all: the canvas stays at
 * its default 300x150, no children mount, and nothing is logged. A transparent
 * div over the view sidesteps that entirely and is also what lets each preview
 * own its own drag while sharing one canvas.
 */
export interface OrbitState {
  /** Where the camera is now. Damped towards the target every frame. */
  yaw: number
  pitch: number
  /** Where the drag has asked it to go. */
  toYaw: number
  toPitch: number
}

/**
 * How far a visitor may swing round.
 *
 * Deliberately narrow. This is a vignette of one wall, not a room: past about
 * 30 degrees the camera clears the edge of the back wall and the illusion is
 * over. Clamping is also what stops a client ending up inside the geometry and
 * concluding the site is broken.
 */
export const YAW_LIMIT = 0.52
export const PITCH_LIMIT = 0.2

/** Radians per pixel dragged. Tuned so a full swing is a comfortable hand movement. */
const YAW_PER_PX = 0.006
const PITCH_PER_PX = 0.004

const clamp = (v: number, limit: number) => (v < -limit ? -limit : v > limit ? limit : v)

export function useOrbitDrag(invalidate: () => void) {
  const state = useRef<OrbitState>({ yaw: 0, pitch: 0, toYaw: 0, toPitch: 0 })
  const last = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // Only a primary drag. A right-click or a two-finger gesture belongs to the
    // browser, and stealing it costs the visitor their context menu and scroll.
    if (event.button !== 0) return
    last.current = { x: event.clientX, y: event.clientY }
    invalidate()
    // Capture, so a drag that leaves the preview still tracks and still ends.
    // Without it, releasing outside leaves the view stuck mid-swing.
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [invalidate])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const from = last.current
    if (!from) return
    last.current = { x: event.clientX, y: event.clientY }
    const s = state.current
    // Dragging right looks right, which means swinging the camera left.
    s.toYaw = clamp(s.toYaw - (event.clientX - from.x) * YAW_PER_PX, YAW_LIMIT)
    s.toPitch = clamp(s.toPitch + (event.clientY - from.y) * PITCH_PER_PX, PITCH_LIMIT)
    invalidate()
  }, [invalidate])

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    last.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    invalidate()
  }, [invalidate])

  const handlers = useMemo(
    () => ({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }),
    [onPointerDown, onPointerMove, onPointerUp],
  )

  return { state, handlers }
}
