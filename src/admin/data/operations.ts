/**
 * The shapes the admin console works in.
 *
 * This file used to carry 400 lines of invented orders, quotes, fittings and
 * stock as well, with a header calling itself a prototype. The console now
 * reads all of that from the backend through `./api`, and what is left here is
 * the vocabulary: the statuses, what they are called on screen, and the order
 * staff work them in.
 *
 * The field names match what the backend sends on purpose. They were chosen on
 * that side to match these, so that connecting the two was a change of source
 * rather than a rename through nine pages.
 */

export type OrderStatus = 'new' | 'packing' | 'dispatched' | 'delivered' | 'cancelled'

export type QuoteStatus =
  | 'new'
  | 'measure_booked'
  | 'measured'
  | 'sent'
  | 'approved'
  | 'in_production'
  | 'fitted'
  | 'lost'

export type PayMethod = 'mpesa' | 'card' | 'cod'

export type FittingStatus = 'booked' | 'done' | 'cancelled'

/**
 * An order as the queue lists it.
 *
 * `id` is the reference, e.g. KC-260819-K4P2, not a row id. It is what staff
 * read down a phone line, what goes on the packing slip, and what the console
 * routes on, so it is the handle everywhere.
 *
 * The total arrives computed. It used to be worked out in the browser from the
 * lines, which meant the figure on screen was the browser's opinion rather than
 * what the shop actually charged.
 */
export interface Order {
  id: string
  customer: string
  phone: string | null
  town: string | null
  county: string | null
  placedAt: string
  status: OrderStatus
  pay: PayMethod
  paid: boolean
  items: number
  /** The lead line, which is all the queue prints beside the item count. */
  firstProduct: string | null
  total: number
  courier?: string | null
}

export interface OrderLine {
  name: string
  variant: string | null
  slug: string | null
  qty: number
  unitPrice: number
  amount: number
}

export interface OrderEvent {
  status: OrderStatus
  note: string | null
  at: string
}

/** One order in full, for the detail screen. */
export interface OrderFull {
  id: string
  customer: string
  email: string
  phone: string | null
  address: string | null
  county: string | null
  town: string | null
  deliveryNotes: string | null
  placedAt: string
  status: OrderStatus
  /** What the server will accept next, so the console never offers a refused button. */
  nextAllowed: OrderStatus[]
  pay: PayMethod
  paid: boolean
  lines: OrderLine[]
  subtotal: number
  delivery: number
  total: number
  courier: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  history: OrderEvent[]
}

export interface Quote {
  id: string
  customer: string
  phone: string
  email: string | null
  area: string | null
  requestedAt: string
  status: QuoteStatus
  owner: string | null
  source: 'website' | 'whatsapp' | 'phone' | 'showroom'
  measureSlot: string | null
  sentAt: string | null
  windows: number
  /** The lead line and how many there are, which is all the queue prints. */
  firstProduct: string | null
  lineCount: number
  total: number
  /** Every line has a figure against it, which is what sending is gated on. */
  priced: boolean
}

export interface QuoteLineItem {
  id: number
  product: string
  productSlug: string | null
  colour: string | null
  room: string | null
  widthCm?: number | null
  dropCm?: number | null
  windows: number
  notes?: string | null
  indicativeAmount: number | null
  /** Null until staff price it. */
  pricedTotal: number | null
}

export interface QuoteEvent {
  status: QuoteStatus
  note: string | null
  actor: string | null
  at: string
}

/** One quote in full, for the builder. */
export interface QuoteFull {
  id: string
  customer: string
  phone: string
  email: string | null
  area: string | null
  preferredTime: string | null
  requestedAt: string
  status: QuoteStatus
  nextAllowed: QuoteStatus[]
  owner: string | null
  source: string
  measureSlot: string | null
  sentAt: string | null
  validUntil: string | null
  lines: QuoteLineItem[]
  subtotal: number
  fittingAmount: number
  discountPercent: number
  total: number
  depositDue: number
  depositPaid: boolean
  balancePaid: boolean
  priced: boolean
  staffNotes: string | null
  approvedAt: string | null
  history: QuoteEvent[]
}

export interface Fitting {
  id: number
  kind: 'measure' | 'fitting'
  customer: string
  phone: string | null
  area: string | null
  date: string
  time: string
  fitter: string | null
  fitterId: number | null
  quoteId: string | null
  windows: number
  notes: string | null
  status: FittingStatus
}

export interface StockRow {
  slug: string
  name: string
  category: string
  mode: 'buy' | 'quote'
  price: number
  stock: number
  reorderAt: number
  unit: string
}

/** A customer, assembled by the backend from the orders and quotes they left. */
export interface CustomerRow {
  name: string
  phone: string | null
  email: string | null
  area: string | null
  userId: number | null
  orderCount: number
  quoteCount: number
  spent: number
  pipeline: number
  segment: 'retail' | 'trade' | 'both'
  last: string
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  new: 'New',
  packing: 'Packing',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  new: 'New request',
  measure_booked: 'Measure booked',
  measured: 'Measured',
  sent: 'Quote sent',
  approved: 'Approved',
  in_production: 'In production',
  fitted: 'Fitted',
  lost: 'Lost',
}

/** The quote pipeline in the order staff actually work it. */
export const quotePipeline: QuoteStatus[] = [
  'new',
  'measure_booked',
  'measured',
  'sent',
  'approved',
  'in_production',
  'fitted',
]
