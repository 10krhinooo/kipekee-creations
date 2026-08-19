import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { Category, Product } from '../data/types'

/**
 * The catalogue, from the backend rather than from a literal.
 *
 * It used to be `src/data/catalogue.ts`: an 840 line array shipped to every
 * visitor. That held up until somebody wanted to change a price without a
 * deploy, or wanted the shop and the console to agree on how much stock is
 * left. Both are now the backend's job, and this is where the app reads them.
 *
 * The whole catalogue is fetched once and held here, which is the same thing
 * the literal did and is why almost nothing else had to change: `bySlug` still
 * answers instantly, the shop still facets in the browser, and no page needs a
 * loading state per product. That is affordable at this size and stops being
 * affordable somewhere in the low thousands, at which point `/api/catalogue/
 * products` already takes the filters and returns pages.
 *
 * The pure helpers stayed in `src/data/catalogue.ts`. `priceOf` and
 * `stockCapOf` are arithmetic on a product somebody already has, and putting
 * them behind a hook would have meant a context read to add two numbers.
 */
interface CatalogueState {
  products: Product[]
  categories: Category[]
  bySlug: (slug: string) => Product | undefined
  categoryBySlug: (slug: string) => Category | undefined
  /** True until the first load settles, so a page can tell "none" from "not yet". */
  loading: boolean
  /** Set when the catalogue could not be loaded at all, which is a blank shop. */
  error: string | null
  reload: () => void
}

const CatalogueContext = createContext<CatalogueState | null>(null)

/**
 * The shop is small enough to ask for whole, and the backend caps the page.
 *
 * `detail=1` asks for full products rather than the grid summaries, because
 * `bySlug` has to answer a product page and that reads description, specs and
 * reviews. The literal this replaced shipped all of it to every visitor too, so
 * this is no heavier than what was there before.
 */
const PAGE_SIZE = 200

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true

    const load = async () => {
      setLoading(true)
      const [productsResult, categoriesResult] = await Promise.all([
        api.get<{ items: Product[] }>(`/api/catalogue/products?pageSize=${PAGE_SIZE}&detail=1`),
        api.get<Category[]>('/api/catalogue/categories'),
      ])
      if (!live) return

      if (productsResult.ok && categoriesResult.ok) {
        setProducts(productsResult.data.items ?? [])
        setCategories(categoriesResult.data ?? [])
        setError(null)
      } else {
        // Whichever failed, the shop has nothing to show, so one message
        // covers both rather than two half-loaded states to reason about.
        setError(
          (!productsResult.ok && productsResult.message) ||
            (!categoriesResult.ok && categoriesResult.message) ||
            'We could not load the shop just now.',
        )
      }
      setLoading(false)
    }

    void load()
    return () => {
      live = false
    }
  }, [attempt])

  const value = useMemo<CatalogueState>(
    () => ({
      products,
      categories,
      bySlug: (slug) => products.find((p) => p.slug === slug),
      categoryBySlug: (slug) => categories.find((c) => c.slug === slug),
      loading,
      error,
      reload: () => setAttempt((n) => n + 1),
    }),
    [products, categories, loading, error],
  )

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
}

/**
 * Throws rather than returning a default, because every caller renders the shop
 * and an empty catalogue that looks like a sold-out shop is worse than a loud
 * failure at the one place the provider is missing.
 */
export function useCatalogue(): CatalogueState {
  const value = useContext(CatalogueContext)
  if (!value) throw new Error('useCatalogue must be used inside a CatalogueProvider')
  return value
}
