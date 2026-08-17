import { useMemo, useState } from 'react'
import { money } from '../../lib/format'
import { cx } from '../../components/ui'
import { Card, PageHeader, Segmented, Table, Td, Th } from '../components/AdminUI'
import { orderTotal, orders, quoteTotal, quotes } from '../data/operations'

type Filter = 'all' | 'retail' | 'trade' | 'both'

interface CustomerRow {
  name: string
  phone: string
  area: string
  orderCount: number
  quoteCount: number
  spent: number
  pipeline: number
  segment: 'retail' | 'trade' | 'both'
  last: string
}

/**
 * Customers are derived from the two transaction streams rather than stored
 * separately, which surfaces the segment that matters most commercially: the
 * people who have both bought stock and commissioned made-to-measure work.
 */
export function Customers() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo<CustomerRow[]>(() => {
    const map = new Map<string, CustomerRow>()

    for (const o of orders) {
      const row = map.get(o.customer) ?? {
        name: o.customer,
        phone: o.phone,
        area: o.town,
        orderCount: 0,
        quoteCount: 0,
        spent: 0,
        pipeline: 0,
        segment: 'retail' as const,
        last: o.placedAt,
      }
      row.orderCount += 1
      if (o.status !== 'cancelled') row.spent += orderTotal(o)
      if (o.placedAt > row.last) row.last = o.placedAt
      map.set(o.customer, row)
    }

    for (const q of quotes) {
      const row = map.get(q.customer) ?? {
        name: q.customer,
        phone: q.phone,
        area: q.area,
        orderCount: 0,
        quoteCount: 0,
        spent: 0,
        pipeline: 0,
        segment: 'trade' as const,
        last: q.requestedAt,
      }
      row.quoteCount += 1
      if (['approved', 'in_production', 'fitted'].includes(q.status)) row.spent += quoteTotal(q)
      else if (q.status !== 'lost') row.pipeline += quoteTotal(q)
      if (q.requestedAt > row.last) row.last = q.requestedAt
      map.set(q.customer, row)
    }

    const list = [...map.values()].map((r) => ({
      ...r,
      segment:
        r.orderCount > 0 && r.quoteCount > 0
          ? ('both' as const)
          : r.quoteCount > 0
            ? ('trade' as const)
            : ('retail' as const),
    }))

    return list.sort((a, b) => b.spent + b.pipeline - (a.spent + a.pipeline))
  }, [])

  const shown = rows
    .filter((r) => (filter === 'all' ? true : r.segment === filter))
    .filter((r) =>
      query.trim() ? `${r.name} ${r.area} ${r.phone}`.toLowerCase().includes(query.toLowerCase()) : true,
    )

  const options: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: rows.length },
    { id: 'retail', label: 'Shop only', count: rows.filter((r) => r.segment === 'retail').length },
    { id: 'trade', label: 'Quotes only', count: rows.filter((r) => r.segment === 'trade').length },
    { id: 'both', label: 'Both', count: rows.filter((r) => r.segment === 'both').length },
  ]

  const segmentLabel = { retail: 'Shop', trade: 'Made to measure', both: 'Both' }

  return (
    <>
      <PageHeader
        title="Customers"
        intro="Built from orders and quotes together, so the people worth calling back are visible."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented options={options} value={filter} onChange={setFilter} />
        <div className="relative sm:ml-auto sm:w-64">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers"
            className="w-full rounded-full border border-line bg-white py-2 pr-4 pl-10 text-sm outline-none focus:border-brand"
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </div>
      </div>

      <Card padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Segment</Th>
              <Th align="right">Orders</Th>
              <Th align="right">Quotes</Th>
              <Th align="right">Spent</Th>
              <Th align="right">In pipeline</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.name} className="hover:bg-shell">
                <Td>
                  <span className="block text-[13px] font-medium">{r.name}</span>
                  <span className="block text-[12px] text-muted">
                    {r.area} · {r.phone}
                  </span>
                </Td>
                <Td>
                  <span
                    className={cx(
                      'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
                      r.segment === 'both'
                        ? 'border-brand bg-brand text-white'
                        : r.segment === 'trade'
                          ? 'border-line bg-ink text-white'
                          : 'border-line bg-shell text-ink',
                    )}
                  >
                    {segmentLabel[r.segment]}
                  </span>
                </Td>
                <Td align="right">{r.orderCount || <span className="text-muted">0</span>}</Td>
                <Td align="right">{r.quoteCount || <span className="text-muted">0</span>}</Td>
                <Td align="right" className="font-semibold whitespace-nowrap">
                  {r.spent ? money(r.spent) : <span className="font-normal text-muted">none yet</span>}
                </Td>
                <Td align="right" className="whitespace-nowrap">
                  {r.pipeline ? (
                    <span className="font-semibold text-brand">{money(r.pipeline)}</span>
                  ) : (
                    <span className="text-muted">nothing open</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {shown.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">No customers match that search.</p>
        )}
      </Card>
    </>
  )
}
