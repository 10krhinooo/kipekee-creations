import type { Product } from './types'

/**
 * Changes staff have made to the catalogue from the console.
 *
 * The catalogue in `./catalogue.ts` is written by hand and shipped with the
 * build, which is right for a seed and useless as a shop: a price change meant
 * a developer, a commit and a deploy. Staff needed to be able to move a price,
 * correct a stock count and put a new product up, so this layer sits over the
 * seed and records what they changed.
 *
 * Only the changed fields are stored, never a whole copy of the product. A
 * stored copy would freeze everything else about it at the moment somebody
 * edited the price, so a later fix to a description or a photograph in the
 * seed would silently never reach the shop.
 *
 * This is the prototype's stand-in for a products table. When the real backend
 * lands, it reads from that instead and this file goes.
 */

const STORAGE_KEY = 'kipekee.catalogue.v1'

/** Fired after any catalogue write, for the same tab. `storage` covers others. */
export const CATALOGUE_EVENT = 'kipekee:catalogue'

/**
 * The fields the console may change.
 *
 * Narrow on purpose. Editing `colours` or `photos` needs its own screen with
 * its own controls, and letting a free-text field write `pattern` or `accent`
 * would put values in that the renderer has no case for.
 */
export type ProductPatch = Partial<
  Pick<
    Product,
    | 'name'
    | 'category'
    | 'mode'
    | 'price'
    | 'compareAt'
    | 'unit'
    | 'summary'
    | 'stock'
    | 'reorderAt'
    | 'leadTimeDays'
  >
>

interface Stored {
  /** Patches over seeded products, keyed by slug. */
  edits: Record<string, ProductPatch>
  /** Products staff created, which have no seed to patch. */
  added: Product[]
}

const empty = (): Stored => ({ edits: {}, added: [] })

function read(): Stored {
  if (typeof localStorage === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<Stored>
    return {
      edits: parsed.edits ?? {},
      added: Array.isArray(parsed.added) ? parsed.added : [],
    }
  } catch {
    // A corrupt store should cost the edits, not the shop. Fall back to the
    // seed rather than throwing on the way to rendering the catalogue.
    return empty()
  }
}

function write(next: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private browsing and full quotas both land here. The change still applies
    // for this session, it just will not outlive a reload.
  }
  window.dispatchEvent(new Event(CATALOGUE_EVENT))
}

/** The seed with staff changes folded in. Added products come last. */
export function applyEdits(seed: Product[]): Product[] {
  const { edits, added } = read()
  return [...seed, ...added].map((p) => {
    const patch = edits[p.slug]
    return patch ? { ...p, ...patch } : p
  })
}

/** Records a change to one product. Merges with anything already changed on it. */
export function recordEdit(slug: string, patch: ProductPatch) {
  const stored = read()
  write({ ...stored, edits: { ...stored.edits, [slug]: { ...stored.edits[slug], ...patch } } })
}

/** Records a product staff created. */
export function recordNew(product: Product) {
  const stored = read()
  write({ ...stored, added: [...stored.added, product] })
}

/** Drops every staff change, for getting back to the shipped catalogue. */
export function clearEdits() {
  write(empty())
}
