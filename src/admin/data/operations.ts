import { addDays, slotLabel, startOfWeek, toDateKey } from './calendar'

/**
 * Mock operational data for the admin prototype.
 *
 * The shapes here mirror what the storefront actually produces: paid orders
 * from the cart, and quote requests from the quote basket. Those are two
 * different workflows with two different queues, which is why the admin has a
 * separate screen for each rather than one merged "orders" table.
 */

/**
 * A seeded timestamp, as hours before whenever the console is opened.
 *
 * The seed used to carry fixed dates in August 2026 and measure elapsed time
 * against a fixed "now" beside them. That works for exactly as long as nothing
 * real arrives. The moment a customer submitted a quote, it was timestamped by
 * the actual clock, measured against the frozen one, and the queue reported
 * its age as -884h.
 *
 * Offsets rather than dates, so the seeded rows keep their story - this one
 * came in two hours ago, that one eleven days ago - and live submissions sit
 * among them in the right order on any day the console is opened.
 */
const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3.6e6).toISOString()

/**
 * How long something has been waiting. Shared so the dashboard, the quote
 * queue and the notifications panel cannot report different ages for the same
 * row.
 *
 * Clamped at zero. A timestamp in the future is a clock-skew problem, not a
 * negative age, and "-3h waiting" on a work queue reads as a broken screen.
 */
export const since = (iso: string) => {
  const hours = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3.6e6))
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
}

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

export interface OrderLine {
  name: string
  variant: string
  qty: number
  unitPrice: number
}

export interface Order {
  id: string
  customer: string
  phone: string
  town: string
  placedAt: string
  status: OrderStatus
  pay: PayMethod
  paid: boolean
  lines: OrderLine[]
  delivery: number
  /** Set once dispatched, so the table can show a courier reference. */
  courier?: string
  /**
   * The M-Pesa code the customer entered after paying. Present only on orders
   * placed through the site, and only when they paid before placing it.
   */
  mpesaCode?: string
  /** The street address, on orders that came from checkout with one. */
  address?: string
}

export interface QuoteLineItem {
  product: string
  colour: string
  room: string
  widthCm?: number
  dropCm?: number
  windows: number
  /** Filled in by staff when pricing the job. Null until priced. */
  pricedTotal: number | null
  notes?: string
}

export interface Quote {
  id: string
  customer: string
  phone: string
  area: string
  requestedAt: string
  status: QuoteStatus
  /** Who owns this quote in the workshop. */
  owner: string
  items: QuoteLineItem[]
  /** A slot staff have actually booked with a fitter. */
  measureSlot?: string
  /**
   * When the customer said they would like to be visited. Their wish, not a
   * booking: the console used to file it under `measureSlot`, so a quote
   * nobody had touched showed "Measure booked: As soon as possible".
   */
  preferredTime?: string
  sentAt?: string
  source: 'website' | 'whatsapp' | 'phone' | 'showroom'
}

export interface Fitting {
  id: string
  kind: 'measure' | 'fitting'
  customer: string
  area: string
  date: string
  time: string
  fitter: string
  quoteId?: string
  windows: number
}

export const orders: Order[] = [
  {
    id: 'KC-2418',
    customer: 'Njeri Gathoni',
    phone: '0722 418 902',
    town: 'Nairobi',
    placedAt: hoursAgo(3.8),
    status: 'new',
    pay: 'mpesa',
    paid: true,
    delivery: 0,
    lines: [
      { name: 'Embroidered Cushion Cover', variant: 'Brick, 45 x 45 cm', qty: 6, unitPrice: 1250 },
      { name: 'Woven Table Mat Set', variant: 'Natural, set of 6', qty: 1, unitPrice: 1650 },
    ],
  },
  {
    id: 'KC-2417',
    customer: 'Daniel Mwangi',
    phone: '0733 210 554',
    town: 'Nairobi',
    placedAt: hoursAgo(4.93),
    status: 'packing',
    pay: 'mpesa',
    paid: true,
    delivery: 0,
    lines: [{ name: 'Cotton Velvet, by the Metre', variant: 'Wine', qty: 12, unitPrice: 2650 }],
  },
  {
    id: 'KC-2416',
    customer: 'Anne Wairimu',
    phone: '0715 883 042',
    town: 'Kiambu',
    placedAt: hoursAgo(20.32),
    status: 'dispatched',
    pay: 'card',
    paid: true,
    delivery: 450,
    courier: 'G4S 8841203',
    lines: [{ name: 'Egyptian Cotton Towel Set', variant: 'Teal, set of 4', qty: 2, unitPrice: 3900 }],
  },
  {
    id: 'KC-2415',
    customer: 'Joseph Kariuki',
    phone: '0701 337 118',
    town: 'Nakuru',
    placedAt: hoursAgo(25.67),
    status: 'dispatched',
    pay: 'mpesa',
    paid: true,
    delivery: 450,
    courier: 'Wells Fargo 22910',
    lines: [
      { name: 'Triple-Weave Blockout Lining', variant: 'Ivory', qty: 30, unitPrice: 950 },
    ],
  },
  {
    id: 'KC-2414',
    customer: 'Halima Said',
    phone: '0729 004 761',
    town: 'Mombasa',
    placedAt: hoursAgo(46.08),
    status: 'delivered',
    pay: 'mpesa',
    paid: true,
    delivery: 450,
    courier: 'G4S 8839114',
    lines: [
      { name: 'Embroidered Cushion Cover', variant: 'Indigo, 50 x 50 cm', qty: 4, unitPrice: 1500 },
      { name: 'Embroidered Decor Towel Pair', variant: 'Ivory', qty: 2, unitPrice: 1350 },
    ],
  },
  {
    id: 'KC-2413',
    customer: 'Kevin Mutiso',
    phone: '0768 552 190',
    town: 'Nairobi',
    placedAt: hoursAgo(50.97),
    status: 'delivered',
    pay: 'cod',
    paid: true,
    delivery: 0,
    lines: [
      { name: 'Geometric Woven Cushion Cover', variant: 'Ochre, 45 x 45 cm', qty: 8, unitPrice: 1100 },
      { name: 'Ceramic Bathroom Accessory Set', variant: 'Stone', qty: 1, unitPrice: 2750 },
    ],
  },
  {
    id: 'KC-2412',
    customer: 'Faith Wambui',
    phone: '0711 620 337',
    town: 'Nairobi',
    placedAt: hoursAgo(69.45),
    status: 'cancelled',
    pay: 'mpesa',
    paid: false,
    delivery: 0,
    lines: [{ name: 'Cotton Velvet, by the Metre', variant: 'Forest', qty: 4, unitPrice: 2650 }],
  },
  {
    id: 'KC-2411',
    customer: 'Esther Muthoni',
    phone: '0745 118 209',
    town: 'Nakuru',
    placedAt: hoursAgo(75.7),
    status: 'delivered',
    pay: 'card',
    paid: true,
    delivery: 450,
    courier: 'Wells Fargo 22887',
    lines: [{ name: 'Woven Table Mat Set', variant: 'Charcoal, set of 6 + 2 runners', qty: 1, unitPrice: 2550 }],
  },
]

export const quotes: Quote[] = [
  {
    id: 'Q-0912',
    customer: 'Wanjiru Maina',
    phone: '0721 445 118',
    area: 'Kileleshwa',
    requestedAt: hoursAgo(2.32),
    status: 'new',
    owner: 'Unassigned',
    source: 'website',
    items: [
      {
        product: 'Kitenge Blockout Curtains',
        colour: 'Warm sand',
        room: 'Bedroom',
        widthCm: 220,
        dropCm: 240,
        windows: 2,
        pricedTotal: null,
        notes: 'North facing, gets very hot in the afternoon.',
      },
      {
        product: 'Sheer Linen Voile Curtains',
        colour: 'Ivory',
        room: 'Living room',
        widthCm: 310,
        dropCm: 250,
        windows: 1,
        pricedTotal: null,
      },
    ],
  },
  {
    id: 'Q-0911',
    customer: 'Michael Achieng',
    phone: '0700 918 220',
    area: 'Karen',
    requestedAt: hoursAgo(4.08),
    status: 'new',
    owner: 'Unassigned',
    source: 'whatsapp',
    items: [
      {
        product: 'Hand-Forged Curtain Rail',
        colour: 'Matte black',
        room: 'Living room',
        widthCm: 300,
        windows: 3,
        pricedTotal: null,
        notes: 'Scroll finials. Wants to match an existing rail upstairs.',
      },
    ],
  },
  {
    id: 'Q-0910',
    customer: 'Mercy Atieno',
    phone: '0736 552 004',
    area: 'Kitengela',
    requestedAt: hoursAgo(22.8),
    status: 'measure_booked',
    owner: 'Peter K.',
    source: 'website',
    // Booked, not yet visited, so the slot has to be ahead of today.
    measureSlot: slotLabel(2, '10:00'),
    items: [
      {
        product: 'Kids Cloud Print Curtains',
        colour: 'Sky',
        room: 'Kids room',
        windows: 2,
        pricedTotal: null,
      },
    ],
  },
  {
    id: 'Q-0909',
    customer: 'Beatrice Kilonzo',
    phone: '0723 771 890',
    area: 'Runda',
    requestedAt: hoursAgo(27.5),
    status: 'measured',
    owner: 'Peter K.',
    source: 'showroom',
    // Already measured, so the visit is behind us.
    measureSlot: slotLabel(-1, '14:00'),
    items: [
      {
        product: 'Four-Poster Bed Canopy',
        colour: 'Ivory',
        room: 'Bedroom',
        widthCm: 180,
        dropCm: 220,
        windows: 1,
        pricedTotal: 11700,
      },
      {
        product: 'Kitenge Blockout Curtains',
        colour: 'Deep olive',
        room: 'Bedroom',
        widthCm: 240,
        dropCm: 260,
        windows: 1,
        pricedTotal: 8400,
      },
    ],
  },
  {
    id: 'Q-0908',
    customer: 'Grace Njoki',
    phone: '0708 224 561',
    area: 'Lavington',
    requestedAt: hoursAgo(49.92),
    status: 'sent',
    owner: 'Alice W.',
    source: 'website',
    sentAt: hoursAgo(28),
    items: [
      {
        product: 'Sheer Linen Voile Curtains',
        colour: 'Oyster',
        room: 'Living room',
        widthCm: 380,
        dropCm: 270,
        windows: 2,
        pricedTotal: 15300,
      },
    ],
  },
  {
    id: 'Q-0907',
    customer: 'Naivasha Lodge',
    phone: '0790 118 442',
    area: 'Naivasha',
    requestedAt: hoursAgo(68.67),
    status: 'sent',
    owner: 'Alice W.',
    source: 'phone',
    sentAt: hoursAgo(43.5),
    items: [
      {
        product: 'Contract Hotel Bed Linen Set',
        colour: 'Hotel white',
        room: 'Hotel & hospitality',
        windows: 64,
        pricedTotal: 268800,
        notes: '64 rooms, queen. Phased across two floors.',
      },
      {
        product: 'Hotel Pool & Spa Towels',
        colour: 'White',
        room: 'Hotel & hospitality',
        windows: 200,
        pricedTotal: 156000,
      },
    ],
  },
  {
    id: 'Q-0906',
    customer: 'Peter Ochieng',
    phone: '0741 009 233',
    area: 'Syokimau',
    requestedAt: hoursAgo(98.27),
    status: 'approved',
    owner: 'Alice W.',
    source: 'website',
    sentAt: hoursAgo(74),
    items: [
      {
        product: 'Kitenge Blockout Curtains',
        colour: 'Charcoal',
        room: 'Living room',
        widthCm: 280,
        dropCm: 250,
        windows: 2,
        pricedTotal: 19600,
      },
    ],
  },
  {
    id: 'Q-0905',
    customer: 'Zainab Hassan',
    phone: '0712 883 447',
    area: 'Nyali',
    requestedAt: hoursAgo(143.75),
    status: 'in_production',
    owner: 'Peter K.',
    source: 'whatsapp',
    sentAt: hoursAgo(123.67),
    items: [
      {
        product: 'Hand-Forged Curtain Rail',
        colour: 'Antique bronze',
        room: 'Living room',
        widthCm: 260,
        windows: 4,
        pricedTotal: 30160,
      },
    ],
  },
  {
    id: 'Q-0904',
    customer: 'Sharon Muriuki',
    phone: '0729 552 118',
    area: 'Rongai',
    requestedAt: hoursAgo(243.97),
    status: 'fitted',
    owner: 'Peter K.',
    source: 'website',
    sentAt: hoursAgo(219),
    items: [
      {
        product: 'Kids Play Canopy',
        colour: 'Blush',
        room: 'Kids room',
        windows: 1,
        pricedTotal: 4200,
      },
    ],
  },
  {
    id: 'Q-0903',
    customer: 'Samuel Kiprop',
    phone: '0703 118 990',
    area: 'Runda',
    requestedAt: hoursAgo(285.2),
    status: 'lost',
    owner: 'Alice W.',
    source: 'website',
    sentAt: hoursAgo(261),
    items: [
      {
        product: 'Sheer Linen Voile Curtains',
        colour: 'Soft grey',
        room: 'Living room',
        widthCm: 200,
        dropCm: 230,
        windows: 1,
        pricedTotal: 6900,
        notes: 'Went with a cheaper quote from town.',
      },
    ],
  },
]

/*
 * The fitters' diary, anchored to whatever week it is now.
 *
 * These were fixed dates in August 2026, so the schedule showed an empty week
 * from the moment that week passed. `weekday` is an offset from Monday, and
 * the date is resolved when the module loads, which keeps the demo populated
 * and, more usefully, keeps the seed honest about what a live diary looks
 * like: visits clustered near today rather than in a fossilised week.
 */
const bookings: (Omit<Fitting, 'date'> & { weekday: number })[] = [
  { id: 'F-01', kind: 'measure', customer: 'Mercy Atieno', area: 'Kitengela', weekday: 0, time: '10:00', fitter: 'Peter K.', quoteId: 'Q-0910', windows: 2 },
  { id: 'F-02', kind: 'measure', customer: 'Wanjiru Maina', area: 'Kileleshwa', weekday: 0, time: '14:00', fitter: 'Peter K.', quoteId: 'Q-0912', windows: 3 },
  { id: 'F-03', kind: 'fitting', customer: 'Peter Ochieng', area: 'Syokimau', weekday: 1, time: '09:00', fitter: 'John M.', quoteId: 'Q-0906', windows: 2 },
  { id: 'F-04', kind: 'measure', customer: 'Michael Achieng', area: 'Karen', weekday: 1, time: '15:30', fitter: 'Peter K.', quoteId: 'Q-0911', windows: 3 },
  { id: 'F-05', kind: 'fitting', customer: 'Zainab Hassan', area: 'Nyali', weekday: 2, time: '11:00', fitter: 'John M.', quoteId: 'Q-0905', windows: 4 },
  { id: 'F-06', kind: 'measure', customer: 'Beatrice Kilonzo', area: 'Runda', weekday: 3, time: '10:30', fitter: 'Peter K.', quoteId: 'Q-0909', windows: 1 },
  { id: 'F-07', kind: 'fitting', customer: 'Grace Njoki', area: 'Lavington', weekday: 4, time: '13:00', fitter: 'John M.', quoteId: 'Q-0905', windows: 2 },
]

export const fittings: Fitting[] = bookings.map(({ weekday, ...rest }) => ({
  ...rest,
  date: toDateKey(addDays(startOfWeek(), weekday)),
}))


/** Revenue for the last 14 days, used by the dashboard chart. */
export const revenueSeries = [
  { day: '03 Aug', orders: 41200, quotes: 0 },
  { day: '04 Aug', orders: 28500, quotes: 6900 },
  { day: '05 Aug', orders: 33800, quotes: 0 },
  { day: '06 Aug', orders: 19400, quotes: 4200 },
  { day: '07 Aug', orders: 52100, quotes: 0 },
  { day: '08 Aug', orders: 47600, quotes: 18300 },
  { day: '09 Aug', orders: 12800, quotes: 0 },
  { day: '10 Aug', orders: 24900, quotes: 30160 },
  { day: '11 Aug', orders: 38200, quotes: 0 },
  { day: '12 Aug', orders: 44100, quotes: 19600 },
  { day: '13 Aug', orders: 31700, quotes: 424800 },
  { day: '14 Aug', orders: 26400, quotes: 15300 },
  { day: '15 Aug', orders: 58300, quotes: 20100 },
  { day: '16 Aug', orders: 36150, quotes: 0 },
]

export const orderTotal = (o: Order) =>
  o.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0) + o.delivery

export const quoteTotal = (q: Quote) =>
  q.items.reduce((sum, i) => sum + (i.pricedTotal ?? 0), 0)

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
