/**
 * A stand-in for the backend, for while the real one is not deployed yet.
 *
 * Everything the app sends goes through `request()` in `./api`, so this hooks
 * in at that one point and answers in the same shape the Quarkus service does:
 * a status code and, on failure, a `message` written for a person to read. No
 * caller knows the difference, which is the point - when the backend goes live
 * nothing here has to be unpicked out of the pages, only switched off.
 *
 * Switch it off with `VITE_MOCK_API=false`. See `.env.example`.
 *
 * State lives in localStorage so a session, a profile edit or a new address
 * survives a reload and the app demos like the real thing. Clearing site data
 * puts the seed accounts back.
 */

import type { Role } from '../auth/AuthProvider'

const STORAGE_KEY = 'kipekee.mock.v1'

/** Roughly what a round trip to Nairobi feels like, so spinners still show. */
const LATENCY_MS = 140

/** How long an invite stays good for, matching the real service's week. */
const INVITE_DAYS = 7

export interface MockResponse {
  status: number
  body?: unknown
}

interface Account {
  id: number
  name: string
  email: string
  phone: string | null
  /** Null while an invite is outstanding: there is nothing to sign in with. */
  password: string | null
  role: Role
  isActive: boolean
  invitePending: boolean
  inviteToken: string | null
  inviteExpiresAt: string | null
  invitedBy: string | null
  invitedAt: string | null
  createdAt: string
}

interface Address {
  id: number
  ownerEmail: string
  label: string | null
  recipient: string
  phone: string | null
  line1: string
  county: string | null
  notes: string | null
  isDefault: boolean
}

interface Db {
  accounts: Account[]
  addresses: Address[]
  /** Saved product slugs, keyed by the owner's email. */
  saved: Record<string, string[]>
  /** Bearer token to the email it was issued for. */
  sessions: Record<string, string>
  /** Password-reset token to the email that asked for it. */
  resets: Record<string, string>
  nextId: number
  /** Bumped for each quote or order, so references look sequential. */
  reference: number
  /** Promotional list sign-ups, lowercased email to when they joined. */
  subscribers: Record<string, string>
  /** Product reviews, keyed by product slug. */
  reviews: Record<string, Review[]>
  /**
   * Placed orders. The route used to hand back a reference and throw the order
   * away, which was fine while nothing needed it. Two things do now: the
   * payment invoice, and deciding whether a reviewer actually bought the thing.
   */
  orders: PlacedOrder[]
  /** Quote requests sent from the storefront, kept whole for the console. */
  quoteRequests: SubmittedQuote[]
}

export interface SubmittedQuote {
  reference: string
  name: string
  phone: string
  email: string | null
  area: string | null
  preferredTime: string
  requestedAt: string
  lines: {
    productName: string
    colour: string | null
    room: string
    widthCm: number | null
    dropCm: number | null
    windows: number
    notes: string | null
  }[]
}

export interface PlacedOrder {
  reference: string
  email: string
  placedAt: string
  /** Product slugs on the order, which is all the review check needs. */
  slugs: string[]
  total: number
}

export interface Review {
  id: number
  slug: string
  author: string
  /** The account that wrote it, so one customer cannot review twice. */
  email: string
  rating: number
  title: string
  body: string
  createdAt: string
  /**
   * Earned, not decorative. True when the reviewer's account has an order
   * containing this product. The prototype used to print this badge on every
   * review regardless, which is the kind of detail that costs a shop its
   * credibility the moment somebody notices.
   */
  verified: boolean
}

const iso = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString()

/**
 * The accounts the real backend seeds in its dev profile, kept in step with
 * the table in the README so the documented passwords actually work here.
 */
function seed(): Db {
  const staff = (
    id: number,
    name: string,
    email: string,
    phone: string,
    role: Role,
  ): Account => ({
    id,
    name,
    email,
    phone,
    password: role === 'ADMIN' ? 'kipekee-admin-dev' : 'kipekee-staff-dev',
    role,
    isActive: true,
    invitePending: false,
    inviteToken: null,
    inviteExpiresAt: null,
    invitedBy: role === 'ADMIN' ? null : 'Wanjiru Kamau',
    invitedAt: role === 'ADMIN' ? null : iso(-40),
    createdAt: iso(-90),
  })

  const customer = (
    id: number,
    name: string,
    email: string,
    phone: string,
  ): Account => ({
    id,
    name,
    email,
    phone,
    password: 'kipekee-customer-dev',
    role: 'CUSTOMER',
    isActive: true,
    invitePending: false,
    inviteToken: null,
    inviteExpiresAt: null,
    invitedBy: null,
    invitedAt: null,
    createdAt: iso(-60),
  })

  return {
    accounts: [
      staff(1, 'Wanjiru Kamau', 'admin@kipekeecreations.co.ke', '0722 771 321', 'ADMIN'),
      staff(2, 'Grace Achieng', 'grace@kipekeecreations.co.ke', '0722 418 902', 'STAFF'),
      staff(3, 'David Mutiso', 'david@kipekeecreations.co.ke', '0733 210 554', 'STAFF'),
      staff(4, 'Workshop Desk', 'workshop@kipekeecreations.co.ke', '0715 883 042', 'STAFF'),
      customer(5, 'Jane Wambui', 'jane@example.com', '0701 337 118'),
      customer(6, 'Sarova Bookings', 'bookings@sarova.example', '0729 004 761'),
    ],
    addresses: [
      {
        id: 1,
        ownerEmail: 'jane@example.com',
        label: 'Home',
        recipient: 'Jane Wambui',
        phone: '0701 337 118',
        line1: 'Kileleshwa, Othaya Road, Apt 4B',
        county: 'Nairobi',
        notes: 'Gate code 1147. Call on arrival.',
        isDefault: true,
      },
      {
        id: 2,
        ownerEmail: 'bookings@sarova.example',
        label: 'Front office',
        recipient: 'Sarova Bookings',
        phone: '0729 004 761',
        line1: 'Sarova Stanley, Kimathi Street',
        county: 'Nairobi',
        notes: null,
        isDefault: true,
      },
    ],
    saved: {
      'jane@example.com': ['kitenge-blockout-curtains', 'sheer-linen-voile'],
      'bookings@sarova.example': ['hotel-linen'],
    },
    sessions: {},
    resets: {},
    nextId: 7,
    reference: 4817,
    subscribers: {},
    reviews: {},
    orders: [],
    quoteRequests: [],
  }
}

/**
 * Fields added after a visitor's store was already written.
 *
 * `load()` returns whatever is in localStorage, and a browser that used this
 * app before reviews existed has a `Db` with no `reviews` key. Every read would
 * then be `undefined[slug]`. Backfilling on load is cheaper and less alarming
 * than wiping somebody's basket and sign-in to add a field.
 */
function migrate(db: Db): Db {
  db.subscribers ??= {}
  db.reviews ??= {}
  db.orders ??= []
  db.quoteRequests ??= []
  return db
}

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed?.accounts)) return migrate(parsed as Db)
    }
  } catch {
    // A corrupt or unreadable store is not worth failing over: reseed.
  }
  const fresh = seed()
  save(fresh)
  return fresh
}

/** Fired after any write, so the console can pick up what a shopper just sent. */
export const DATA_EVENT = 'kipekee:mockdata'

function save(db: Db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Private browsing and full quotas both land here. The session still works
    // for this tab, it just will not outlive a reload.
  }
  // Same tab: `storage` does not fire for the window that wrote, so the admin
  // store would never hear about a quote submitted in this one.
  window.dispatchEvent(new Event(DATA_EVENT))
}

/**
 * Everything the storefront has submitted, for the console to merge with its
 * own seed.
 *
 * Read straight off the stand-in's store rather than through a route, because
 * the console is not a client of this API: it is the other half of the same
 * pretend backend. When the real service lands, both halves start reading it
 * and this function is what gets deleted.
 */
export function submitted() {
  const db = load()
  return { quotes: db.quoteRequests, orders: db.orders }
}

const ok = (body?: unknown): MockResponse => ({ status: body === undefined ? 204 : 200, body })
const fail = (status: number, message: string): MockResponse => ({ status, body: { message } })

const token = () => `mock.${Math.random().toString(36).slice(2)}.${Date.now().toString(36)}`

/** What the app stores as a session, and what `/session` re-reads. */
const profileOf = (a: Account) => ({
  name: a.name,
  email: a.email,
  phone: a.phone,
  role: a.role,
})

const staffOf = (a: Account) => ({
  id: a.id,
  name: a.name,
  email: a.email,
  phone: a.phone,
  role: a.role,
  isActive: a.isActive,
  invitePending: a.invitePending,
  invitedBy: a.invitedBy,
  invitedAt: a.invitedAt,
  createdAt: a.createdAt,
})

const publicAddress = ({ ownerEmail: _ownerEmail, ...rest }: Address) => rest

const find = (db: Db, email: string) =>
  db.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())

/** The account a bearer token belongs to, or null when it is stale. */
function authed(db: Db, bearer: string | null): Account | null {
  if (!bearer) return null
  const email = db.sessions[bearer]
  if (!email) return null
  const account = find(db, email)
  return account?.isActive ? account : null
}

interface Ctx {
  db: Db
  body: Record<string, unknown>
  /** Path segments captured by the route pattern, in order. */
  params: string[]
  query: URLSearchParams
  bearer: string | null
}

type Handler = (ctx: Ctx) => MockResponse

const routes: { method: string; pattern: RegExp; handle: Handler }[] = []

const route = (method: string, pattern: RegExp, handle: Handler) =>
  routes.push({ method, pattern, handle })

/** Wraps a handler so it only runs for a live session, as the real one does. */
const signedIn =
  (handle: (account: Account, ctx: Ctx) => MockResponse): Handler =>
  (ctx) => {
    const account = authed(ctx.db, ctx.bearer)
    if (!account) return fail(401, 'Your session has expired. Sign in again.')
    return handle(account, ctx)
  }

const adminOnly =
  (handle: (account: Account, ctx: Ctx) => MockResponse): Handler =>
  signedIn((account, ctx) => {
    if (account.role !== 'ADMIN') return fail(403, 'Only an admin can manage accounts.')
    return handle(account, ctx)
  })

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const nullable = (v: unknown) => {
  const s = str(v)
  return s === '' ? null : s
}

// ---------------------------------------------------------------- auth

route('POST', /^\/api\/auth\/login$/, ({ db, body }) => {
  const account = find(db, str(body.email))
  const password = str(body.password)

  // One message for both halves on purpose: saying which of the two was wrong
  // tells somebody probing whether an address has an account on it.
  if (!account || !account.password || account.password !== password) {
    return fail(401, 'That email and password do not match an account.')
  }
  if (!account.isActive) {
    return fail(403, 'This account has been suspended. Talk to an admin.')
  }

  const issued = token()
  db.sessions[issued] = account.email
  save(db)
  return ok({ ...profileOf(account), token: issued })
})

route('POST', /^\/api\/auth\/register$/, ({ db, body }) => {
  const email = str(body.email)
  const name = str(body.name)
  const password = str(body.password)

  if (!name || !email) return fail(400, 'Check the form: a name and an email are needed.')
  if (password.length < 10) {
    return fail(400, 'Check the form: a password needs at least 10 characters.')
  }
  if (find(db, email)) {
    return fail(409, 'There is already an account on that email. Try signing in.')
  }

  const account: Account = {
    id: db.nextId++,
    name,
    email,
    phone: nullable(body.phone),
    password,
    role: 'CUSTOMER',
    isActive: true,
    invitePending: false,
    inviteToken: null,
    inviteExpiresAt: null,
    invitedBy: null,
    invitedAt: null,
    createdAt: iso(),
  }
  db.accounts.push(account)

  const issued = token()
  db.sessions[issued] = account.email
  save(db)
  return ok({ ...profileOf(account), token: issued })
})

route('GET', /^\/api\/auth\/session$/, signedIn((account) => ok(profileOf(account))))

route('POST', /^\/api\/auth\/logout$/, ({ db, bearer }) => {
  if (bearer) delete db.sessions[bearer]
  save(db)
  return ok()
})

route('GET', /^\/api\/auth\/invite$/, ({ db, query }) => {
  const invite = query.get('token') ?? ''
  const account = db.accounts.find((a) => a.inviteToken && a.inviteToken === invite)

  if (!account) return fail(404, 'That invite link is not valid. Ask for a fresh one.')
  if (account.inviteExpiresAt && Date.parse(account.inviteExpiresAt) < Date.now()) {
    return fail(410, 'That invite link has expired. Ask for a fresh one.')
  }

  return ok({
    name: account.name,
    email: account.email,
    role: account.role,
    invitedBy: account.invitedBy,
    expiresAt: account.inviteExpiresAt,
  })
})

route('POST', /^\/api\/auth\/invite\/accept$/, ({ db, body }) => {
  const invite = str(body.token)
  const password = str(body.password)
  const account = db.accounts.find((a) => a.inviteToken && a.inviteToken === invite)

  if (!account) return fail(404, 'That invite link is not valid. Ask for a fresh one.')
  if (account.inviteExpiresAt && Date.parse(account.inviteExpiresAt) < Date.now()) {
    return fail(410, 'That invite link has expired. Ask for a fresh one.')
  }
  if (password.length < 10) {
    return fail(400, 'Check the form: a password needs at least 10 characters.')
  }

  account.password = password
  account.invitePending = false
  account.inviteToken = null
  account.inviteExpiresAt = null

  const issued = token()
  db.sessions[issued] = account.email
  save(db)
  return ok({ ...profileOf(account), token: issued })
})

route('POST', /^\/api\/auth\/password-reset\/request$/, ({ db, body }) => {
  const account = find(db, str(body.email))

  // Always the same answer, whether or not the address is known, so this
  // cannot be used to find out who has an account.
  if (account) {
    const reset = token()
    db.resets[reset] = account.email
    save(db)
    // The real service emails this. Here it is the only way to reach the next
    // screen, so it goes to the console.
    console.info(`[mock api] reset link for ${account.email}: /reset-password?token=${reset}`)
  }
  return ok({ sent: true })
})

route('POST', /^\/api\/auth\/password-reset\/confirm$/, ({ db, body }) => {
  const reset = str(body.token)
  const password = str(body.password)
  const email = db.resets[reset]
  const account = email ? find(db, email) : undefined

  if (!account) return fail(404, 'That reset link is not valid. Ask for a fresh one.')
  if (password.length < 10) {
    return fail(400, 'Check the form: a password needs at least 10 characters.')
  }

  account.password = password
  delete db.resets[reset]
  // Every other session is dropped, which is the point of resetting.
  for (const [key, value] of Object.entries(db.sessions)) {
    if (value === account.email) delete db.sessions[key]
  }
  save(db)
  return ok({ reset: true })
})

// ------------------------------------------------------------- account

route('GET', /^\/api\/account\/profile$/, signedIn((account) => ok(profileOf(account))))

route(
  'PATCH',
  /^\/api\/account\/profile$/,
  signedIn((account, { db, body }) => {
    const name = str(body.name)
    if (!name) return fail(400, 'Check the form: a name is needed.')
    account.name = name
    account.phone = nullable(body.phone)
    save(db)
    return ok(profileOf(account))
  }),
)

route(
  'POST',
  /^\/api\/account\/password$/,
  signedIn((account, { db, body }) => {
    const current = str(body.currentPassword)
    const next = str(body.newPassword)

    if (account.password !== current) return fail(400, 'That is not your current password.')
    if (next.length < 10) {
      return fail(400, 'Check the form: a password needs at least 10 characters.')
    }

    account.password = next
    save(db)
    return ok({ changed: true })
  }),
)

route(
  'GET',
  /^\/api\/account\/addresses$/,
  signedIn((account, { db }) =>
    ok(db.addresses.filter((a) => a.ownerEmail === account.email).map(publicAddress)),
  ),
)

route(
  'POST',
  /^\/api\/account\/addresses$/,
  signedIn((account, { db, body }) => {
    const recipient = str(body.recipient)
    const line1 = str(body.line1)
    if (!recipient || !line1) {
      return fail(400, 'Check the form: a recipient and an address are needed.')
    }

    const isDefault = body.isDefault === true
    const mine = db.addresses.filter((a) => a.ownerEmail === account.email)
    if (isDefault || mine.length === 0) {
      mine.forEach((a) => (a.isDefault = false))
    }

    const address: Address = {
      id: db.nextId++,
      ownerEmail: account.email,
      label: nullable(body.label),
      recipient,
      phone: nullable(body.phone),
      line1,
      county: nullable(body.county),
      notes: nullable(body.notes),
      // The first address somebody adds is their default whether they said so
      // or not, otherwise checkout has nothing to preselect.
      isDefault: isDefault || mine.length === 0,
    }
    db.addresses.push(address)
    save(db)
    return ok(publicAddress(address))
  }),
)

route(
  'PUT',
  /^\/api\/account\/addresses\/([^/]+)$/,
  signedIn((account, { db, body, params }) => {
    const address = db.addresses.find(
      (a) => a.id === Number(params[0]) && a.ownerEmail === account.email,
    )
    if (!address) return fail(404, 'That address is no longer on your account.')

    if (body.isDefault === true) {
      db.addresses
        .filter((a) => a.ownerEmail === account.email)
        .forEach((a) => (a.isDefault = false))
    }

    address.label = nullable(body.label)
    address.recipient = str(body.recipient) || address.recipient
    address.phone = nullable(body.phone)
    address.line1 = str(body.line1) || address.line1
    address.county = nullable(body.county)
    address.notes = nullable(body.notes)
    address.isDefault = body.isDefault === true || address.isDefault
    save(db)
    return ok(publicAddress(address))
  }),
)

route(
  'DELETE',
  /^\/api\/account\/addresses\/([^/]+)$/,
  signedIn((account, { db, params }) => {
    const index = db.addresses.findIndex(
      (a) => a.id === Number(params[0]) && a.ownerEmail === account.email,
    )
    if (index === -1) return fail(404, 'That address is no longer on your account.')

    const [removed] = db.addresses.splice(index, 1)
    // Something has to be the default, so the next address inherits it.
    const mine = db.addresses.filter((a) => a.ownerEmail === account.email)
    if (removed.isDefault && mine.length > 0) mine[0].isDefault = true
    save(db)
    return ok()
  }),
)

route(
  'GET',
  /^\/api\/account\/saved$/,
  signedIn((account, { db }) => ok(db.saved[account.email] ?? [])),
)

route(
  'POST',
  /^\/api\/account\/saved$/,
  signedIn((account, { db, body }) => {
    const slug = str(body.slug)
    if (!slug) return fail(400, 'Check the form: a product is needed.')
    const list = db.saved[account.email] ?? []
    if (!list.includes(slug)) list.push(slug)
    db.saved[account.email] = list
    save(db)
    return ok(list)
  }),
)

route(
  'DELETE',
  /^\/api\/account\/saved\/([^/]+)$/,
  signedIn((account, { db, params }) => {
    const slug = decodeURIComponent(params[0])
    db.saved[account.email] = (db.saved[account.email] ?? []).filter((s) => s !== slug)
    save(db)
    return ok()
  }),
)

// --------------------------------------------------------------- admin

route(
  'GET',
  /^\/api\/admin\/accounts$/,
  adminOnly((_account, { db }) => ok(db.accounts.map(staffOf))),
)

route(
  'POST',
  /^\/api\/admin\/accounts$/,
  adminOnly((account, { db, body }) => {
    const name = str(body.name)
    const email = str(body.email)
    const role = str(body.role) === 'ADMIN' ? 'ADMIN' : 'STAFF'

    if (!name || !email) return fail(400, 'Check the form: a name and an email are needed.')
    if (find(db, email)) return fail(409, 'There is already an account on that email.')

    const invite = token()
    const invited: Account = {
      id: db.nextId++,
      name,
      email,
      phone: null,
      // No password until they follow the invite, so nothing that opens the
      // console is ever sitting in an inbox.
      password: null,
      role,
      isActive: true,
      invitePending: true,
      inviteToken: invite,
      inviteExpiresAt: iso(INVITE_DAYS),
      invitedBy: account.name,
      invitedAt: iso(),
      createdAt: iso(),
    }
    db.accounts.push(invited)
    save(db)
    console.info(`[mock api] invite for ${email}: /accept-invite?token=${invite}`)
    return ok(staffOf(invited))
  }),
)

route(
  'PUT',
  /^\/api\/admin\/accounts\/([^/]+)\/role$/,
  adminOnly((account, { db, body, params }) => {
    const target = db.accounts.find((a) => a.id === Number(params[0]))
    if (!target) return fail(404, 'That account no longer exists.')

    const role = str(body.role) === 'ADMIN' ? 'ADMIN' : 'STAFF'
    if (target.id === account.id && role !== 'ADMIN') {
      return fail(409, 'You cannot take your own admin rights away.')
    }
    if (target.role === 'ADMIN' && role !== 'ADMIN' && lastAdmin(db, target)) {
      return fail(409, 'This is the last admin. Promote somebody else first.')
    }

    target.role = role
    save(db)
    return ok(staffOf(target))
  }),
)

route(
  'PUT',
  /^\/api\/admin\/accounts\/([^/]+)\/active$/,
  adminOnly((account, { db, body, params }) => {
    const target = db.accounts.find((a) => a.id === Number(params[0]))
    if (!target) return fail(404, 'That account no longer exists.')
    if (target.id === account.id) return fail(409, 'You cannot suspend your own account.')

    const isActive = body.isActive === true
    if (!isActive && lastAdmin(db, target)) {
      return fail(409, 'This is the last admin. Promote somebody else first.')
    }

    target.isActive = isActive
    // Suspending ends their sessions, which is most of the point of it.
    if (!isActive) {
      for (const [key, value] of Object.entries(db.sessions)) {
        if (value === target.email) delete db.sessions[key]
      }
    }
    save(db)
    return ok(staffOf(target))
  }),
)

route(
  'POST',
  /^\/api\/admin\/accounts\/([^/]+)\/resend-invite$/,
  adminOnly((_account, { db, params }) => {
    const target = db.accounts.find((a) => a.id === Number(params[0]))
    if (!target) return fail(404, 'That account no longer exists.')
    if (!target.invitePending) return fail(409, 'That account has already been set up.')

    const invite = token()
    target.inviteToken = invite
    target.inviteExpiresAt = iso(INVITE_DAYS)
    save(db)
    console.info(`[mock api] invite for ${target.email}: /accept-invite?token=${invite}`)
    return ok({ sent: true })
  }),
)

route(
  'DELETE',
  /^\/api\/admin\/accounts\/([^/]+)$/,
  adminOnly((account, { db, params }) => {
    const target = db.accounts.find((a) => a.id === Number(params[0]))
    if (!target) return fail(404, 'That account no longer exists.')
    if (target.id === account.id) return fail(409, 'You cannot delete your own account.')
    if (lastAdmin(db, target)) {
      return fail(409, 'This is the last admin. Promote somebody else first.')
    }

    db.accounts = db.accounts.filter((a) => a.id !== target.id)
    db.addresses = db.addresses.filter((a) => a.ownerEmail !== target.email)
    delete db.saved[target.email]
    for (const [key, value] of Object.entries(db.sessions)) {
      if (value === target.email) delete db.sessions[key]
    }
    save(db)
    return ok()
  }),
)

const lastAdmin = (db: Db, target: Account) =>
  target.role === 'ADMIN' &&
  db.accounts.filter((a) => a.role === 'ADMIN' && a.isActive && a.id !== target.id).length === 0

// --------------------------------------------------------------- forms

/** The storefront forms that only ever needed an acknowledgement. */
route('POST', /^\/api\/contact$/, () => ok({ received: true }))
route('POST', /^\/api\/wishlist\/email$/, () => ok({ sent: true }))

route('POST', /^\/api\/quotes\/request$/, ({ db, body }) => {
  const reference = `KQ-${db.reference++}`

  /*
   * Kept, not discarded.
   *
   * This route used to mint a reference, throw the body away and return. A
   * customer measured their windows, typed the numbers in, got a reference
   * back, and nothing anywhere had any record of it. The console could not
   * show the quote because nothing had stored it.
   */
  const lines = Array.isArray(body.lines) ? body.lines : []
  db.quoteRequests.push({
    reference,
    name: str(body.name),
    phone: str(body.phone),
    email: nullable(body.email),
    area: nullable(body.area),
    preferredTime: str(body.preferredTime) || 'As soon as possible',
    requestedAt: iso(),
    lines: lines.map((raw) => {
      const l = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
      return {
        productName: str(l.productName),
        colour: nullable(l.colour),
        room: str(l.room),
        widthCm: typeof l.widthCm === 'number' ? l.widthCm : null,
        dropCm: typeof l.dropCm === 'number' ? l.dropCm : null,
        windows: typeof l.windows === 'number' ? l.windows : 1,
        notes: nullable(l.notes),
      }
    }),
  })

  save(db)
  return ok({ reference })
})

route('POST', /^\/api\/orders\/confirmation$/, ({ db, body }) => {
  const reference = `KO-${db.reference++}`

  // Kept, not discarded. The invoice needs the reference and the review form
  // needs to know who bought what.
  const lines = Array.isArray(body.lines) ? body.lines : []
  db.orders.push({
    reference,
    email: str(body.email).toLowerCase(),
    placedAt: iso(),
    slugs: lines
      .map((l) => (l && typeof l === 'object' ? str((l as Record<string, unknown>).slug) : ''))
      .filter(Boolean),
    total: typeof body.total === 'number' ? body.total : 0,
  })
  save(db)
  return ok({ reference })
})

// ---------------------------------------------------------------- promotions

/**
 * Promotional list sign-up.
 *
 * Idempotent on purpose: somebody who subscribes twice should be told they are
 * already on the list, not handed an error or a silent second row. The real
 * service will want a double opt-in email before it counts anyone as
 * subscribed; this records the intent and nothing more.
 */
route('POST', /^\/api\/newsletter$/, ({ db, body }) => {
  const email = str(body.email).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return fail(422, 'Enter a valid email address.')
  }

  const already = Boolean(db.subscribers[email])
  if (!already) {
    db.subscribers[email] = iso()
    save(db)
  }
  return ok({ email, already })
})

// ---------------------------------------------------------------- reviews

route('GET', /^\/api\/products\/([\w-]+)\/reviews$/, ({ db, params }) => {
  const list = db.reviews[params[0]] ?? []
  // Newest first, which is what a shopper scanning for recent experience wants.
  return ok([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

route(
  'POST',
  /^\/api\/products\/([\w-]+)\/reviews$/,
  signedIn((account, { db, body, params }) => {
    const slug = params[0]
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return fail(422, 'Choose a rating from one to five stars.')
    }

    const bodyText = str(body.body)
    if (bodyText.length < 20) {
      return fail(422, 'Tell us a little more, at least twenty characters.')
    }

    const list = (db.reviews[slug] ??= [])
    if (list.some((r) => r.email === account.email)) {
      return fail(409, 'You have already reviewed this product.')
    }

    const review: Review = {
      id: db.nextId++,
      slug,
      author: account.name,
      email: account.email,
      rating,
      title: str(body.title),
      body: bodyText,
      createdAt: iso(),
      // Earned from the order history rather than printed on everything.
      verified: db.orders.some(
        (o) => o.email === account.email && o.slugs.includes(slug),
      ),
    }
    list.push(review)
    save(db)
    return ok(review)
  }),
)

// ---------------------------------------------------------------- entry

/** Whether the stand-in is answering. Off only when told to be. */
export const mockEnabled = import.meta.env.VITE_MOCK_API !== 'false'

/**
 * Answers one request, or 404s the way the real service would for a path it
 * does not serve. Never throws: `request()` treats this exactly like a
 * response off the wire.
 */
export async function handleMock(
  method: string,
  path: string,
  body: unknown,
  bearer: string | null,
): Promise<MockResponse> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

  const [pathname, search = ''] = path.split('?')
  const db = load()
  const payload =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

  for (const { method: verb, pattern, handle } of routes) {
    if (verb !== method) continue
    const match = pattern.exec(pathname)
    if (!match) continue

    try {
      return handle({
        db,
        body: payload,
        params: match.slice(1),
        query: new URLSearchParams(search),
        bearer,
      })
    } catch {
      return fail(500, 'Something went wrong at our end. Try again, or message us on WhatsApp.')
    }
  }

  return fail(404, 'That is not something we can do yet.')
}
