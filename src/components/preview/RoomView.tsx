import { RoomPreview } from '../RoomPreview'
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
 * Today every tier resolves to the SVG renderer, because the 3D one does not
 * exist yet. Standing the switcher up first is deliberate: it proves the
 * fallback path is a real path before anything depends on it, rather than
 * retrofitting a fallback onto a 3D-only component later and hoping.
 */
export function RoomView(props: PreviewProps) {
  const { tier } = useRenderTier()

  // The 3D branch lands here next, behind React.lazy. Until then this is not a
  // placeholder so much as the whole point: '2d' and 'probing' are permanent
  // states that must always render something complete.
  void tier

  return <RoomPreview {...props} />
}
