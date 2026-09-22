import { useSyncExternalStore } from 'react'
import { categories, products, seedProducts } from './catalogue'
import {
  CATALOGUE_EVENT,
  type ProductPatch,
  applyEdits,
  clearEdits,
  recordEdit,
  recordNew,
} from './catalogueEdits'
import type { Product } from './types'

/**
 * Reading and writing the live catalogue.
 *
 * `products` in `./catalogue` is the array everything renders from; this is
 * what changes it and what tells React a change happened.
 */

let snapshot: Product[] = products

const listeners = new Set<() => void>()

/**
 * Rebuild the catalogue from the seed plus the stored edits.
 *
 * The array is rewritten in place so every module holding `products` sees the
 * new contents, and `snapshot` is a fresh array so `useSyncExternalStore` can
 * tell that something changed. Both are needed: in place alone never re-renders,
 * a new array alone leaves the existing importers stale.
 */
function refresh() {
  const next = applyEdits(seedProducts)
  products.splice(0, products.length, ...next)
  snapshot = next
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener(CATALOGUE_EVENT, refresh)
  // Another tab: a shopper with the site open in one window should not keep
  // buying at the old price after staff changed it in another.
  window.addEventListener('storage', refresh)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The catalogue, re-rendering the caller whenever staff change it. */
export const useCatalogue = () => useSyncExternalStore(subscribe, () => snapshot, () => snapshot)

/** What a new product needs from staff. Everything else is derived or defaulted. */
export interface ProductDraft {
  name: string
  category: string
  mode: Product['mode']
  price: number
  /** The struck-through "was" price, or 0 for none. */
  compareAt: number
  unit: string
  summary: string
  stock: number
  reorderAt: number
  leadTimeDays: number
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Turn a draft into a product the storefront can render.
 *
 * The fields staff are not asked for are filled from the category rather than
 * left empty, because the product page renders a swatch, a pattern and a
 * colourway whether or not anyone has chosen them yet. One placeholder
 * colourway is honest about that: a real product gets its range set on the
 * photos screen once the shoot has happened.
 */
function build(draft: ProductDraft, slug: string): Product {
  const category = categories.find((c) => c.slug === draft.category)
  const accent = category?.accent ?? '#8d6f52'
  return {
    slug,
    name: draft.name,
    category: draft.category,
    rooms: [],
    mode: draft.mode,
    price: draft.price,
    compareAt: draft.compareAt > 0 ? draft.compareAt : undefined,
    unit: draft.unit,
    summary: draft.summary,
    description: draft.summary ? [draft.summary] : [],
    pattern: category?.pattern ?? 'plain',
    accent,
    colours: [{ id: 'standard', label: 'Standard', swatch: accent, inStock: true }],
    specs: [],
    care: [],
    // Nothing has been reviewed yet, and seeding a rating would be inventing
    // customer opinion about a product nobody has received.
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: draft.mode === 'buy' ? draft.stock : 0,
    reorderAt: draft.mode === 'buy' ? draft.reorderAt : undefined,
    leadTimeDays: draft.leadTimeDays,
  }
}

/** Why a draft cannot be saved, or null if it can. Keyed by field. */
export function validate(draft: ProductDraft, slug: string, existing: Product[]) {
  const errors: Partial<Record<keyof ProductDraft, string>> = {}
  if (!draft.name.trim()) errors.name = 'Give the product a name.'
  else if (!slug) errors.name = 'That name has no letters or numbers in it.'
  if (!draft.category) errors.category = 'Pick a category.'
  if (!Number.isFinite(draft.price) || draft.price <= 0) errors.price = 'Enter a price above zero.'
  if (!draft.unit.trim()) errors.unit = 'Say what the price is per, e.g. "each".'
  // A "was" at or below the live price advertises a saving of nothing, or of a
  // negative number. Better refused here than printed on a product card.
  if (draft.compareAt > 0 && draft.compareAt <= draft.price)
    errors.compareAt = 'The old price has to be above the current one.'
  if (draft.compareAt < 0) errors.compareAt = 'Leave it empty if there is no old price.'
  if (draft.mode === 'buy') {
    if (!Number.isFinite(draft.stock) || draft.stock < 0) errors.stock = 'Stock cannot be negative.'
    if (!Number.isFinite(draft.reorderAt) || draft.reorderAt < 0)
      errors.reorderAt = 'Reorder level cannot be negative.'
  }
  if (!Number.isFinite(draft.leadTimeDays) || draft.leadTimeDays < 0)
    errors.leadTimeDays = 'Lead time cannot be negative.'
  if (slug && existing.some((p) => p.slug === slug)) {
    errors.name = 'There is already a product with that name.'
  }
  return Object.keys(errors).length ? errors : null
}

/**
 * Create a product. Returns its slug, or the errors that stopped it.
 *
 * The slug is derived from the name and then frozen, because it is the product's
 * URL and the key its photographs and its order lines are filed under. Renaming
 * later moves the name and leaves the address alone, which is what a shop wants.
 */
export function createProduct(draft: ProductDraft) {
  const slug = slugify(draft.name)
  const errors = validate(draft, slug, snapshot)
  if (errors) return { ok: false as const, errors }
  recordNew(build(draft, slug))
  refresh()
  return { ok: true as const, slug }
}

/** Change a product. Only the fields passed are touched. */
export function updateProduct(slug: string, patch: ProductPatch) {
  recordEdit(slug, patch)
  refresh()
}

/** Move a stock level by `by`, never below zero. */
export function adjustStock(slug: string, by: number) {
  const product = snapshot.find((p) => p.slug === slug)
  if (!product) return
  updateProduct(slug, { stock: Math.max(0, product.stock + by) })
}

/** Throw away every staff change and go back to the shipped catalogue. */
export function resetCatalogue() {
  clearEdits()
  refresh()
}
