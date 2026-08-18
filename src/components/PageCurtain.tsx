import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { animate, utils } from 'animejs'
import { CURTAIN_EASE, reducedMotion } from '../lib/motion'
import { CurtainCloth } from './Curtains'

/**
 * The curtain that covers a page change.
 *
 * Slower than a functional wipe needs to be, and that is the point: the cloth
 * has to read as cloth being drawn, and under about half a second it reads as a
 * flicker instead. Still shorter than the visualiser's `CURTAIN_MS`, which is a
 * product demo meant to be watched, where this one is in the way of wherever
 * somebody was going. These two numbers are the tempo dial - the shape of the
 * thing does not change if they move.
 */
const CLOSE_MS = 520
const OPEN_MS = 760
/** How long the gathered cloth takes to dissolve once it has finished travelling. */
const FADE_MS = 340

/**
 * Where the panels come to rest at the end of the open.
 *
 * Not `0`, and not the visualiser's `GATHERED` either. Zero would mean the
 * cloth shrinks to nothing while still mid-travel, which reads as dissolving
 * rather than opening; `GATHERED` is tuned for a window, where the stack has to
 * stay visibly hung. This is a thin stack at each wall, just enough that the
 * panel is still cloth when it arrives - and then it fades, so nothing is left
 * covering the page.
 */
const OPEN_REST = 0.1

type Phase = 'hidden' | 'closing' | 'opening'

/** The staff auth screens draw their own curtain; a second one would double up. */
const AUTH_PATHS = new Set(['/admin/login', '/admin/forgot-password', '/admin/reset-password'])
const isAuthRoute = (pathname: string) => AUTH_PATHS.has(pathname)

/**
 * Holds the routes back until the cloth is actually shut.
 *
 * This is why it renders its children rather than sitting beside them. React
 * Router commits the new route in the same render as the location change, so an
 * overlay that merely reacts to `useLocation()` starts closing over a page that
 * has *already* been swapped - you see the destination, then a curtain covers
 * it, then reveals the same thing. Keeping a `shown` location one step behind
 * the real one, and advancing it only when the close finishes, means the swap
 * happens where a swap should happen: behind a closed curtain.
 */
export function PageCurtain({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const scope = useRef<HTMLDivElement>(null)

  const [shown, setShown] = useState(location)
  // The first render is a reveal, not a transition: there is no previous page
  // to cover, so the cloth starts closed and simply opens on the site.
  const [phase, setPhase] = useState<Phase>('opening')

  // Read inside the tween's completion callback, which must act on wherever we
  // are by then rather than on the location that was current when it started.
  const target = useRef(location)
  target.current = location

  const stale = location.key !== shown.key

  // Motion nobody asked for, and a transition between two screens that each
  // draw their own curtain, both resolve the same way: swap immediately.
  const skip = reducedMotion() || isAuthRoute(location.pathname) || isAuthRoute(shown.pathname)

  useEffect(() => {
    if (!stale) return
    if (skip) {
      setShown(target.current)
      setPhase('hidden')
      return
    }
    // Interrupting an open with a fresh navigation is normal - somebody clicked
    // twice - and the answer is always to close again from wherever we are.
    if (phase !== 'closing') setPhase('closing')
  }, [stale, skip, phase])

  useEffect(() => {
    const el = scope.current
    if (!el || phase === 'hidden') return

    const panels = el.querySelectorAll('[data-curtain]')
    const closing = phase === 'closing'

    // Seed the starting state with no tween, so each leg travels its full
    // distance instead of snapping to the destination first.
    utils.set(el, { opacity: 1 })
    utils.set(panels, { scaleX: closing ? OPEN_REST : 1 })

    animate(panels, {
      scaleX: closing ? 1 : OPEN_REST,
      duration: closing ? CLOSE_MS : OPEN_MS,
      ease: CURTAIN_EASE,
      onComplete: () => {
        if (closing) {
          // The whole point of the delay: the new page mounts here, out of
          // sight, and the scroll jump that comes with it goes unseen too.
          setShown(target.current)
          window.scrollTo(0, 0)
          setPhase('opening')
          return
        }

        // Only once the cloth has finished travelling. Fading it during the
        // open makes it look like it is evaporating halfway across the screen
        // instead of being drawn back and then getting out of the way.
        animate(el, {
          opacity: 0,
          duration: FADE_MS,
          ease: 'outQuad',
          onComplete: () => setPhase('hidden'),
        })
      },
    })
  }, [phase])

  return (
    <>
      {children(shown)}
      <div
        ref={scope}
        // Never interactive, at any point in the cycle. A wipe that swallowed a
        // click would make the site feel broken in a way that is very hard to
        // reproduce on purpose.
        className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
        style={{ display: phase === 'hidden' ? 'none' : 'block', opacity: 0 }}
        aria-hidden
      >
        <CurtainCloth className="h-full w-full" glow={false} rail={false} />
      </div>
    </>
  )
}
