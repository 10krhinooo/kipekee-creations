import { useSyncExternalStore } from 'react'
import {
  orders as seedOrders,
  quotes as seedQuotes,
  stock as seedStock,
  type Order,
  type OrderStatus,
  type Quote,
  type QuoteStatus,
  type StockRow,
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

interface State {
  quotes: Quote[]
  orders: Order[]
  stock: StockRow[]
}

let state: State = {
  quotes: seedQuotes,
  orders: seedOrders,
  stock: seedStock,
}

const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => state

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

export function setOrderStatus(id: string, status: OrderStatus) {
  set({
    ...state,
    orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
  })
}

/** Moves a stock level by `by`, never below zero. */
export function adjustStock(slug: string, by: number) {
  set({
    ...state,
    stock: state.stock.map((s) =>
      s.slug === slug ? { ...s, stock: Math.max(0, s.stock + by) } : s,
    ),
  })
}

/** Restores the seed, for getting back to a known state while demonstrating. */
export function resetOperations() {
  set({ quotes: seedQuotes, orders: seedOrders, stock: seedStock })
}
