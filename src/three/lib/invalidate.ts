import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Keeps `frameloop="demand"` honest.
 *
 * On demand, r3f draws when React commits a prop change and otherwise sits
 * still, which is what lets an idle preview cost nothing. Two things break that
 * assumption and both need a frame asked for explicitly:
 *
 * - `<View>` scissors the renderer to a DOM rectangle it measures per frame. If
 *   the page scrolls or resizes without a frame, the 3D stays painted at the
 *   old coordinates while the div has moved.
 * - The first paint. A view mounts after the canvas, so the commit that created
 *   the canvas is already over by the time there is anything to draw.
 *
 * Passive listeners: this never calls preventDefault, and a non-passive scroll
 * handler on a shop page is a scroll-jank bug waiting to happen.
 */
export function useInvalidateOnViewport() {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    // The mount frame. Without this the first view never draws at all.
    invalidate()

    const ask = () => invalidate()
    window.addEventListener('scroll', ask, { passive: true })
    window.addEventListener('resize', ask, { passive: true })
    return () => {
      window.removeEventListener('scroll', ask)
      window.removeEventListener('resize', ask)
    }
  }, [invalidate])
}
