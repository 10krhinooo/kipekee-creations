import { useMemo } from 'react'
import { categoryBySlug } from '../../data/catalogue'
import { useCatalogue } from '../../data/catalogueStore'
import type { Product } from '../../data/types'

/**
 * A product as the console lists it.
 *
 * This used to be a hand-written array of thirteen rows living beside the
 * catalogue's eighteen products, with its own prices and its own stock counts.
 * The two had drifted: five products, the whole hotel linen range among them,
 * did not appear in the console at all, and of the ones that did, the console
 * said nine towel sets were left while the shop was selling twenty-four. Rows
 * are derived from the catalogue now, so there is one number and both halves
 * read it.
 */
export interface StockRow {
  slug: string
  name: string
  /** The category's display name, not its slug. */
  category: string
  mode: Product['mode']
  price: number
  stock: number
  reorderAt: number
  unit: string
}

/** Where the reorder level falls back to when a product has never had one set. */
const DEFAULT_REORDER = 10

export const rowOf = (p: Product): StockRow => ({
  slug: p.slug,
  name: p.name,
  category: categoryBySlug(p.category)?.name ?? p.category,
  mode: p.mode,
  price: p.price,
  stock: p.stock,
  reorderAt: p.reorderAt ?? (p.mode === 'buy' ? DEFAULT_REORDER : 0),
  unit: p.unit,
})

/**
 * Whether a row is asking to be reordered.
 *
 * Only ready-made goods can be: made-to-measure work is cut to order, so its
 * stock figure is always zero and a shared test would have every quoted
 * product permanently screaming for a restock.
 */
export const isLow = (s: StockRow) => s.mode === 'buy' && s.stock <= s.reorderAt

/** Every product, as console rows, re-rendering when staff change one. */
export function useStock(): StockRow[] {
  const products = useCatalogue()
  return useMemo(() => products.map(rowOf), [products])
}
