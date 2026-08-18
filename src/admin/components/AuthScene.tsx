import { useEffect, useRef, type ReactNode } from 'react'
import { animate, stagger, utils } from 'animejs'
import { CurtainCloth } from '../../components/Curtains'
import { CURTAIN_EASE, CURTAIN_MS, GATHERED, LIGHT_EASE, LIGHT_MS, reducedMotion } from '../../lib/motion'

/**
 * The staging shared by every staff auth screen.
 *
 * A generic centred card would have done the job, but this business sells
 * drapery, and the storefront already teaches a visitor what a Kipekee curtain
 * looks like when it opens. Reusing that same language here - the same cloth,
 * the same `CURTAIN_MS`/`GATHERED` constants the visualiser tunes - makes the
 * staff door feel like part of the same product rather than a bolted-on admin
 * tool.
 *
 * Ownership follows `RoomPreview`'s contract exactly: React owns the shape of
 * the scene, anime.js owns `transform` on `[data-curtain]` and `opacity` on
 * `[data-glow]`. React must never write those properties or a re-render will
 * fight a tween mid-flight.
 */

/** The reveal runs once on mount; `closing` draws the cloth back over. */
export type SceneState = 'opening' | 'closing'

export function AuthScene({
  children,
  state = 'opening',
  onClosed,
}: {
  children: ReactNode
  state?: SceneState
  onClosed?: () => void
}) {
  const scope = useRef<HTMLDivElement>(null)

  // First paint lands closed with no tween, so the reveal below always has the
  // full distance to travel instead of snapping open before it starts.
  useEffect(() => {
    const el = scope.current
    if (!el) return
    utils.set(el.querySelectorAll('[data-curtain]'), { scaleX: 1 })
    utils.set(el.querySelectorAll('[data-glow]'), { opacity: 0 })
  }, [])

  useEffect(() => {
    const el = scope.current
    if (!el) return
    const still = reducedMotion()
    const opening = state === 'opening'

    animate(el.querySelectorAll('[data-curtain]'), {
      scaleX: opening ? GATHERED : 1,
      duration: still ? 0 : CURTAIN_MS,
      ease: CURTAIN_EASE,
      // Whatever comes after a close - a redirect, usually - waits for the
      // cloth to actually land rather than firing over a moving curtain.
      onComplete: () => {
        if (!opening) onClosed?.()
      },
    })

    // Light changes slower than fabric moves, which is what makes it read as
    // light rather than as a second curtain.
    animate(el.querySelectorAll('[data-glow]'), {
      opacity: opening ? 1 : 0,
      duration: still ? 0 : LIGHT_MS,
      ease: LIGHT_EASE,
    })

    animate(el.querySelectorAll('[data-card]'), {
      opacity: opening ? [0, 1] : 0,
      translateY: opening ? [18, 0] : 10,
      duration: still ? 0 : 520,
      delay: still || !opening ? 0 : 260,
      ease: 'outCubic',
    })

    if (opening && !still) {
      animate(el.querySelectorAll('[data-field]'), {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 380,
        delay: stagger(55, { start: 380 }),
        ease: 'outCubic',
      })
    }
  }, [state, onClosed])

  return (
    <div ref={scope} className="fixed inset-0 z-50 overflow-hidden bg-ink">
      {/* The rail is hidden on narrow screens: `preserveAspectRatio="none"`
          squashes its rings into smudges once the viewport is taller than it is
          wide, and a phone is always taller than it is wide. */}
      <CurtainCloth className="absolute inset-0 hidden h-full w-full sm:block" />
      <CurtainCloth className="absolute inset-0 h-full w-full sm:hidden" rail={false} />

      <div className="relative flex h-full w-full items-center justify-center overflow-y-auto p-4 py-8 sm:p-8">
        <div data-card className="w-full max-w-[430px]">{children}</div>
      </div>
    </div>
  )
}
