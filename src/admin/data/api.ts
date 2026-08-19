import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type {
  CustomerRow,
  Fitting,
  Order,
  OrderFull,
  OrderStatus,
  Quote,
  QuoteFull,
  QuoteStatus,
  StockRow,
} from './operations'

/**
 * The console's reads and writes.
 *
 * Everything goes through `src/lib/api.ts`, so the bearer token is attached the
 * same way the storefront attaches it and a failure arrives as a message
 * written for a person rather than as an exception. The backend's rejections
 * are prose on purpose ("Add the courier reference before marking it
 * dispatched"), so they are shown as they are rather than replaced.
 */

/** The dashboard's whole front page, in one answer. */
export interface Dashboard {
  counters: {
    quotesAwaiting: number
    openQuoteValue: number
    shopRevenue14Days: number
    ordersToPack: number
    openTradeEnquiries: number
    winRate: number | null
  }
  revenue: { day: string; orders: number; quotes: number }[]
  pipeline: { stage: QuoteStatus; label: string; count: number }[]
  newQuotes: Quote[]
  toPack: Order[]
  upcoming: Fitting[]
  lowStock: StockRow[]
}

export interface TradeEnquiry {
  id: number
  name: string
  company: string | null
  email: string
  phone: string | null
  buyerType: string | null
  rooms: string | null
  message: string | null
  createdAt: string
  handledAt: string | null
  handledBy: string | null
}

/**
 * A read that keeps its own loading and error state.
 *
 * Every console screen needs the same three things and would otherwise write
 * the same twenty lines: the data, whether it has arrived, and what to say when
 * it has not. `reload` is what an action calls after it changes something, so
 * the screen shows what the server now holds rather than what the browser
 * guessed it would.
 */
export function useResource<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let live = true
    setLoading(true)
    void api.get<T>(path).then((result) => {
      if (!live) return
      if (result.ok) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.message)
      }
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [path, enabled, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { data, loading, error, reload }
}

export const useDashboard = () => useResource<Dashboard>('/api/admin/dashboard')
export const useOrders = () => useResource<Order[]>('/api/admin/orders')
export const useOrder = (reference: string) =>
  useResource<OrderFull>(`/api/admin/orders/${encodeURIComponent(reference)}`)
export const useQuotes = () => useResource<Quote[]>('/api/admin/quotes')
export const useQuote = (reference: string) =>
  useResource<QuoteFull>(`/api/admin/quotes/${encodeURIComponent(reference)}`)
export const useStock = () => useResource<StockRow[]>('/api/admin/products')
export const useCustomers = () => useResource<CustomerRow[]>('/api/admin/customers')
export const useTradeEnquiries = () => useResource<TradeEnquiry[]>('/api/admin/trade-enquiries')

/** A week of the diary, from `from` inclusive. */
export const useSchedule = (from: string, days = 7) =>
  useResource<Fitting[]>(`/api/admin/schedule?from=${from}&days=${days}`)

// Writes ---------------------------------------------------------------

export const moveOrder = (reference: string, status: OrderStatus, courier?: string, note?: string) =>
  api.put<OrderFull>(`/api/admin/orders/${encodeURIComponent(reference)}/status`, {
    status,
    courier,
    note,
  })

export const setOrderPaid = (reference: string, paid: boolean) =>
  api.put<OrderFull>(`/api/admin/orders/${encodeURIComponent(reference)}/payment`, { paid })

/**
 * Saves the builder's figures.
 *
 * `withFitting` is a toggle rather than an amount because the per-window rate
 * is the workshop's and lives on the server. A request that could send an
 * amount could send zero.
 */
export const priceQuote = (
  reference: string,
  body: {
    lines: { id: number; pricedTotal: number | null }[]
    withFitting: boolean
    discountPercent: number
    staffNotes?: string | null
  },
) => api.put<QuoteFull>(`/api/admin/quotes/${encodeURIComponent(reference)}/pricing`, body)

export const moveQuote = (reference: string, status: QuoteStatus, note?: string) =>
  api.put<QuoteFull>(`/api/admin/quotes/${encodeURIComponent(reference)}/status`, { status, note })

export const sendQuote = (reference: string) =>
  api.post<QuoteFull>(`/api/admin/quotes/${encodeURIComponent(reference)}/send`)

export const adjustStock = (slug: string, delta: number, reorderAt?: number) =>
  api.put<StockRow>(`/api/admin/products/${encodeURIComponent(slug)}/stock`, { delta, reorderAt })

export interface FittingBody {
  kind: 'measure' | 'fitting'
  quoteReference?: string | null
  customerName?: string | null
  phone?: string | null
  area?: string | null
  date: string
  time: string
  fitterId?: number | null
  windows: number
  notes?: string | null
  status?: string | null
}

export const bookFitting = (body: FittingBody) => api.post<Fitting>('/api/admin/schedule', body)

export const moveFitting = (id: number, body: FittingBody) =>
  api.put<Fitting>(`/api/admin/schedule/${id}`, body)

export const cancelFitting = (id: number) => api.del<void>(`/api/admin/schedule/${id}`)

export const setTradeEnquiryHandled = (id: number, handled: boolean) =>
  api.put<void>(`/api/admin/trade-enquiries/${id}/handled`, { handled })
