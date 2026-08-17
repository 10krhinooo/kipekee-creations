import { Suspense, lazy } from 'react'
import { RoomPreview } from '../RoomPreview'
import { Preview3DBoundary } from './Preview3DBoundary'
import { useRenderTier } from './TierProvider'
import type { PreviewProps } from './types'

/**
 * The only preview component the rest of the app should render.
 *
 * Every consumer asks for "the room", not for a renderer. That indirection is
 * what makes the tier a runtime decision rather than something baked into each
 * call site, and it means a device that cannot run WebGL is served by the same
 * element as one that can.
 *
 * Both renderers take exactly `PreviewProps`. That shared type is the contract:
 * if a prop arrives that only one tier can honour, the tiers have diverged and
 * the fallback has quietly started lying about what the customer would receive.
 */

// Lazy so the three/drei chunk is fetched only once a device has been scored as
// capable. A 2D-tier visitor must never download a byte of it.
const RoomScene3D = lazy(() => import('./RoomScene3D'))

export function RoomView(props: PreviewProps) {
  const { tier, canvasReady, demote } = useRenderTier()

  // 'probing' renders the SVG too, so the first paint is never blocked on a
  // capability check. There is no spinner state and nothing to wait for.
  //
  // `canvasReady` is the other half: a <View> that mounts before <View.Port />
  // exists never connects to it and renders a correctly-sized empty box
  // forever. Both arrive on lazy chunks, so without this gate the order is a
  // race and the preview is blank roughly half the time.
  if (tier !== '3d' || !canvasReady) return <RoomPreview {...props} />

  const flat = <RoomPreview {...props} />

  return (
    <Preview3DBoundary fallback={flat} onError={(reason) => demote(`3d preview failed: ${reason}`)}>
      {/* The SVG scene is the Suspense fallback as well as the error fallback,
          so a slow chunk shows the real room rather than an empty box. */}
      <Suspense fallback={flat}>
        <RoomScene3D {...props} />
      </Suspense>
    </Preview3DBoundary>
  )
}
