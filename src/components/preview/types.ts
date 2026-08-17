import type { PatternKind } from '../../data/types'

/**
 * The preview contract, shared by every renderer.
 *
 * These types used to live inside `RoomPreview`, which was fine while the SVG
 * scene was the only visualiser. It is about to stop being the only one, and a
 * fallback tier is only honest if both tiers answer to the same props: if a
 * prop arrives that one renderer cannot honour, the tiers have diverged and the
 * fallback quietly starts lying. Keeping the contract in one file that every
 * renderer imports is what lets `tsc -b` catch that divergence for us.
 */

export type SceneKind = 'window' | 'bed' | 'sofa' | 'bath' | 'dining'
export type SceneVariant = 'curtains' | 'sheer' | 'rail' | 'canopy' | 'default'
export type Heading = 'pencil' | 'wave' | 'eyelet'
export type Finial = 'ball' | 'scroll' | 'spear'

export interface PreviewProps {
  colour: string
  pattern: PatternKind
  scene: SceneKind
  /** Window scene only. */
  heading?: Heading
  finial?: Finial
  drawn?: boolean
  /** Window scene shows a sheer only for curtains, not for a bare rail. */
  variant?: SceneVariant
  night?: boolean
  /** Bed scenes only: relative bed width for the selected size. */
  bedScale?: number
  hardware?: string
  className?: string
}
