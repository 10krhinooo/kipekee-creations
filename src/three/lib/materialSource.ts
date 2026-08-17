import type { PatternKind } from '../../data/types'

/**
 * Where a fabric's appearance comes from.
 *
 * Everything today is procedural: the weave is generated from `patternDefs()`,
 * the same definition the gallery swatch and the SVG fallback already use, so
 * the cloth on the 3D curtain is the same cloth a shopper sees everywhere else.
 *
 * The union exists anyway, from the start, because the admin material-capture
 * work lands photographed maps on top of this layer. Retrofitting a second
 * source afterwards would mean reworking the texture builder, the cache key and
 * every material hook at once. Designed up front, that work supplies data
 * instead of code: the textured branch below already compiles and typechecks,
 * it simply has nothing pointing at it yet.
 */

export type FinishId = 'linen' | 'velvet' | 'percale' | 'voile' | 'kitenge'

export type MaterialSource =
  | { kind: 'procedural'; pattern: PatternKind; colour: string; finishId: FinishId }
  | {
      kind: 'textured'
      materialId: string
      /**
       * Bumped whenever the underlying image is re-cropped or re-analysed.
       * Without it in the cache key a re-crop silently reuses the stale GPU
       * texture, and staff would approve one thing and publish another.
       */
      assetVersion: number
      finishId: FinishId
      maps: { albedo: string; normal?: string; roughness?: string; opacity?: string }
    }

/**
 * The identity of a set of texture maps, for the LRU cache and for memoising
 * materials. Two sources that produce the same key must be visually identical.
 */
export const materialCacheKey = (source: MaterialSource): string =>
  source.kind === 'procedural'
    ? `p|${source.pattern}|${source.colour}|${source.finishId}`
    : `t|${source.materialId}|${source.assetVersion}`

/**
 * The finish a pattern reads as, until there is a real material selector.
 *
 * `PreviewProps` carries a pattern and a colour, not a finish, and deliberately
 * so: it is the shared contract between both renderers, and a prop only the 3D
 * tier could honour would mean the fallback had started lying. So the finish is
 * inferred here rather than passed in.
 *
 * This is an approximation and is meant to be replaced, not extended. Material
 * capture introduces a real `materialId` on the line, and at that point the
 * finish arrives with the material instead of being guessed from the weave.
 */
export function finishForPattern(pattern: PatternKind): FinishId {
  switch (pattern) {
    case 'sheer':
      return 'voile'
    case 'damask':
      return 'velvet'
    case 'geometric':
      return 'kitenge'
    case 'weave':
    case 'embroidery':
      return 'linen'
    case 'plain':
    case 'stripe':
      return 'percale'
    // Hard goods never reach a fabric material — wrought iron and ceramic use
    // the metal and wood hooks. Answered anyway so the function stays total and
    // a new PatternKind cannot land here as `undefined`.
    default:
      return 'linen'
  }
}
