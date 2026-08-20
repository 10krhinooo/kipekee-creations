import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { money } from '../../lib/format'
import { Button, WhatsAppIcon, cx, whatsappLink } from '../../components/ui'
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Segmented,
  StatusPill,
  Table,
  Td,
  Th,
} from '../components/AdminUI'
import { orderStatusLabel, type OrderStatus } from '../data/operations'
import { moveOrder, setOrderPaid, useOrder, useOrders } from '../data/api'

type Filter = 'all' | OrderStatus

const payLabel = { mpesa: 'M-Pesa', card: 'Card', cod: 'On delivery' } as const

export function Orders() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, loading, error } = useOrders()
  const orders = data ?? []

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const options: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'new', label: 'New', count: orders.filter((o) => o.status === 'new').length },
    { id: 'packing', label: 'Packing', count: orders.filter((o) => o.status === 'packing').length },
    {
      id: 'dispatched',
      label: 'Dispatched',
      count: orders.filter((o) => o.status === 'dispatched').length,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: orders.filter((o) => o.status === 'delivered').length,
    },
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        intro="Ready-made stock paid for on the site. Made-to-measure jobs live under Quotes."
      />

      {loading && <p className="mb-5 text-sm text-muted">Loading orders…</p>}
      {error && <p className="mb-5 text-sm text-brand">{error}</p>}

      <div className="mb-5">
        <Segmented options={options} value={filter} onChange={setFilter} />
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No orders" body="Nothing matches this filter." />
      ) : (
        <Card padded={false}>
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th align="right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className="hover:bg-shell">
                  <Td>
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="font-medium whitespace-nowrap hover:text-brand"
                    >
                      {o.id}
                    </Link>
                    <span className="block text-[11px] text-muted">
                      {new Date(o.placedAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </Td>
                  <Td>
                    <span className="block text-[13px] font-medium">{o.customer}</span>
                    <span className="block text-[12px] text-muted">{o.town}</span>
                  </Td>
                  <Td>
                    <span className="text-[13px]">{o.items} items</span>
                    <span className="block max-w-48 truncate text-[12px] text-muted">
                      {o.firstProduct ?? 'No lines'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[13px]">{payLabel[o.pay]}</span>
                    <span
                      className={cx(
                        'block text-[11px] font-medium',
                        o.paid ? 'text-[#1a6b39]' : 'text-brand',
                      )}
                    >
                      {o.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill kind="order" status={o.status} label={orderStatusLabel[o.status]} />
                  </Td>
                  <Td align="right" className="font-semibold whitespace-nowrap">
                    {money(o.total)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  )
}

const flow: OrderStatus[] = ['new', 'packing', 'dispatched', 'delivered']

export function OrderDetail() {
  const { id = '' } = useParams()
  const { data: order, loading, error, reload } = useOrder(id)
  const [problem, setProblem] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)

  /**
   * Moving a stage is a request now, not a `useState`.
   *
   * The prototype's stepper set a local variable, so a packed order was packed
   * only in that tab and only until it was refreshed. The server owns the
   * transitions, refuses the ones the pipeline does not allow, and says why in
   * words meant to be read, so its refusal is shown rather than replaced.
   */
  const moveTo = async (next: OrderStatus) => {
    if (!order || next === order.status) return
    setMoving(true)
    const courier =
      next === 'dispatched' && !order.courier
        ? (window.prompt('Courier reference for this parcel') ?? '')
        : undefined
    const result = await moveOrder(id, next, courier || undefined)
    setMoving(false)
    if (result.ok) {
      setProblem(null)
      reload()
    } else {
      setProblem(result.message)
    }
  }

  const togglePaid = async () => {
    if (!order) return
    const result = await setOrderPaid(id, !order.paid)
    if (result.ok) {
      setProblem(null)
      reload()
    } else {
      setProblem(result.message)
    }
  }

  if (loading) {
    return <PageHeader title="Loading order…" />
  }

  if (!order) {
    return (
      <>
        <PageHeader title="Order not found" intro={error ?? undefined} />
        <Button to="/admin/orders">Back to orders</Button>
      </>
    )
  }

  // Both come from the server, so the receipt on screen is the one the customer
  // was charged rather than the browser's arithmetic over the same lines.
  const goodsTotal = order.subtotal
  const stageIndex = flow.indexOf(order.status)

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
        <Link to="/admin/orders" className="hover:text-brand">
          Orders
        </Link>
        <span>/</span>
        <span className="text-ink">{order.id}</span>
      </nav>

      <PageHeader
        title={order.id}
        intro={`${order.customer} · ${order.phone} · ${order.town}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="whatsapp"
              href={whatsappLink(`Hello ${order.customer.split(' ')[0]}, about your Kipekee order ${order.id}:`)}
            >
              <WhatsAppIcon />
              Message
            </Button>
            <Button size="sm" variant="outline">
              Print packing slip
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card padded={false}>
            <div className="p-5 pb-0">
              <CardHeader title="Items" />
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Unit</Th>
                  <Th align="right">Line</Th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.name + l.variant}>
                    <Td>
                      <span className="block text-[13px] font-medium">{l.name}</span>
                      <span className="block text-[12px] text-muted">{l.variant}</span>
                    </Td>
                    <Td align="right">{l.qty}</Td>
                    <Td align="right">{money(l.unitPrice)}</Td>
                    <Td align="right" className="font-semibold">
                      {money(l.amount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Goods</span>
                <span className="font-medium">{money(goodsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className={cx('font-medium', order.delivery === 0 && 'text-[#1a6b39]')}>
                  {order.delivery === 0 ? 'Free' : money(order.delivery)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 font-display text-base font-bold">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Fulfilment" hint="Only the next stage can be set" />
            {problem && <p className="mb-3 text-sm text-brand">{problem}</p>}
            <ol className="flex flex-wrap items-center gap-y-3">
              {flow.map((s, i) => (
                <li key={s} className="flex items-center">
                  <button
                    onClick={() => void moveTo(s)}
                    disabled={moving || !order.nextAllowed.includes(s)}
                    className="flex items-center gap-2 disabled:cursor-not-allowed"
                    aria-pressed={i === stageIndex}
                  >
                    <span
                      className={cx(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                        i < stageIndex && 'bg-[#e8f5ec] text-[#1a6b39]',
                        i === stageIndex && 'bg-brand text-white',
                        i > stageIndex && 'bg-shell text-muted',
                      )}
                    >
                      {i < stageIndex ? '✓' : i + 1}
                    </span>
                    <span
                      className={cx(
                        'text-[12px] whitespace-nowrap',
                        i === stageIndex ? 'font-semibold text-ink' : 'text-muted',
                      )}
                    >
                      {orderStatusLabel[s]}
                    </span>
                  </button>
                  {i < flow.length - 1 && (
                    <span className={cx('mx-2 h-px w-8', i < stageIndex ? 'bg-[#1a6b39]' : 'bg-line')} />
                  )}
                </li>
              ))}
            </ol>
            {order.courier && (
              <p className="mt-4 rounded-lg bg-shell px-3 py-2 text-[13px]">
                Courier reference <strong>{order.courier}</strong>
              </p>
            )}
          </Card>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Payment" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Method</span>
                <span className="font-medium">{payLabel[order.pay]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <button
                  type="button"
                  onClick={() => void togglePaid()}
                  className={cx('font-medium underline', order.paid ? 'text-[#1a6b39]' : 'text-brand')}
                >
                  {order.paid ? 'Paid in full' : 'Awaiting payment'}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Placed</span>
                <span className="font-medium">
                  {new Date(order.placedAt).toLocaleString('en-KE')}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Deliver to" />
            <address className="text-[13px] leading-relaxed not-italic">
              <span className="block font-medium">{order.customer}</span>
              <span className="block text-muted">{order.phone}</span>
              <span className="block text-muted">{order.town}</span>
            </address>
          </Card>
        </aside>
      </div>
    </>
  )
}
