import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, View } from '@react-three/drei'
import { ACESFilmicToneMapping, VSMShadowMap } from 'three'
import { useEffect } from 'react'
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
  // Phones and tablets usually expose a coarse pointer. Keep their first
  // render near DPR 1 instead of immediately filling a high-density screen.
  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

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
      // Idle previews draw zero frames. Mount, viewport changes, scene changes,
      // and drag input explicitly invalidate the renderer.
      frameloop="demand"
      dpr={coarsePointer ? [1, 1.25] : [1, 2]}
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
      {/* Reduce quality rather than abandon 3D. Dropping to DPR 1 is a far
          better outcome for the customer than being pulled to a flat image.
          <PerformanceMonitor> used to demote the tier after a run of bad frame
          readings; it no longer does. Nothing takes 3D away from a visitor who
          asked for it because a few frames came in late, and a stutter they can
          see is at least a stutter they can act on through the toggle. */}
      <PerformanceMonitor />
      <AdaptiveDpr pixelated />
      <FrameDriver onReady={setCanvasReady} />
      <View.Port />
    </Canvas>
  )
}
