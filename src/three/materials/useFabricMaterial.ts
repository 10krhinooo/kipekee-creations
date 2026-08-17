import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
} from 'three'
import { FABRICS } from '../data/fabrics'
import { getFabricMaps } from '../lib/fabricTexture'
import type { MaterialSource } from '../lib/materialSource'

/**
 * One cloth material, memoised on the identity of the fabric.
 *
 * `MeshStandardMaterial` throughout, with velvet the single exception: sheen only
 * exists on `MeshPhysicalMaterial`, and velvet without sheen is not velvet, it is
 * dark felt. Both take identical map props, so no mesh ever needs to know which
 * one it was handed.
 *
 * **`source` must be referentially stable** — `useMemo` it in the caller. It is
 * the memo key for the material, so an object rebuilt every render rebuilds and
 * disposes a material every render. The textures survive either way, since they
 * are held by the LRU cache rather than by the material.
 */
export function useFabricMaterial(
  source: MaterialSource,
  /** Overrides the finish's default weave density. */
  tiling?: [number, number],
) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)

  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl])

  const finishId = source.finishId

  const material = useMemo(() => {
    const finish = FABRICS[finishId]
    const maps = getFabricMaps(source, maxAnisotropy, invalidate)

    const shared = {
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      alphaMap: maps.alphaMap ?? null,
      normalScale: new Vector2(finish.normalScale, finish.normalScale),
      // The map is the whole roughness answer. three multiplies this scalar by
      // the map's green channel, and the finish's band is already baked into the
      // map, so anything below 1 here would apply the finish twice and smooth the
      // cloth back towards plastic.
      roughness: 1,
      // Cloth is a dielectric. There is no such thing as slightly metallic
      // fabric, and a nonzero value here only ever turns the weave flat grey.
      metalness: 0,
      // White, so the albedo map is the colour. Tinting on top of a map that was
      // generated from the same colour would darken it twice over.
      color: new Color('#ffffff'),
      envMapIntensity: 1,
      // Cloth is thin and a curtain is routinely seen from behind, at the return
      // edge and through a sheer layer in front of it.
      side: DoubleSide,
      transparent: finish.opacity !== undefined,
      opacity: finish.opacity ?? 1,
      // A transparent sheer must not write depth, or it occludes the blockout
      // panel behind it and the layered look collapses.
      depthWrite: finish.opacity === undefined,
    }

    return finish.sheen !== undefined
      ? new MeshPhysicalMaterial({
          ...shared,
          sheen: finish.sheen,
          sheenColor: new Color(finish.sheenColour ?? '#ffffff'),
          sheenRoughness: 0.6,
        })
      : new MeshStandardMaterial(shared)
  }, [source, finishId, maxAnisotropy, invalidate])

  useEffect(() => () => material.dispose(), [material])

  const [u, v] = tiling ?? FABRICS[finishId].tile

  // Tiling mutates `texture.repeat` and nothing else. `repeat` reaches the GPU as
  // a uniform, so the texture object is untouched, there is no pixel re-upload,
  // and no new material or mesh is constructed. All it needs is one more frame.
  //
  // The maps are shared across every consumer of this fabric, which is the point
  // of the cache and is correct while tile density is a property of the finish.
  // Per-instance tiling — the configurator's repeat slider — will need its own
  // texture clones, and that is a Milestone 3 problem, flagged here rather than
  // discovered there.
  useEffect(() => {
    for (const texture of [
      material.map,
      material.normalMap,
      material.roughnessMap,
      material.alphaMap,
    ]) {
      texture?.repeat.set(u, v)
    }
    invalidate()
  }, [material, u, v, invalidate])

  return material
}
