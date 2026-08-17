import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, View } from '@react-three/drei'
import { ACESFilmicToneMapping, VSMShadowMap } from 'three'
import { useCallback, useEffect, useRef } from 'react'
import { useRenderTier } from './TierProvider'
import { useInvalidateOnViewport } from '../../three/lib/invalidate'

/**
 * Lives inside the Canvas, which is the point: mounting here proves the r3f
 * root exists and `<View.Port />` beside it is live, so it is the honest place
 * to announce that views may now mount.
 *
 * Not `onCreated` — that does not fire again when the Canvas remounts after a
 * visitor toggles back to 3D, which left views permanently gated off.
 */
function FrameDriver({ onReady }: { onReady: (ready: boolean) => void }) {
  useInvalidateOnViewport()
  useEffect(() => {
    onReady(true)
    return () => onReady(false)
  }, [onReady])
  return null
}

/**
 * One WebGL context for the whole session.
 *
 * `ProductPage` renders `<ProductDetail key={slug}>` on purpose, so navigating
 * between products remounts rather than reuses. A `<Canvas>` inside that keyed
 * subtree would therefore create and destroy a WebGL context on every product
 * navigation. Browsers cap live contexts at around 16 and then start
 * force-losing the oldest, and context creation is among the most expensive
 * things a page can do, so browsing eight products would visibly degrade.
 *
 * Instead this Canvas mounts once, outside every keyed subtree, and each
 * preview renders a `<View>` that scissors the shared renderer to its own
 * rectangle. Remounting the contents of a view is cheap; the context, the
 * environment map and the texture cache all survive the session.
 *
 * Lazy-loaded, always. three, fiber and drei together are around 600KB gzipped
 * and must never reach the entry chunk, because a 2D-tier device should never
 * download a byte of it.
 */
export default function SharedCanvas() {
  const { demote, setCanvasReady } = useRenderTier()

  // Frames below budget are normal during a tween. Sustained starvation after
  // AdaptiveDpr has already bottomed out is the real signal, so require a run
  // of bad readings before giving up on 3D entirely.
  const declines = useRef(0)

  const onDecline = useCallback(() => {
    declines.current += 1
    if (declines.current >= 3) demote('sustained frame starvation')
  }, [demote])

  const onIncline = useCallback(() => {
    declines.current = 0
  }, [])

  return (
    <Canvas
      // Positioned through `style`, not a class: the Canvas writes its own
      // inline `position: relative`, and an inline style beats a Tailwind
      // class, so `fixed` in className is silently overridden. r3f spreads the
      // style prop last, so this wins.
      //
      // z-20 sits above the page background, so a preview paints over its sand
      // placeholder, but below the FAB (z-30), header (z-40) and drawer (z-50),
      // so the 3D can never cover the chrome.
      style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}
      // Re-binding events to the shell is what lets a pointer reach a view: the
      // canvas itself is pointer-events-none so the page underneath stays
      // clickable everywhere a view is not.
      // NOTE: no `eventSource` yet, deliberately.
      //
      // Passing it as a RefObject stops r3f initialising entirely: the canvas
      // stays at its default 300x150, no children mount, and the preview is
      // silently blank with nothing in the console. Nothing here needs pointer
      // input yet, so it stays off until drag-to-orbit arrives with the parts
      // layer, at which point it must be passed as a resolved element rather
      // than a ref that is still null at mount.
      eventPrefix="client"
      // VSM rather than drei's <SoftShadows>. That helper injects a PCSS
      // shader that calls unpackRGBAToDepth, which three removed by 0.185, so
      // it fails to compile and takes every MeshStandardMaterial down with it.
      // PCFSoftShadowMap is deprecated in this version too. VSM is the
      // supported way to get a penumbra that widens with distance.
      shadows={{ type: VSMShadowMap }}
      // An idle preview must draw zero frames. Everything that moves asks for a
      // frame explicitly rather than the loop running forever.
      // KNOWN GAP, owned by the perf pass. The plan calls for `demand` so an
      // idle preview costs nothing, and that is still the target.
      //
      // `demand` does not work with `<View>` as-is: a view mounts from a lazy
      // chunk long after the canvas, it measures its DOM rect inside a
      // priority useFrame, and the result is a race where the first paint
      // lands only sometimes. Shipping a preview that renders intermittently
      // is far worse than shipping one that costs frames, so this stays
      // `always` until the perf pass can gate it properly (pause the loop when
      // no view is on screen, rather than trying to hand-invalidate one).
      frameloop="always"
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      // Framed on the cloth rather than on the room: close enough that the
      // product fills a portrait preview box, high enough to keep the rod and
      // a little floor in shot.
      camera={{ fov: 38, position: [0, 1.35, 3.4] }}
      onCreated={({ gl }) => {
        // ACES stops the sunlit window blowing out to flat white and keeps the
        // deep brand reds from clipping to a single block of colour.
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05

        // The fallback's most important job. A real GPU reset mid-session must
        // drop the visitor to the flat renderer rather than to a black
        // rectangle, and nothing else can catch this.
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          demote('webgl context lost')
        })
      }}
    >
      {/* Reduce quality before abandoning 3D. Dropping to DPR 1 is a far better
          outcome for the customer than falling back to a flat image. */}
      <PerformanceMonitor onDecline={onDecline} onIncline={onIncline} />
      <AdaptiveDpr pixelated />
      <FrameDriver onReady={setCanvasReady} />
      <View.Port />
    </Canvas>
  )
}
