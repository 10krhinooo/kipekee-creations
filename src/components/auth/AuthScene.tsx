import { useEffect, useRef, type ReactNode } from 'react'
import { animate, stagger, utils } from 'animejs'
import { CurtainCloth } from '../Curtains'
import { GATHERED, reducedMotion } from '../../lib/motion'

/**
 * The staging every auth screen sits on: a brass rail across the top with the
 * cloth gathered at either wall, and daylight coming through between them.
 *
 * The curtains are scenery here, not a transition. They are seeded straight to
 * their gathered width and stay there for as long as the screen is up - the
 * rail never leaves the viewport and the cloth never leaves the edges. That is
 * the whole idea: the auth screens are the one place in the app you are looking
 * *at* the window rather than through it.
 *
 * Because of that, auth routes are exempt from `PageCurtain` (see the list in
 * that file). A transition curtain drawing across a screen that is already
 * curtains reads as the same fabric twice at two different scales, which is
 * what it looked like when both were on at once.
 *
 * React owns the shape; anime owns `transform` on `[data-curtain]` and
 * `opacity` on `[data-glow]`, exactly as in `RoomPreview`.
 */
export function AuthScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scope.current
    if (!el) return

    // Set, not tweened. There is no reveal to play: the curtains are already
    // open when you arrive and stay that way.
    utils.set(el.querySelectorAll('[data-curtain]'), { scaleX: GATHERED })
    utils.set(el.querySelectorAll('[data-glow]'), { opacity: 1 })

    if (reducedMotion()) return

    // Only the card settles in, so the screen arrives rather than snapping.
    animate(el.querySelectorAll('[data-field]'), {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 420,
      delay: stagger(50, { start: 60 }),
      ease: 'outCubic',
    })
  }, [])

  return (
    <div ref={scope} className="relative min-h-screen overflow-hidden bg-ink">
      {/* Fixed rather than absolute, so the rail and the gathered cloth stay in
          the viewport on a long form instead of scrolling away and leaving the
          card on a bare dark field. */}
      <div className="pointer-events-none fixed inset-0">
        {/* One cloth at every width. The rail used to be dropped below `sm`,
            because the SVG stretched its rings into smudges on a screen taller
            than it is wide, and that left `PageCurtain` drawing a rail on
            arrival that the staging underneath did not have: on a phone the
            handoff flickered. `CurtainCloth` now draws the rail at a fixed
            pixel size, so there is nothing to hide from. */}
        <CurtainCloth className="absolute inset-0 h-full w-full" />
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-center p-4 py-10 sm:p-8">
        <div data-field className="w-full max-w-[430px]">
          {children}
        </div>
      </div>
    </div>
  )
}
