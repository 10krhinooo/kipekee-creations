import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useEffect, useState } from 'react'

/**
 * The light rig for every 3D preview.
 *
 * Deliberately not drei's `<Stage>`. That helper auto-centres and auto-fits its
 * contents, which is right for a product spinning on a turntable and wrong for
 * a fixed architectural room: adding a cushion would silently re-frame the
 * whole scene. Here the room is the constant and the product moves inside it.
 */

/**
 * The environment is built from lightformers rather than an HDRI preset.
 *
 * drei's presets are pulled from a CDN at runtime, and drei's own documentation
 * calls them prototyping-only for that reason. Fetching a multi-megabyte HDRI
 * would also undo the entire point of the render tier, which exists to keep
 * this experience off metered connections. Lightformers cost nothing to ship.
 *
 * It still has to exist: with lights but no image-based lighting a metal has
 * nothing to reflect and renders as near-black. This is what makes the
 * wrought-iron and the rod hardware read as metal at all.
 */
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const update = () => setCoarse(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  return coarse
}

function ProceduralEnvironment({ night, mobile }: { night: boolean; mobile: boolean }) {
  return (
    <Environment resolution={mobile ? 128 : 256}>
      {/* The big soft source in front of the scene. It is what a polished rod or
          a wrought-iron rail actually reflects, so without it metal reads as
          black no matter how bright the direct lights are. */}
      <Lightformer
        form="rect"
        intensity={night ? 0.6 : 4}
        color={night ? '#ffd9a8' : '#ffffff'}
        scale={[10, 8]}
        position={[0, 3, 6]}
        target={[0, 1.4, 0]}
      />
      {/* Ceiling bounce. Rooms are lit as much by their own ceiling as by the
          window, and without this the tops of folds go flat. */}
      <Lightformer
        form="rect"
        intensity={night ? 0.5 : 0.9}
        color={night ? '#ffc98a' : '#fff6ec'}
        scale={[10, 10]}
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {/* Cool fill from the opposite side, so shadowed cloth keeps some colour
          instead of dropping to black. */}
      <Lightformer
        form="rect"
        intensity={night ? 0.15 : 0.6}
        color="#dce6f2"
        scale={[6, 6]}
        position={[5, 2, 3]}
        target={[0, 1, 0]}
      />
    </Environment>
  )
}

export function Stage({ night = false }: { night?: boolean }) {
  const mobile = useCoarsePointer()

  return (
    <>
      <ProceduralEnvironment night={night} mobile={mobile} />

      {/* A floor for the shadows to sit on, not a light source in its own right. */}
      <ambientLight intensity={night ? 0.2 : 0.4} />

      {/* Key light, high and off to the left of the camera.
       *
       * Note this is NOT yet "the sun outside the window": that framing needs a
       * real window aperture for the curtain to occlude, and the vignette has
       * only a solid back wall so far. A key placed behind that wall lights
       * nothing the camera can see. It moves outside the aperture once the
       * window geometry lands with the parts layer.
       */}
      <directionalLight
        castShadow
        position={[-3.4, 4.6, 3.6]}
        intensity={night ? 0.35 : 2.1}
        color={night ? '#9fb4d8' : '#fff4e6'}
        // Phones use a smaller map to keep fill-rate and memory predictable.
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        // Clamped tight to the room: the map's texels are spread over this
        // volume, so a loose frustum spends resolution on empty space.
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        // VSM blurs in shadow-map space, so the penumbra widens with distance
        // from the caster. That gradient is what makes a curtain shadow read as
        // cloth rather than as a cardboard cut-out.
        shadow-radius={6}
        shadow-blurSamples={mobile ? 8 : 16}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* Two warm bedside sources, which is what actually distinguishes a room
          at night from the same room underexposed. */}
      {night && (
        <>
          <pointLight position={[-2.2, 1.1, 1.4]} intensity={2.4} distance={6} color="#ffb765" />
          <pointLight position={[2.2, 1.1, 1.4]} intensity={1.6} distance={6} color="#ffb765" />
        </>
      )}

      {/* Grounds table and bed legs, where the directional shadow is too soft to
          be legible. frames={1} bakes once rather than every frame. */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={night ? 0.32 : 0.5}
        scale={12}
        blur={mobile ? 1.8 : 2.4}
        far={2}
        frames={1}
      />
    </>
  )
}
