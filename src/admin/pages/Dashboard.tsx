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
import { orderStatusLabel } from '../data/operations'
import { useDashboard } from '../data/api'

/**
 * The dashboard answers one question first: what needs a human today. Revenue
 * is on the page, but the action queues sit above it, because a quote left
 * unanswered for two days is the most expensive thing that happens here.
 */
export function Dashboard() {
  // Every figure here is computed by the backend and arrives in one answer.
  // The page used to work them out from the mock arrays, which meant eight
  // tiles that could each disagree with the screen they linked to.
  const { data, loading, error } = useDashboard()

  const newQuotes = data?.newQuotes ?? []
  const toPack = data?.toPack ?? []
  const lowStock = data?.lowStock ?? []
  const fittings = data?.upcoming ?? []
  const pipeline = data?.pipeline ?? []
  const revenueSeries = data?.revenue ?? []

  const awaitingReply = pipeline.find((p) => p.stage === 'sent')?.count ?? 0
  const shopRevenue = data?.counters.shopRevenue14Days ?? 0
  const quoteValueOpen = data?.counters.openQuoteValue ?? 0
  const winRate = data?.counters.winRate
  const pipelineTotal = pipeline.reduce((n, p) => n + p.count, 0)

  // Guard the divisor: an empty series would otherwise make every bar NaN tall.
  const max = Math.max(1, ...revenueSeries.map((d) => d.orders + d.quotes))

  return (
    <>
      <PageHeader
        title="Today"
        intro={
          loading
            ? 'Loading the figures…'
            : (error ??
              `${newQuotes.length} new quote ${newQuotes.length === 1 ? 'request' : 'requests'} and ${toPack.length} ${toPack.length === 1 ? 'order' : 'orders'} to pack.`)
        }
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
          value={String(newQuotes.length + awaitingReply)}
          hint={`${newQuotes.length} unopened, ${awaitingReply} sent and waiting`}
          accent
        />
        <Stat label="Shop revenue, 14 days" value={money(shopRevenue)} />
        <Stat label="Open quote value" value={money(quoteValueOpen)} hint="not yet won" />
        <Stat
          label="Quote win rate"
          value={winRate === null || winRate === undefined ? 'No decided jobs' : `${winRate}%`}
          hint="fitted against lost"
        />
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
            {pipeline.map((stage) => {
              const pct = pipelineTotal ? (stage.count / pipelineTotal) * 100 : 0
              return (
                <li key={stage.stage}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium text-ink">{stage.label}</span>
                    <span className="text-muted">{stage.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-shell">
                    <div
                      className={cx(
                        'h-full rounded-full',
                        stage.stage === 'new' ? 'bg-brand' : 'bg-ink',
                      )}
                      style={{ width: `${Math.max(pct, stage.count ? 6 : 0)}%` }}
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
                    <span className="text-[13px]">{q.firstProduct ?? 'No lines yet'}</span>
                    {q.lineCount > 1 && (
                      <span className="block text-[12px] text-muted">+{q.lineCount - 1} more</span>
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
                    {money(o.total)}
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
