import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { probeTier, storeTier, type RenderTier } from '../../lib/capability'

/**
 * Which renderer the whole session is using.
 *
 * Context is right here precisely because this is not per-frame state: the tier
 * changes at most a couple of times in a session, and when it does every
 * preview on the page genuinely needs to re-render. That is the opposite of the
 * per-frame values a 3D scene deals with, which must never go through Context.
 */

interface TierApi {
  tier: RenderTier
  /**
   * Whether the shared Canvas has been created.
   *
   * A drei `<View>` only connects to `<View.Port />` if the Port is already
   * mounted when the view appears. Both arrive on lazy chunks, so their order
   * is a race, and a view that loses it renders a correctly-sized but
   * permanently empty box. Gating on this makes the order deterministic.
   */
  canvasReady: boolean
  setCanvasReady: (ready: boolean) => void
  /** A human choosing. Persisted, because they meant it. */
  setTier: (tier: '2d' | '3d') => void
  /**
   * The app giving up on 3D: a lost context, a failed chunk, or frames we
   * cannot hold. Sticky for the session but deliberately not persisted, so a
   * transient GPU hiccup does not permanently downgrade someone's experience.
   */
  demote: (reason: string) => void
}

const TierContext = createContext<TierApi | null>(null)

export function TierProvider({ children }: { children: ReactNode }) {
  // Starts at 'probing' so the first paint is never blocked on a WebGL context
  // creation. The 2D tier renders during it, so there is nothing to wait for.
  const [tier, setTierState] = useState<RenderTier>('probing')
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    setTierState(probeTier())
  }, [])

  const setTier = useCallback((next: '2d' | '3d') => {
    storeTier(next)
    setTierState(next)
  }, [])

  const demote = useCallback((reason: string) => {
    setCanvasReady(false)
    setTierState((current) => {
      if (current === '2d') return current
      // Worth a breadcrumb: a demotion in the wild is the signal that the probe
      // was too optimistic, and there is no other way to learn that.
      console.warn(`[kipekee] falling back to the flat renderer: ${reason}`)
      return '2d'
    })
  }, [])

  const value = useMemo(
    () => ({ tier, canvasReady, setCanvasReady, setTier, demote }),
    [tier, canvasReady, setTier, demote],
  )

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

export function useRenderTier(): TierApi {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useRenderTier must be used inside a TierProvider')
  return ctx
}
