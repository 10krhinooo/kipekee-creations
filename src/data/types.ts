/**
 * The catalogue splits into two commercial modes, which is the core fix for the
 * business: ready-made stock can be bought outright, made-to-measure work is
 * quoted. Every surface in the app branches on `mode`.
 */
export type SellMode = 'buy' | 'quote'

export type Room =
  | 'Living room'
  | 'Bedroom'
  | 'Kitchen'
  | 'Bathroom'
  | 'Kids room'
  | 'Hotel & hospitality'
  | 'Outdoor'

export type PatternKind =
  | 'plain'
  | 'weave'
  | 'embroidery'
  | 'geometric'
  | 'damask'
  | 'stripe'
  | 'sheer'
  | 'iron'
  | 'ceramic'

export interface Category {
  slug: string
  name: string
  /** Shown on the category tile, so a shopper knows what is behind it. */
  blurb: string
  parent?: string
  mode: SellMode
  pattern: PatternKind
  accent: string
}

export interface Variant {
  id: string
  label: string
  swatch: string
  /** Price delta in KES against the product base price. */
  delta?: number
  inStock: boolean
}

export interface SpecRow {
  label: string
  value: string
}

export interface Review {
  /** Absent on the reviews that came over with the catalogue. */
  id?: number
  author: string
  location: string
  rating: number
  date: string
  body: string
}

/**
 * A real photograph of a product.
 *
 * Every other image in this app is generated from `pattern` and `accent`, which
 * proves the colourway and the drape but cannot show stitching, a finished hem,
 * or the cloth hanging in somebody's front room. Photos are the one image source
 * that can, so they are modelled rather than derived.
 */
export interface ProductPhoto {
  /**
   * `/api/media/{name}` from an upload, an absolute path under `/photos`, or
   * an https URL. Only the first needs `mediaUrl()` from `src/lib/api.ts`
   * before it goes in an `<img>`, since it is served by the backend rather
   * than same-origin.
   */
  src: string
  alt: string
  /** Ties a photo to a colourway, so choosing a colour surfaces its photos first. */
  colourId?: string
  caption?: string
  /** Landscape shots take a two-column cell so the grid does not letterbox them. */
  wide?: boolean
}

export interface Product {
  slug: string
  name: string
  category: string
  rooms: Room[]
  mode: SellMode
  /** For `buy`: the selling price. For `quote`: the indicative "from" price. */
  price: number
  compareAt?: number
  /** Unit the price is expressed in, e.g. "per metre", "per pair", "each". */
  unit: string
  summary: string
  description: string[]
  pattern: PatternKind
  accent: string
  colours: Variant[]
  sizes?: Variant[]
  specs: SpecRow[]
  care: string[]
  rating: number
  reviewCount: number
  reviews: Review[]
  stock: number
  leadTimeDays: number
  badges?: string[]
  bestSeller?: boolean
  /**
   * From the backend: both what shipped with the catalogue and whatever staff
   * have since uploaded through the console, in the same list. Optional
   * because a product with no photography yet simply does not offer the tab.
   */
  photos?: ProductPhoto[]
}

/** A line in the payable cart. */
export interface CartLine {
  slug: string
  qty: number
  colour: string
  size?: string
}

/** A line in the quote basket, carrying the measurements a quote needs. */
export interface QuoteLine {
  slug: string
  colour: string
  room: string
  widthCm?: number
  dropCm?: number
  windows: number
  notes?: string
}
