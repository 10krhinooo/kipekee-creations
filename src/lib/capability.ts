/**
 * Which renderer this device should get.
 *
 * Kipekee sells into Kenya, where a large share of visitors arrive on mid-range
 * Android over a metered bundle. A WebGL room preview is the right experience
 * for a hotel buyer on a desktop and the wrong one for a shopper paying by the
 * megabyte, so the tier is decided before the 3D chunk is ever requested rather
 * than after it has already been downloaded.
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

interface ProbeNavigator extends Navigator {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
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

  const nav = navigator as ProbeNavigator

  // 1. Explicit human intent beats every heuristic, in both directions. Someone
  //    who asked for 3D on a device we scored as weak gets 3D.
  const forced = readStoredTier()
  if (forced) return forced

  // 2. Data cost, before capability. A device can be perfectly capable of 3D
  //    and still be the wrong place to spend 600KB of someone's bundle.
  if (nav.connection?.saveData) return '2d'
  if (['slow-2g', '2g', '3g'].includes(nav.connection?.effectiveType ?? '')) return '2d'
  try {
    if (matchMedia('(prefers-reduced-data: reduce)').matches) return '2d'
  } catch {
    // Older browsers throw on an unknown media feature rather than returning
    // false. Not knowing is not a reason to refuse 3D.
  }

  // 3. WebGL2 specifically. The material and texture setup assumes it, and
  //    WebGL1-only devices are old enough to fail the headroom gate anyway.
  let gl: WebGL2RenderingContext | null = null
  try {
    gl = document.createElement('canvas').getContext('webgl2')
  } catch {
    return '2d'
  }
  if (!gl) return '2d'

  // 4. Headroom. The scene runs below these floors but stutters, and a stutter
  //    reads to a customer as broken rather than as slow.
  const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
  const capable =
    maxTexture >= 4096 &&
    (nav.hardwareConcurrency ?? 2) >= 4 &&
    (nav.deviceMemory ?? 1) >= 4

  // Hand the context straight back rather than leaving it against the cap.
  gl.getExtension('WEBGL_lose_context')?.loseContext()

  return capable ? '3d' : '2d'
}
