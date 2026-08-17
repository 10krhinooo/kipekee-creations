/**
 * Which renderer this device should get.
 *
 * **3D is the default, and the visitor decides.** This used to score the device
 * on connection type, core count and reported memory and quietly serve the flat
 * renderer to anything that looked marginal. That guessed wrong in both
 * directions: those signals are coarse and widely misreported, and the visible
 * result was a WebGL-capable machine being handed a flat image with no
 * explanation, which reads as the feature being broken rather than as a saving.
 *
 * So the only question asked here is whether WebGL2 exists at all, because that
 * one is not a preference: without it there is no 3D to offer. Everything else
 * is the visitor's call through the view toggle, and their choice is remembered.
 *
 * Kipekee still sells into Kenya, where a lot of visitors arrive on mid-range
 * Android over a metered bundle, and that concern has not gone away. It is
 * answered by the toggle being labelled with its real consequence ("uses less
 * data") rather than by deciding on someone's behalf. If it turns out shoppers
 * need the heuristics back, they are the block below marked as removed.
 */

export type RenderTier = 'probing' | '2d' | '3d'

/** Persisted only when a human chooses. A demotion must not outlive the session. */
export const TIER_STORAGE_KEY = 'kipekee.render.v1'

export const readStoredTier = (): '2d' | '3d' | null => {
  try {
    const stored = localStorage.getItem(TIER_STORAGE_KEY)
    return stored === '2d' || stored === '3d' ? stored : null
  } catch {
    // Private browsing throws on access. An unreadable preference is simply
    // no preference; it must not stop the shop rendering.
    return null
  }
}

export const storeTier = (tier: '2d' | '3d') => {
  try {
    localStorage.setItem(TIER_STORAGE_KEY, tier)
  } catch {
    // Losing the preference is survivable. Failing to render is not.
  }
}

/**
 * Cached because the probe creates a real WebGL context to ask the driver about
 * itself. Browsers cap live contexts at around 16, so repeatedly creating
 * throwaway ones to answer the same question is a leak with a hard ceiling.
 */
let cached: '2d' | '3d' | null = null

export function probeTier(): '2d' | '3d' {
  if (cached) return cached
  cached = runProbe()
  return cached
}

function runProbe(): '2d' | '3d' {
  if (typeof window === 'undefined') return '2d'

  // A remembered choice wins outright, in both directions.
  const chosen = readStoredTier()
  if (chosen) return chosen

  // Can this browser do it at all? WebGL2 specifically: the material and texture
  // setup assumes it. This is the one hard gate, because a device without it has
  // no 3D to be offered rather than a slow version of it.
  let gl: WebGL2RenderingContext | null = null
  try {
    gl = document.createElement('canvas').getContext('webgl2')
  } catch {
    return '2d'
  }
  if (!gl) return '2d'

  // Hand the context straight back rather than leaving it against the browser's
  // live-context cap.
  gl.getExtension('WEBGL_lose_context')?.loseContext()

  return '3d'
}
