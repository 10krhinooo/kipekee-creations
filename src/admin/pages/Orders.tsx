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
import {
  orderStatusLabel,
  orderTotal,
  type Order,
  type OrderStatus,
} from '../data/operations'
import { setOrderPaid, setOrderStatus, useOperations } from '../data/store'
import {
  downloadDocument,
  printDocument,
  type DocumentKind,
  type OrderDocument,
} from '../../lib/documents'

type Filter = 'all' | OrderStatus

/**
 * An operations order rendered as a printable document.
 *
 * Orders placed on the site now carry a street address, so the delivery note
 * has one to print. Seeded and phone orders still do not: those keep a null
 * rather than an invented line, and the note prints the town and the phone
 * number so the driver rings.
 */
function documentFor(order: Order, kind: DocumentKind): OrderDocument {
  const subtotal = order.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
  return {
    kind,
    reference: order.id,
    issuedAt: new Date(),
    name: order.customer,
    phone: order.phone,
    address: order.address ?? null,
    county: order.town,
    paymentMethod: payLabel[order.pay],
    mpesaCode: order.mpesaCode ?? null,
    courier: order.courier ?? null,
    lines: order.lines.map((l) => ({
      productName: l.name,
      detail: l.variant || null,
      qty: l.qty,
      amount: l.unitPrice * l.qty,
    })),
    subtotal,
    adjustments: [{ label: 'Delivery', amount: order.delivery, freeWhenZero: true }],
    total: orderTotal(order),
  }
}

const payLabel = { mpesa: 'M-Pesa', card: 'Card', cod: 'On delivery' } as const

/**
 * The paperwork an order produces, and when each is honest to issue.
 *
 * A receipt is gated on payment rather than merely discouraged. Handing a
 * customer a receipt for money that has not arrived is the one mistake in this
 * list that is hard to walk back, so the button is not available to make.
 */
const DOCUMENTS: {
  kind: DocumentKind
  label: string
  note: string
  requiresPaid?: boolean
  blockedNote?: string
}[] = [
  {
    kind: 'payment-invoice',
    label: 'Payment invoice',
    note: 'Itemised, with the amount due. What the customer gets at checkout.',
  },
  {
    kind: 'receipt',
    label: 'Receipt',
    note: 'Confirms the amount received against this order.',
    requiresPaid: true,
    blockedNote: 'Available once this order is marked paid.',
  },
  {
    kind: 'delivery-note',
    label: 'Delivery note',
    note: 'Quantities and a signature block, no prices. Travels with the goods.',
  },
]

export function Orders() {
  const { orders } = useOperations()
  const [filter, setFilter] = useState<Filter>('all')

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
                    <span className="block text-[11px] text-muted-foreground">
                      {new Date(o.placedAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </Td>
                  <Td>
                    <span className="block text-[13px] font-medium">{o.customer}</span>
                    <span className="block text-[12px] text-muted-foreground">{o.town}</span>
                  </Td>
                  <Td>
                    <span className="text-[13px]">
                      {(() => {
                        const n = o.lines.reduce((sum, l) => sum + l.qty, 0)
                        return `${n} ${n === 1 ? 'item' : 'items'}`
                      })()}
                    </span>
                    <span className="block max-w-48 truncate text-[12px] text-muted-foreground">
                      {o.lines[0].name}
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
                    {money(orderTotal(o))}
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
  const { orders } = useOperations()
  const order = orders.find((o) => o.id === id)

  // Held in the store rather than here, so moving an order on also empties
  // the "orders to pack" queue the dashboard, the sidebar and the bell read.
  const status = order?.status ?? 'new'
  const setStatus = (next: OrderStatus) => setOrderStatus(id, next)

  if (!order) {
    return (
      <>
        <PageHeader title="Order not found" />
        <Button to="/admin/orders">Back to orders</Button>
      </>
    )
  }

  const goodsTotal = order.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const stageIndex = flow.indexOf(status)

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
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
            <Button size="sm" variant="outline" onClick={() => printDocument(documentFor(order, 'delivery-note'))}>
              Print delivery note
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
                      <span className="block text-[12px] text-muted-foreground">{l.variant}</span>
                    </Td>
                    <Td align="right">{l.qty}</Td>
                    <Td align="right">{money(l.unitPrice)}</Td>
                    <Td align="right" className="font-semibold">
                      {money(l.unitPrice * l.qty)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goods</span>
                <span className="font-medium">{money(goodsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={cx('font-medium', order.delivery === 0 && 'text-[#1a6b39]')}>
                  {order.delivery === 0 ? 'Free' : money(order.delivery)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 font-display text-base font-bold">
                <span>Total</span>
                <span>{money(orderTotal(order))}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Fulfilment" hint="Moving this on notifies the customer by SMS" />
            <ol className="flex flex-wrap items-center gap-y-3">
              {flow.map((s, i) => (
                <li key={s} className="flex items-center">
                  <button
                    onClick={() => setStatus(s)}
                    className="flex items-center gap-2"
                    aria-pressed={i === stageIndex}
                  >
                    <span
                      className={cx(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                        i < stageIndex && 'bg-[#e8f5ec] text-[#1a6b39]',
                        i === stageIndex && 'bg-brand text-white',
                        i > stageIndex && 'bg-shell text-muted-foreground',
                      )}
                    >
                      {i < stageIndex ? '✓' : i + 1}
                    </span>
                    <span
                      className={cx(
                        'text-[12px] whitespace-nowrap',
                        i === stageIndex ? 'font-semibold text-ink' : 'text-muted-foreground',
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
            <CardHeader title="Documents" />
            <ul className="space-y-3">
              {DOCUMENTS.map((doc) => {
                const blocked = doc.requiresPaid && !order.paid
                return (
                  <li key={doc.kind}>
                    <p className="text-[13px] font-medium text-ink">{doc.label}</p>
                    <p className="mt-0.5 mb-2 text-[12px] leading-relaxed text-muted-foreground">
                      {blocked ? doc.blockedNote : doc.note}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={blocked}
                        onClick={() => printDocument(documentFor(order, doc.kind))}
                      >
                        Print
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={blocked}
                        onClick={() => downloadDocument(documentFor(order, doc.kind))}
                      >
                        Download
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted-foreground">
              None of these is a tax invoice. That is issued by the backend once eTIMS is wired, and
              each document says so on its face.
            </p>
          </Card>

          <Card>
            <CardHeader title="Payment" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{payLabel[order.pay]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cx('font-medium', order.paid ? 'text-[#1a6b39]' : 'text-brand')}>
                  {order.paid ? 'Paid in full' : 'Awaiting payment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placed</span>
                <span className="font-medium">
                  {new Date(order.placedAt).toLocaleString('en-KE')}
                </span>
              </div>
            </div>

            {/*
              The code the customer gave at checkout. It is a claim, not a
              confirmation: Pochi la Biashara has no callback, so nothing in
              this app knows whether the money arrived. Somebody has to look at
              the statement, which is what the button underneath is for.
            */}
            {order.mpesaCode && (
              <div className="mt-4 rounded-xl border border-line bg-shell p-3">
                <span className="block text-[12px] text-muted-foreground">
                  Customer reported paying with
                </span>
                <span className="mt-0.5 block font-ui text-[15px] font-semibold tracking-[0.08em]">
                  {order.mpesaCode}
                </span>
                {!order.paid && (
                  <>
                    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                      Check it against the M-Pesa statement for {money(orderTotal(order))} before
                      marking this paid. The receipt unlocks when you do.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => setOrderPaid(order.id, true)}
                    >
                      I have matched it, mark as paid
                    </Button>
                  </>
                )}
              </div>
            )}

            {!order.mpesaCode && !order.paid && (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setOrderPaid(order.id, true)}>
                Mark as paid
              </Button>
            )}
          </Card>

          <Card>
            <CardHeader title="Deliver to" />
            <address className="text-[13px] leading-relaxed not-italic">
              <span className="block font-medium">{order.customer}</span>
              <span className="block text-muted-foreground">{order.phone}</span>
              <span className="block text-muted-foreground">{order.town}</span>
            </address>
          </Card>
        </aside>
      </div>
    </>
  )
}
