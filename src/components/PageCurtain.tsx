import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { CURTAIN_EASE_CSS, GATHERED, OUT_EASE_CSS, reducedMotion } from '../lib/motion'
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

/**
 * How wide a panel is, as a transform.
 *
 * `scaleX` and not a width, so the browser can hand the whole tween to the
 * compositor. `transform` rather than the standalone `scale` property because
 * `AuthScene` seeds the same panels through anime's `utils.set`, which writes
 * `transform` - two spellings on one element would multiply.
 */
const width = (x: number) => `scaleX(${x})`
const travel = (from: number, to: number) => [{ transform: width(from) }, { transform: width(to) }]

type Phase = 'hidden' | 'closing' | 'opening'

/**
 * Areas whose internal navigation is not a page change.
 *
 * Moving between the tabs of the account area, or the sidebar of the workshop
 * console, is sub-navigation within one screen: the chrome stays put and only
 * the panel changes. Drawing a full curtain over that is heavier than the thing
 * it is covering, and it makes a console somebody works in all day feel slow.
 *
 * Only applies when both ends are inside the same area. Arriving from the shop
 * or leaving for it is a real change and still gets the curtain.
 */
const SECTIONS = ['/account', '/admin']

const sectionOf = (pathname: string) =>
  SECTIONS.find((section) => pathname === section || pathname.startsWith(`${section}/`)) ?? null

/**
 * The auth screens, which the curtain does not get out of the way for.
 *
 * `AuthScene` is a window with the curtains drawn back and the rail across the
 * top, held in the viewport for as long as the screen is up. So arriving there
 * does not end with the cloth leaving: it ends with the cloth coming to rest at
 * exactly the position the staging holds it, `GATHERED`, with the same rail
 * above it. The overlay then fades against an identical curtain underneath,
 * which makes the handoff invisible - one curtain that opened and stayed, with
 * the page appearing from behind it.
 *
 * This is why the two must agree: change `GATHERED` here and the staging moves
 * with it, but give the overlay a rail the staging does not have (or vice
 * versa) and the swap becomes a visible flicker.
 */
const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/accept-invite',
  '/no-access',
])

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

  // Every real page change gets the curtain, auth screens included. They used
  // to be exempt because they drew their own reveal; that reveal is gone
  // precisely so there is one transition in the app rather than two that can
  // disagree. Motion nobody asked for is still skipped, and so is moving around
  // inside an area where nothing but a panel is changing.
  // A query-string change is not a page change. The shop keeps its filters and
  // sorting in the URL precisely so a filtered view is shareable and the back
  // button works, which means ticking a category pushes a new history entry on
  // the same path. Curtaining that would put a full transition between "9
  // products" and "3 products".
  const samePath = location.pathname === shown.pathname

  const withinSection =
    sectionOf(location.pathname) !== null &&
    sectionOf(location.pathname) === sectionOf(shown.pathname)
  const skip = reducedMotion() || samePath || withinSection

  // Where the panels come to rest, and whether a rail comes with them. Read off
  // `shown` rather than `location` because by the time the open runs, `shown`
  // has already advanced to the destination - which is exactly the screen the
  // resting position has to match.
  const restingOnAuth = AUTH_PATHS.has(shown.pathname)

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

    const panels = Array.from(el.querySelectorAll<HTMLElement>('[data-curtain]'))
    const closing = phase === 'closing'
    // Motion nobody asked for is skipped rather than played fast. `skip` above
    // only covers navigations; the first load opens on the site without one,
    // and used to play the full 760ms open regardless of the preference.
    const still = reducedMotion()
    const from = closing ? OPEN_REST : 1
    const to = closing ? 1 : restingOnAuth ? GATHERED : OPEN_REST

    // Seed the starting state with no tween, so each leg travels its full
    // distance instead of snapping to the destination first.
    el.style.opacity = '1'
    panels.forEach((p) => (p.style.transform = width(from)))

    // Every tween here is a Web Animation rather than a per-frame style write,
    // and that is a performance decision, not a style one. The panels are half
    // the viewport each, filled with a repeating weave under three gradients.
    // Driving `transform` from JavaScript made the compositor re-rasterise both
    // of them on every frame: traced across one page change that was 1141
    // raster tasks and 605ms of raster work. Declared as an animation the
    // browser owns, the same travel costs 8 tasks and 8ms, because a
    // transform-only animation on a promoted layer never repaints.
    let live = true
    const running: Animation[] = []
    const run = (node: Element, frames: Keyframe[], ms: number, easing: string) => {
      const a = node.animate(frames, { duration: still ? 0 : ms, easing, fill: 'forwards' })
      running.push(a)
      return a.finished
    }

    // `fill: 'forwards'` holds the end state only while the animation lives, so
    // each leg is committed to inline style and released. That also means an
    // interrupted leg can be committed where it stands (see the cleanup) rather
    // than snapping back to where it started.
    const land = (a: Animation) => {
      try {
        a.commitStyles()
      } catch {
        // Only throws if the element has left the document, in which case
        // there is nothing to hold in place.
      }
      a.cancel()
    }

    Promise.all(panels.map((p) => run(p, travel(from, to), closing ? CLOSE_MS : OPEN_MS, CURTAIN_EASE_CSS)))
      .then(() => {
        if (!live) return
        running.forEach(land)
        running.length = 0

        if (closing) {
          // The whole point of the delay: the new page mounts here, out of
          // sight, and the scroll jump that comes with it goes unseen too.
          setShown(target.current)
          window.scrollTo(0, 0)

          // The open waits for that mount to be painted before it starts.
          // Starting it in the same commit meant the first frames of the tween
          // were competing with React building the destination - and the
          // heavier the destination, the worse it looked. Signing out of the
          // console was the clearest case: the whole admin tree unmounts and an
          // auth screen with two full curtains mounts, and the cloth visibly
          // stuttered on the way back. Two frames of a shut curtain sitting
          // still is invisible; a stutter mid-travel is not.
          requestAnimationFrame(() => requestAnimationFrame(() => setPhase('opening')))
          return
        }

        // Only once the cloth has finished travelling. Fading it during the
        // open makes it look like it is evaporating halfway across the screen
        // instead of being drawn back and then getting out of the way.
        //
        // On an auth screen the fade is a handoff rather than a disappearance:
        // an identical curtain sits underneath at the same width, so what is
        // left behind is the staging, not bare page.
        return run(el, [{ opacity: 1 }, { opacity: 0 }], FADE_MS, OUT_EASE_CSS).then(() => {
          if (!live) return
          running.forEach((a) => a.cancel())
          el.style.opacity = '0'
          // Parked fully open as well as hidden. `display: none` already
          // removes it, but leaving the panels at their resting width means an
          // interrupted cycle can never flash a strip of cloth down each edge
          // before the next close seeds them.
          panels.forEach((p) => (p.style.transform = width(0)))
          setPhase('hidden')
        })
      })
      // A cancelled leg is somebody navigating again, not a failure.
      .catch(() => {})

    return () => {
      live = false
      running.forEach(land)
    }
    // `restingOnAuth` belongs here: it changes in the same commit as the phase
    // that reads it, when `shown` advances to the destination, so React batches
    // them into one run rather than animating to the wrong resting position.
  }, [phase, restingOnAuth])

  return (
    <>
      {children(shown)}
      <div
        ref={scope}
        // Never interactive, at any point in the cycle. A wipe that swallowed a
        // click would make the site feel broken in a way that is very hard to
        // reproduce on purpose.
        className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
        // React owns `display` here and the effect above owns `opacity`, and
        // the two must not overlap. Setting `opacity` in this style object as
        // well meant every re-render rewrote it to 0 mid-tween, which left the
        // cloth stranded part-way across the screen. `display: none` while
        // hidden is what keeps the overlay from showing before the effect
        // seeds it.
        style={{ display: phase === 'hidden' ? 'none' : 'block' }}
        aria-hidden
      >
        {/* The rail comes along only when the cloth is going to stay, so it
            lands on the one the staging already draws instead of appearing and
            then vanishing. No glow: the staging underneath owns the daylight,
            and a second gradient over the card would wash it out. */}
        <CurtainCloth className="h-full w-full" glow={false} rail={restingOnAuth} />
      </div>
    </>
  )
}
