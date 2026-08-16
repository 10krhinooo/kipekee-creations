/**
 * The catalogue splits into two commercial modes, which is the core fix for the
 * old site: ready-made stock can be bought outright, made-to-measure work is
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
  /** Shown on the category tile, the old site gave shoppers no context at all. */
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
  author: string
  location: string
  rating: number
  date: string
  body: string
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
