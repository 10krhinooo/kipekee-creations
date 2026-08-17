import { useEffect } from 'react'
import { View } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Stage } from '../../three/Stage'
import type { PreviewProps } from './types'

/**
 * Asks for a frame after every commit of this view.
 *
 * Under `frameloop="demand"` the canvas draws only when something requests it,
 * and a view mounts long after the canvas did (it arrives with a lazy chunk),
 * so the canvas-level mount frame has already been and gone by then. Without
 * this the very first paint of a vignette never happens at all.
 *
 * Deliberately no dependency array: any commit here means the scene changed.
 */
function RequestFrame() {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => invalidate())
  return null
}

/**
 * The product vignette: one room corner, framed on the product.
 *
 * Renders an inline `<View>`, which drei scissors the shared renderer to. This
 * is a real DOM element in the page flow, not a portal target and not a second
 * canvas: the pixels come from the one session-wide Canvas mounted in the
 * storefront shell. (drei deprecated the `<View track={ref}>` form in favour of
 * inline views, so there is no wrapper div and no ref plumbing here.)
 *
 * The contents are a placeholder room shell. The real mesh vocabulary, shared
 * with the configurator, arrives with the parts layer; what this proves is that
 * the shared canvas, the lighting, the shadows and the environment all work.
 */
export default function RoomScene3D({
  colour,
  night = false,
  hardware = '#2c2c2c',
  className,
}: PreviewProps) {
  return (
    <View className={className ?? 'h-full w-full'}>
      {/* No <PerspectiveCamera makeDefault> here on purpose. `makeDefault`
          writes the canvas-level default camera, which a view does not own,
          and racing that against the view's own render makes the first paint
          land only intermittently. The shared canvas camera frames the
          vignette instead. */}
      <RequestFrame />
      <Stage night={night} />

      {/* Floor. Receives shadow but never casts: a closed box casting onto
          itself only wastes shadow-map resolution and invites acne. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#e2d7c8" roughness={0.85} />
      </mesh>

      {/* Back wall, in the brand sand so both tiers open on the same colour. */}
      <mesh receiveShadow position={[0, 2.4, -2.4]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#f3ede7" roughness={0.95} />
      </mesh>

      {/* Stand-in for the cloth, in the product's selected colour, so changing
          colourway already repaints the 3D tier exactly as it does the SVG. */}
      <mesh castShadow receiveShadow position={[0, 1.25, -1.9]}>
        <boxGeometry args={[2.2, 2.5, 0.06]} />
        <meshStandardMaterial color={colour} roughness={0.9} />
      </mesh>

      {/* The rod. Metal is the material that proves image-based lighting is
          working: with lights but no environment map it renders near-black,
          because a mirror with nothing to reflect is black. */}
      <mesh castShadow position={[0, 2.62, -1.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 2.9, 20]} />
        <meshStandardMaterial color={hardware} metalness={1} roughness={0.22} envMapIntensity={1.4} />
      </mesh>
    </View>
  )
}
