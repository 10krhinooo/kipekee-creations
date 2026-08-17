import { Link } from 'react-router-dom'
import { money } from '../../lib/format'
import { Button, cx } from '../../components/ui'
import {
  Card,
  CardHeader,
  PageHeader,
  Stat,
  StatusPill,
  Table,
  Td,
  Th,
} from '../components/AdminUI'
import {
  fittings,
  orderStatusLabel,
  orderTotal,
  orders,
  quotePipeline,
  quoteStatusLabel,
  quoteTotal,
  quotes,
  revenueSeries,
  stock,
} from '../data/operations'

/**
 * The dashboard answers one question first: what needs a human today. Revenue
 * is on the page, but the action queues sit above it, because a quote left
 * unanswered for two days is the most expensive thing that happens here.
 */
export function Dashboard() {
  const newQuotes = quotes.filter((q) => q.status === 'new')
  const awaitingReply = quotes.filter((q) => q.status === 'sent')
  const toPack = orders.filter((o) => o.status === 'new' || o.status === 'packing')
  const lowStock = stock.filter((s) => s.mode === 'buy' && s.stock <= s.reorderAt)

  const shopRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + orderTotal(o), 0)
  const quoteValueOpen = quotes
    .filter((q) => !['fitted', 'lost'].includes(q.status))
    .reduce((sum, q) => sum + quoteTotal(q), 0)

  const won = quotes.filter((q) => ['approved', 'in_production', 'fitted'].includes(q.status)).length
  const decided = won + quotes.filter((q) => q.status === 'lost').length
  const winRate = decided ? Math.round((won / decided) * 100) : 0

  const max = Math.max(...revenueSeries.map((d) => d.orders + d.quotes))

  return (
    <>
      <PageHeader
        title="Good morning, Alice"
        intro="Two new quote requests came in overnight. The oldest has been waiting 3 hours."
        action={
          <div className="flex gap-2">
            <Button to="/admin/quotes" size="sm">
              Work the quote queue
            </Button>
            <Button to="/admin/schedule" size="sm" variant="outline">
              Today's schedule
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Quotes awaiting action"
          value={String(newQuotes.length + awaitingReply.length)}
          hint={`${newQuotes.length} unopened, ${awaitingReply.length} sent and waiting`}
          accent
        />
        <Stat label="Shop revenue, 14 days" value={money(shopRevenue)} delta={12} />
        <Stat label="Open quote value" value={money(quoteValueOpen)} delta={31} hint="not yet won" />
        <Stat label="Quote win rate" value={`${winRate}%`} delta={-4} hint="last 30 days" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Revenue chart, stacked so the two revenue streams stay legible. */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue, last 14 days"
            hint="Shop orders against approved quote value"
            action={
              <div className="flex items-center gap-3 text-[12px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
                  Shop
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-ink" />
                  Quotes
                </span>
              </div>
            }
          />
          <div className="flex h-52 items-end gap-1.5">
            {revenueSeries.map((d) => {
              const total = d.orders + d.quotes
              return (
                <div key={d.day} className="group relative flex flex-1 flex-col justify-end gap-0.5">
                  <div
                    className="w-full rounded-t-sm bg-ink transition-opacity group-hover:opacity-80"
                    style={{ height: `${(d.quotes / max) * 100}%` }}
                  />
                  <div
                    className="w-full rounded-t-sm bg-brand transition-opacity group-hover:opacity-80"
                    style={{ height: `${(d.orders / max) * 100}%` }}
                  />
                  <span className="mt-1.5 block truncate text-center text-[10px] text-muted">
                    {d.day.split(' ')[0]}
                  </span>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] whitespace-nowrap text-white group-hover:block">
                    {d.day}: {money(total)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Pipeline funnel */}
        <Card>
          <CardHeader title="Quote pipeline" hint="Where every open job sits" />
          <ul className="space-y-2.5">
            {quotePipeline.map((stage) => {
              const inStage = quotes.filter((q) => q.status === stage)
              const value = inStage.reduce((s, q) => s + quoteTotal(q), 0)
              const pct = (inStage.length / quotes.length) * 100
              return (
                <li key={stage}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium text-ink">{quoteStatusLabel[stage]}</span>
                    <span className="text-muted">
                      {inStage.length}
                      {value > 0 && <span className="ml-1.5 text-[11px]">{money(value)}</span>}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-shell">
                    <div
                      className={cx('h-full rounded-full', stage === 'new' ? 'bg-brand' : 'bg-ink')}
                      style={{ width: `${Math.max(pct, inStage.length ? 6 : 0)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Action queue: new quotes */}
        <Card padded={false}>
          <div className="p-5 pb-0">
            <CardHeader
              title="New quote requests"
              hint="Reply within one working day, as promised on the site"
              action={
                <Link to="/admin/quotes" className="text-[13px] text-brand hover:underline">
                  View all
                </Link>
              }
            />
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Wants</Th>
                <Th>Source</Th>
                <Th align="right">Waiting</Th>
              </tr>
            </thead>
            <tbody>
              {newQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-shell">
                  <Td>
                    <Link to={`/admin/quotes/${q.id}`} className="font-medium hover:text-brand">
                      {q.customer}
                    </Link>
                    <span className="block text-[12px] text-muted">{q.area}</span>
                  </Td>
                  <Td>
                    <span className="text-[13px]">{q.items[0].product}</span>
                    {q.items.length > 1 && (
                      <span className="block text-[12px] text-muted">
                        +{q.items.length - 1} more
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-[12px] text-muted capitalize">{q.source}</span>
                  </Td>
                  <Td align="right">
                    <span className="text-[13px] font-semibold text-brand">
                      {q.id === 'Q-0912' ? '3h' : '5h'}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* Action queue: orders to pack */}
        <Card padded={false}>
          <div className="p-5 pb-0">
            <CardHeader
              title="Orders to pack"
              hint="Before 2pm leaves the workshop today"
              action={
                <Link to="/admin/orders" className="text-[13px] text-brand hover:underline">
                  View all
                </Link>
              }
            />
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th align="right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {toPack.map((o) => (
                <tr key={o.id} className="hover:bg-shell">
                  <Td>
                    <Link to={`/admin/orders/${o.id}`} className="font-medium hover:text-brand">
                      {o.id}
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-[13px]">{o.customer}</span>
                    <span className="block text-[12px] text-muted">{o.town}</span>
                  </Td>
                  <Td>
                    <StatusPill kind="order" status={o.status} label={orderStatusLabel[o.status]} />
                  </Td>
                  <Td align="right" className="font-semibold">
                    {money(orderTotal(o))}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* Today and tomorrow on the road */}
        <Card>
          <CardHeader
            title="Out on the road"
            hint="Next visits booked"
            action={
              <Link to="/admin/schedule" className="text-[13px] text-brand hover:underline">
                Full schedule
              </Link>
            }
          />
          <ul className="space-y-3">
            {fittings.slice(0, 4).map((f) => (
              <li key={f.id} className="flex items-center gap-3">
                <span
                  className={cx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                    f.kind === 'measure' ? 'bg-brand-50 text-brand' : 'bg-[#e8f5ec] text-[#1a6b39]',
                  )}
                >
                  {f.time.slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{f.customer}</span>
                  <span className="block text-[12px] text-muted">
                    {f.kind === 'measure' ? 'Measure' : 'Fitting'} · {f.area} · {f.windows} windows
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-muted">{f.fitter}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Stock warnings */}
        <Card>
          <CardHeader
            title="Running low"
            hint="Below reorder level"
            action={
              <Link to="/admin/products" className="text-[13px] text-brand hover:underline">
                Manage stock
              </Link>
            }
          />
          <ul className="space-y-3">
            {lowStock.map((s) => (
              <li key={s.slug} className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{s.name}</span>
                  <span className="block text-[12px] text-muted">
                    Reorder at {s.reorderAt} {s.unit}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-bold text-brand">{s.stock}</span>
                  <span className="block text-[11px] text-muted">left</span>
                </span>
              </li>
            ))}
            {lowStock.length === 0 && (
              <li className="py-4 text-center text-[13px] text-muted">Everything is above its reorder level.</li>
            )}
          </ul>
        </Card>
      </div>
    </>
  )
}
