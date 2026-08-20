import { useEffect, useState } from 'react'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { Notice } from '../../components/auth/AuthUI'
import { Button, Badge } from '../../components/ui'
import { money } from '../../lib/format'
import { api } from '../../lib/api'

interface OrderSummary {
  id: string
  status: 'new' | 'packing' | 'dispatched' | 'delivered' | 'cancelled'
  pay: string
  paid: boolean
  placedAt: string
  items: number
  firstProduct: string | null
  total: number
}

const STATUS_LABEL: Record<OrderSummary['status'], string> = {
  new: 'Placed',
  packing: 'Packing',
  dispatched: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_TONE: Record<OrderSummary['status'], 'neutral' | 'brand' | 'stock'> = {
  new: 'neutral',
  packing: 'brand',
  dispatched: 'brand',
  delivered: 'stock',
  cancelled: 'neutral',
}

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

/** Order and quote history. */
export function AccountOrders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<OrderSummary[]>('/api/account/orders').then((result) => {
      if (result.ok) setOrders(result.data)
      else {
        setOrders([])
        setError(result.message)
      }
    })
  }, [])

  return (
    <>
      <AccountPanel title="Orders" intro="Everything you have bought, with what it cost and when it arrived.">
        {error && (
          <div className="mb-4">
            <Notice onDismiss={() => setError(null)}>{error}</Notice>
          </div>
        )}

        {orders === null ? (
          <EmptyNote>Loading your orders…</EmptyNote>
        ) : orders.length === 0 ? (
          <EmptyNote>
            No orders on your account yet. Anything you order from now on will be listed here with its
            reference, so you can check it or reorder without digging through email.
            <br />
            <Button to="/shop" size="sm" className="mt-4">
              Browse the shop
            </Button>
          </EmptyNote>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[14px] font-semibold text-ink">{order.id}</p>
                  <p className="text-[12.5px] text-muted">
                    {dateFmt(order.placedAt)} · {order.firstProduct ?? 'Order'}
                    {order.items > 1 ? ` and ${order.items - 1} more` : ''}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                <span className="text-[14px] font-semibold text-ink">{money(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </AccountPanel>

      <AccountPanel title="Quotes" intro="Made-to-measure jobs, with the measurements we took.">
        <EmptyNote>
          No quotes yet. When you request one while signed in, it stays here with its measurements
          and its fixed price, so a repeat job starts from the last one.
          <br />
          <Button to="/quote" size="sm" className="mt-4">
            Request a quote
          </Button>
        </EmptyNote>
      </AccountPanel>
    </>
  )
}

export type { OrderSummary }
