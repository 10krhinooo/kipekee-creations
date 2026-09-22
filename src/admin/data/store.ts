import { useSyncExternalStore } from 'react'
import { DATA_EVENT, submitted } from '../../lib/mockApi'
import {
  orders as seedOrders,
  quotes as seedQuotes,
  type Order,
  type OrderStatus,
  type Quote,
  type QuoteStatus,
} from './operations'

/**
 * The console's working copy of the operational data.
 *
 * The arrays in `./operations` are a fixed seed. Until this existed, acting on
 * something only moved a `useState` inside whichever screen you were on: a
 * quote you had just sent was back to "new" as soon as you navigated away, and
 * nothing that counted the queues - the sidebar badges, the dashboard, the
 * notification bell - ever noticed. Work could be done but never be *done*.
 *
 * So the state lives here instead, above the screens, and everything that
 * reads a queue reads it through this. Moving a quote on now empties the row
 * that was asking for it, everywhere at once.
 *
 * Deliberately in memory and nowhere else. This is the prototype's stand-in
 * for what the backend will own, and persisting it would only make a local
 * copy that has to be reconciled with the real thing later.
 */

/**
 * Quotes and orders only. Products are not here: they live in the catalogue,
 * which both halves of the app read, and keeping a second copy beside it was
 * how the console came to disagree with the shop about what was in stock.
 * `useStock()` in `./stock` derives the console's product rows from it.
 */
interface State {
  quotes: Quote[]
  orders: Order[]
}

/**
 * A storefront quote request, in the shape the console works in.
 *
 * The two halves of the prototype kept their data in different places: the
 * storefront posted to the stand-in API, the console read a fixed seed, and
 * nothing joined them. So a customer could measure their windows, send a quote,
 * get a reference back, and staff would never see it. This is the join.
 */
/** The console's own ids for a payment method, from the label checkout sent. */
const payMethodOf = (label: string): Order['pay'] => {
  const value = label.toLowerCase()
  if (value.includes('card')) return 'card'
  if (value.includes('delivery')) return 'cod'
  return 'mpesa'
}

const incoming = (): Pick<State, 'quotes' | 'orders'> => {
  const { quotes, orders } = submitted()
  return {
    quotes: quotes.map<Quote>((q) => ({
      id: q.reference,
      customer: q.name,
      phone: q.phone,
      area: q.area ?? 'Not given',
      requestedAt: q.requestedAt,
      status: 'new',
      // Nobody has picked it up yet, and saying otherwise would hide it from
      // whoever is meant to.
      owner: 'Unassigned',
      source: 'website',
      // What they asked for, not a booking. Nobody has been out yet.
      preferredTime: q.preferredTime,
      items: q.lines.map((l) => ({
        product: l.productName,
        colour: l.colour ?? '',
        room: l.room,
        widthCm: l.widthCm ?? undefined,
        dropCm: l.dropCm ?? undefined,
        windows: l.windows,
        // Null, not zero: staff have not priced it, and a quote builder that
        // opens on zeroes looks like it has been priced at nothing.
        pricedTotal: null,
        notes: l.notes ?? undefined,
      })),
    })),
    orders: orders.map<Order>((o) => ({
      id: o.reference,
      customer: o.name || o.email || 'Website customer',
      phone: o.phone,
      town: o.county ?? 'Not given',
      placedAt: o.placedAt,
      status: 'new',
      pay: payMethodOf(o.paymentMethod),
      paid: o.paid,
      delivery: o.deliveryAmount,
      mpesaCode: o.mpesaCode ?? undefined,
      address: o.address || undefined,
      lines: o.lines.map((l) => ({
        name: l.productName || l.slug,
        variant: l.detail ?? '',
        qty: l.qty,
        // The stored amount is the line total, and the table shows a unit
        // price beside a quantity. Dividing here rather than storing both
        // keeps one number authoritative.
        unitPrice: l.qty > 0 ? Math.round(l.amount / l.qty) : l.amount,
      })),
    })),
  }
}

/** Newest first, with anything a shopper sent above the seeded examples. */
const merge = (): State => {
  const live = incoming()
  return {
    quotes: [...live.quotes.reverse(), ...seedQuotes],
    orders: [...live.orders.reverse(), ...seedOrders],
  }
}

/**
 * Fold newly submitted work into the state without disturbing what is there.
 *
 * Not a re-merge. Rebuilding from the seed on every write would be simpler and
 * would quietly undo staff: send a quote, have a shopper submit another one
 * ten seconds later, and the one you just sent is back to "new". Only rows the
 * console has never seen are added.
 */
const absorb = (current: State): State => {
  const live = incoming()
  const known = (list: { id: string }[]) => new Set(list.map((x) => x.id))

  const newQuotes = live.quotes.filter((q) => !known(current.quotes).has(q.id)).reverse()
  const newOrders = live.orders.filter((o) => !known(current.orders).has(o.id)).reverse()
  if (!newQuotes.length && !newOrders.length) return current

  return {
    ...current,
    quotes: [...newQuotes, ...current.quotes],
    orders: [...newOrders, ...current.orders],
  }
}

let state: State = merge()

const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => state

/*
 * Re-merge whenever the stand-in writes. `DATA_EVENT` covers this tab, which
 * `storage` does not fire for, and `storage` covers a shopper submitting in
 * another tab with the console already open in this one.
 */
if (typeof window !== 'undefined') {
  const refresh = () => {
    const next = absorb(state)
    if (next !== state) set(next)
  }
  window.addEventListener(DATA_EVENT, refresh)
  window.addEventListener('storage', refresh)
}

function set(next: State) {
  state = next
  listeners.forEach((listener) => listener())
}

/** Everything the console reads, re-rendering whoever reads it on a change. */
export const useOperations = () => useSyncExternalStore(subscribe, getSnapshot)

export function setQuoteStatus(id: string, status: QuoteStatus) {
  set({
    ...state,
    quotes: state.quotes.map((q) => (q.id === id ? { ...q, status } : q)),
  })
}

/**
 * Records that the money has been seen.
 *
 * Staff-only, and deliberately not something the customer's M-Pesa code does
 * by itself. The code says a payment was reported; this says somebody found it
 * on the statement. Only the second one should unlock a receipt.
 */
export function setOrderPaid(id: string, paid: boolean) {
  set({
    ...state,
    orders: state.orders.map((o) => (o.id === id ? { ...o, paid } : o)),
  })
}

export function setOrderStatus(id: string, status: OrderStatus) {
  set({
    ...state,
    orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
  })
}

/** Restores the seed, for getting back to a known state while demonstrating. */
export function resetOperations() {
  set({ quotes: seedQuotes, orders: seedOrders })
}
