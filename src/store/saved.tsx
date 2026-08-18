import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/*
 * Three lists of slugs: saved, compare, and recently viewed.
 *
 * Deliberately its own localStorage key rather than an extension of the
 * basket's. The basket's next schema change is a single coordinated bump that
 * adds material and configuration fields together; folding a wishlist in here
 * would force that bump early and tie two unrelated features to one migration.
 *
 * Same hydration shape as the basket: a `ready` flag gates the write effect so
 * the first render never overwrites stored state with an empty one, and both
 * sides are wrapped because private browsing refuses the write.
 */

interface State {
  saved: string[]
  compare: string[]
  recent: string[]
}

const empty: State = { saved: [], compare: [], recent: [] }

const STORAGE_KEY = 'kipekee.saved.v1'

/** Four columns is where a comparison table stops fitting a laptop. */
export const COMPARE_LIMIT = 4

/** Eight is roughly one shopping session. */
const RECENT_LIMIT = 8

interface SavedApi extends State {
  isSaved: (slug: string) => boolean
  toggleSaved: (slug: string) => void
  isComparing: (slug: string) => boolean
  toggleCompare: (slug: string) => void
  clearCompare: () => void
  recordView: (slug: string) => void
  savedCount: number
}

const SavedContext = createContext<SavedApi | null>(null)

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

export function SavedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>
        /*
         * Merged, not replaced. Effects run child-first, so a product page has
         * already called `recordView` by the time this provider's own effect
         * runs. A plain `setState({...parsed})` would throw that view away, and
         * the product you are looking at right now would be the one product
         * missing from "recently viewed".
         */
        setState((prev) => ({
          saved: strings(parsed.saved),
          compare: strings(parsed.compare).slice(0, COMPARE_LIMIT),
          recent: [...prev.recent, ...strings(parsed.recent)]
            .filter((slug, i, all) => all.indexOf(slug) === i)
            .slice(0, RECENT_LIMIT),
        }))
      }
    } catch {
      // A corrupt store should never block the shop from loading.
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private browsing can refuse writes; the lists still work in memory.
    }
  }, [state, ready])

  const toggleSaved = useCallback((slug: string) => {
    setState((prev) => ({
      ...prev,
      saved: prev.saved.includes(slug)
        ? prev.saved.filter((s) => s !== slug)
        : [slug, ...prev.saved],
    }))
  }, [])

  const toggleCompare = useCallback((slug: string) => {
    setState((prev) => {
      if (prev.compare.includes(slug)) {
        return { ...prev, compare: prev.compare.filter((s) => s !== slug) }
      }
      // Silently ignoring the click past the limit reads as a broken checkbox,
      // so the caller checks `compare.length` and disables it instead.
      if (prev.compare.length >= COMPARE_LIMIT) return prev
      return { ...prev, compare: [...prev.compare, slug] }
    })
  }, [])

  const clearCompare = useCallback(() => setState((prev) => ({ ...prev, compare: [] })), [])

  const recordView = useCallback((slug: string) => {
    setState((prev) => {
      // Already at the front means nothing changed, and returning `prev`
      // unchanged keeps this out of the write effect entirely.
      if (prev.recent[0] === slug) return prev
      return {
        ...prev,
        recent: [slug, ...prev.recent.filter((s) => s !== slug)].slice(0, RECENT_LIMIT),
      }
    })
  }, [])

  const value = useMemo<SavedApi>(
    () => ({
      ...state,
      isSaved: (slug) => state.saved.includes(slug),
      toggleSaved,
      isComparing: (slug) => state.compare.includes(slug),
      toggleCompare,
      clearCompare,
      recordView,
      savedCount: state.saved.length,
    }),
    [state, toggleSaved, toggleCompare, clearCompare, recordView],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSaved() {
  const ctx = useContext(SavedContext)
  if (!ctx) throw new Error('useSaved must be used inside a SavedProvider')
  return ctx
}
