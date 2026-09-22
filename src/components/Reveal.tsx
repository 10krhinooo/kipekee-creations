import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { reducedMotion } from '../lib/motion'
import { cx } from './ui'

/**
 * Content that arrives as it is scrolled to.
 *
 * The homepage is long and, until now, entirely static below the fold: the
 * whole page mounted at once and then sat still, so scrolling it felt like
 * moving a printed sheet past a window. A section that assembles as you reach
 * it reads as authored, and it costs one IntersectionObserver.
 *
 * Three things it deliberately does not do:
 *
 * - It never animates out. Scrolling back up past a section that fades away
 *   again is a novelty the second time and an irritation the tenth, so each
 *   element reveals once and is then unobserved.
 * - It does not hold content hostage to JavaScript that might not arrive. When
 *   the browser has no `IntersectionObserver`, or the visitor has asked for
 *   reduced motion, the initial state is already revealed and nothing is ever
 *   hidden in the first place.
 * - It does not wrap in a second element. The `<div>` it renders takes the
 *   caller's own classes, so it replaces a wrapper rather than adding one.
 */

/*
 * One observer for the whole page rather than one per element.
 *
 * A long homepage has a dozen of these, and a dozen observers is a dozen
 * separate pieces of bookkeeping for the browser to run on the same scroll.
 * The `WeakMap` means an element that unmounts is collectable without anyone
 * having to remember to clean up after it.
 */
const pending = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | null = null

function reveal(el: Element, onShow: () => void) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          pending.get(entry.target)?.()
          pending.delete(entry.target)
          observer?.unobserve(entry.target)
        }
      },
      {
        /*
         * Trigger a little before the element is properly in view, and on the
         * first sliver of it rather than a percentage. A tall section would
         * never reach 25% visible on a phone, so a threshold in the middle
         * means the reveal fires when the section is already half read.
         */
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.01,
      },
    )
  }
  pending.set(el, onShow)
  observer.observe(el)
  return () => {
    pending.delete(el)
    observer?.unobserve(el)
  }
}

export function Reveal({
  children,
  className,
  /**
   * Position in a cascade, for several Reveals that come into view together.
   * Capped by the caller the same way `ProductCard` caps its own.
   */
  index = 0,
}: {
  children: ReactNode
  className?: string
  index?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Resolved during the first render, not in an effect: deciding this after
  // paint would mean a frame of the content at full opacity before it is
  // hidden to be revealed, which is the flicker this is meant to avoid.
  const [shown, setShown] = useState(
    () => reducedMotion() || typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (shown || !ref.current) return
    return reveal(ref.current, () => setShown(true))
  }, [shown])

  return (
    <div
      ref={ref}
      style={{ '--i': Math.min(index, 4) } as CSSProperties}
      className={cx(shown ? 'animate-rise-stagger' : 'opacity-0', className)}
    >
      {children}
    </div>
  )
}
