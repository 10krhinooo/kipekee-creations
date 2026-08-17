/**
 * Mock operational data for the admin prototype.
 *
 * The shapes here mirror what the storefront actually produces: paid orders
 * from the cart, and quote requests from the quote basket. Those are two
 * different workflows with two different queues, which is why the admin has a
 * separate screen for each rather than one merged "orders" table.
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
  measureSlot?: string
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

export const orders: Order[] = [
  {
    id: 'KC-2418',
    customer: 'Njeri Gathoni',
    phone: '0722 418 902',
    town: 'Nairobi',
    placedAt: '2026-08-16T09:12:00',
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
    placedAt: '2026-08-16T08:04:00',
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
    placedAt: '2026-08-15T16:41:00',
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
    placedAt: '2026-08-15T11:20:00',
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
    placedAt: '2026-08-14T14:55:00',
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
    placedAt: '2026-08-14T10:02:00',
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
    placedAt: '2026-08-13T15:33:00',
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
    placedAt: '2026-08-13T09:18:00',
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
    requestedAt: '2026-08-16T10:41:00',
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
    requestedAt: '2026-08-16T08:55:00',
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
    requestedAt: '2026-08-15T14:12:00',
    status: 'measure_booked',
    owner: 'Peter K.',
    source: 'website',
    measureSlot: 'Mon 18 Aug, 10:00',
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
    requestedAt: '2026-08-15T09:30:00',
    status: 'measured',
    owner: 'Peter K.',
    source: 'showroom',
    measureSlot: 'Fri 15 Aug, 14:00',
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
    requestedAt: '2026-08-14T11:05:00',
    status: 'sent',
    owner: 'Alice W.',
    source: 'website',
    sentAt: '2026-08-15T09:00:00',
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
    requestedAt: '2026-08-13T16:20:00',
    status: 'sent',
    owner: 'Alice W.',
    source: 'phone',
    sentAt: '2026-08-14T17:30:00',
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
    requestedAt: '2026-08-12T10:44:00',
    status: 'approved',
    owner: 'Alice W.',
    source: 'website',
    sentAt: '2026-08-13T11:00:00',
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
    requestedAt: '2026-08-10T13:15:00',
    status: 'in_production',
    owner: 'Peter K.',
    source: 'whatsapp',
    sentAt: '2026-08-11T09:20:00',
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
    requestedAt: '2026-08-06T09:02:00',
    status: 'fitted',
    owner: 'Peter K.',
    source: 'website',
    sentAt: '2026-08-07T10:00:00',
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
    requestedAt: '2026-08-04T15:48:00',
    status: 'lost',
    owner: 'Alice W.',
    source: 'website',
    sentAt: '2026-08-05T16:00:00',
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

export const fittings: Fitting[] = [
  { id: 'F-01', kind: 'measure', customer: 'Mercy Atieno', area: 'Kitengela', date: '2026-08-18', time: '10:00', fitter: 'Peter K.', quoteId: 'Q-0910', windows: 2 },
  { id: 'F-02', kind: 'measure', customer: 'Wanjiru Maina', area: 'Kileleshwa', date: '2026-08-18', time: '14:00', fitter: 'Peter K.', quoteId: 'Q-0912', windows: 3 },
  { id: 'F-03', kind: 'fitting', customer: 'Peter Ochieng', area: 'Syokimau', date: '2026-08-19', time: '09:00', fitter: 'John M.', quoteId: 'Q-0906', windows: 2 },
  { id: 'F-04', kind: 'measure', customer: 'Michael Achieng', area: 'Karen', date: '2026-08-19', time: '15:30', fitter: 'Peter K.', quoteId: 'Q-0911', windows: 3 },
  { id: 'F-05', kind: 'fitting', customer: 'Zainab Hassan', area: 'Nyali', date: '2026-08-20', time: '11:00', fitter: 'John M.', quoteId: 'Q-0905', windows: 4 },
  { id: 'F-06', kind: 'measure', customer: 'Beatrice Kilonzo', area: 'Runda', date: '2026-08-21', time: '10:30', fitter: 'Peter K.', quoteId: 'Q-0909', windows: 1 },
  { id: 'F-07', kind: 'fitting', customer: 'Grace Njoki', area: 'Lavington', date: '2026-08-22', time: '13:00', fitter: 'John M.', quoteId: 'Q-0905', windows: 2 },
]

export const stock: StockRow[] = [
  { slug: 'embroidered-cushion-cover', name: 'Embroidered Cushion Cover', category: 'Cushion Covers', mode: 'buy', price: 1250, stock: 62, reorderAt: 25, unit: 'each' },
  { slug: 'geometric-cushion-cover', name: 'Geometric Woven Cushion Cover', category: 'Cushion Covers', mode: 'buy', price: 1100, stock: 38, reorderAt: 25, unit: 'each' },
  { slug: 'velvet-upholstery-fabric', name: 'Cotton Velvet, by the Metre', category: 'Fabrics', mode: 'buy', price: 2650, stock: 240, reorderAt: 80, unit: 'per metre' },
  { slug: 'blockout-lining-fabric', name: 'Triple-Weave Blockout Lining', category: 'Fabrics', mode: 'buy', price: 950, stock: 48, reorderAt: 100, unit: 'per metre' },
  { slug: 'embroidered-sheer-fabric', name: 'Embroidered Sheer, by the Metre', category: 'Fabrics', mode: 'buy', price: 1450, stock: 165, reorderAt: 60, unit: 'per metre' },
  { slug: 'egyptian-cotton-towel-set', name: 'Egyptian Cotton Towel Set', category: 'Towels', mode: 'buy', price: 3900, stock: 9, reorderAt: 15, unit: 'set of 4' },
  { slug: 'ceramic-bathroom-set', name: 'Ceramic Bathroom Accessory Set', category: 'Towels', mode: 'buy', price: 2750, stock: 19, reorderAt: 10, unit: 'set of 4' },
  { slug: 'woven-table-mats', name: 'Woven Table Mat Set', category: 'Household', mode: 'buy', price: 1650, stock: 47, reorderAt: 20, unit: 'set of 6' },
  { slug: 'decor-towel-pair', name: 'Embroidered Decor Towel Pair', category: 'Household', mode: 'buy', price: 1350, stock: 12, reorderAt: 15, unit: 'pair' },
  { slug: 'kitenge-blockout-curtains', name: 'Kitenge Blockout Curtains', category: 'Curtains', mode: 'quote', price: 3200, stock: 0, reorderAt: 0, unit: 'per metre' },
  { slug: 'sheer-linen-voile', name: 'Sheer Linen Voile Curtains', category: 'Curtains', mode: 'quote', price: 1850, stock: 0, reorderAt: 0, unit: 'per metre' },
  { slug: 'wrought-iron-curtain-rail', name: 'Hand-Forged Curtain Rail', category: 'Wrought Iron', mode: 'quote', price: 2900, stock: 0, reorderAt: 0, unit: 'per metre' },
  { slug: 'four-poster-bed-canopy', name: 'Four-Poster Bed Canopy', category: 'Bed Canopies', mode: 'quote', price: 8500, stock: 0, reorderAt: 0, unit: 'per bed' },
]

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
