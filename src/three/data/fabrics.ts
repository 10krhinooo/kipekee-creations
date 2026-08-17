import type { FinishId } from '../lib/materialSource'

/**
 * The finish registry: how each cloth behaves under light.
 *
 * Roughness stays inside the 0.80–1.00 band throughout, because fabric has no
 * real specular lobe. A fabric authored at 0.4 does not look like nicer fabric,
 * it looks like painted plastic, and that reads as cheap on exactly the products
 * where a hotel buyer is deciding on quality.
 */
export interface FabricFinish {
  id: FinishId
  label: string
  /**
   * The centre of the finish's roughness band. Baked into the roughness map, so
   * the material's own `roughness` stays at 1 and the map is the whole answer.
   */
  roughness: number
  /** How hard the baked weave pushes on the lighting. */
  normalScale: number
  /**
   * Default weave density, in repeats of the generated texture.
   *
   * **1 means "exactly the gallery swatch".** The texture is rasterised at the
   * same user-unit scale `swatch()` uses, so a repeat of 1 puts the same size of
   * motif on the 3D cloth as on the flat swatch beside it — which is the whole
   * point of both tiers sharing `patternDefs()`. Deviations below are per-finish
   * character (a printed kitenge motif is larger than a percale thread), not
   * free numbers: pushing them far from 1 is how the two tiers start disagreeing
   * about what the fabric looks like.
   */
  tile: [number, number]
  /**
   * Sheen only exists on MeshPhysicalMaterial. Present here means the material
   * hook builds Physical rather than Standard for this finish.
   */
  sheen?: number
  sheenColour?: string
  /** Set only for cloth you can see through. Implies a transparent material. */
  opacity?: number
  /**
   * The catalogue product this finish is sold as, so choosing a fabric in the
   * configurator is also choosing a price. Priced through `priceOf()` at the
   * call site, never formatted here.
   */
  productSlug: string
}

export const FABRICS: Record<FinishId, FabricFinish> = {
  linen: {
    id: 'linen',
    label: 'Linen',
    roughness: 0.92,
    normalScale: 0.9,
    tile: [1, 1],
    productSlug: 'blockout-lining-fabric',
  },
  percale: {
    id: 'percale',
    label: 'Cotton percale',
    // Sanforised contract percale is the smoothest cloth in the catalogue, which
    // is most of why hotel linen photographs the way it does.
    roughness: 0.86,
    normalScale: 0.6,
    // Finer thread than linen, so the same weave sits a little tighter.
    tile: [1.2, 1.2],
    productSlug: 'hotel-bed-linen-set',
  },
  velvet: {
    id: 'velvet',
    label: 'Velvet',
    roughness: 0.8,
    // The deepest weave in the set. Velvet's whole character is pile catching
    // light across a fold, so it needs both the strongest normal and the sheen.
    normalScale: 1.4,
    // Pile is coarser than a flat weave and wants the motif reading larger.
    tile: [0.8, 0.9],
    sheen: 0.85,
    sheenColour: '#ffffff',
    productSlug: 'velvet-upholstery-fabric',
  },
  voile: {
    id: 'voile',
    label: 'Sheer voile',
    roughness: 0.95,
    normalScale: 0.4,
    // Voile is the one finish you see through, and that is the entire product.
    opacity: 0.45,
    // The finest mesh in the set, and it is what makes voile read as sheer.
    tile: [1.3, 1.4],
    productSlug: 'sheer-linen-voile',
  },
  kitenge: {
    id: 'kitenge',
    label: 'Kitenge print',
    roughness: 0.88,
    normalScale: 0.7,
    // Printed cotton carries a large motif, so it reads coarser than any woven
    // finish. Tiling kitenge as tightly as linen turns the print into noise.
    tile: [0.6, 0.7],
    productSlug: 'kitenge-blockout-curtains',
  },
}
