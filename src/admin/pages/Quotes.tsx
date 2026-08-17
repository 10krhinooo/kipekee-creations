import { useState } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../lib/format'
import { Button } from '../../components/ui'
import {
  Card,
  EmptyState,
  PageHeader,
  Segmented,
  StatusPill,
  Table,
  Td,
  Th,
} from '../components/AdminUI'
import {
  quoteStatusLabel,
  quoteTotal,
  quotes,
  type QuoteStatus,
} from '../data/operations'

type Filter = 'all' | 'action' | QuoteStatus

const since = (iso: string) => {
  const hours = Math.round((new Date('2026-08-16T13:00:00').getTime() - new Date(iso).getTime()) / 3.6e6)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

export function Quotes() {
  const [filter, setFilter] = useState<Filter>('action')

  // "Needs action" is the default view because it is the only one that maps to
  // the promise made on the storefront: a written quote within one working day.
  const needsAction = quotes.filter((q) =>
    ['new', 'measured', 'approved'].includes(q.status),
  )

  const shown =
    filter === 'all'
      ? quotes
      : filter === 'action'
        ? needsAction
        : quotes.filter((q) => q.status === filter)

  const options: { id: Filter; label: string; count: number }[] = [
    { id: 'action', label: 'Needs action', count: needsAction.length },
    { id: 'all', label: 'All', count: quotes.length },
    { id: 'new', label: 'New', count: quotes.filter((q) => q.status === 'new').length },
    { id: 'sent', label: 'Sent', count: quotes.filter((q) => q.status === 'sent').length },
    {
      id: 'in_production',
      label: 'In production',
      count: quotes.filter((q) => q.status === 'in_production').length,
    },
    { id: 'fitted', label: 'Fitted', count: quotes.filter((q) => q.status === 'fitted').length },
  ]

  return (
    <>
      <PageHeader
        title="Quotes"
        intro="Every made-to-measure enquiry, from the first message to the day it is fitted."
        action={
          <Button size="sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New quote
          </Button>
        }
      />

      <div className="mb-5">
        <Segmented options={options} value={filter} onChange={setFilter} />
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Nothing here" body="No quotes match this filter right now." />
      ) : (
        <Card padded={false}>
          <Table>
            <thead>
              <tr>
                <Th>Quote</Th>
                <Th>Customer</Th>
                <Th>Job</Th>
                <Th>Status</Th>
                <Th>Owner</Th>
                <Th align="right">Value</Th>
                <Th align="right">Age</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((q) => {
                const total = quoteTotal(q)
                return (
                  <tr key={q.id} className="hover:bg-shell">
                    <Td>
                      <Link
                        to={`/admin/quotes/${q.id}`}
                        className="font-medium whitespace-nowrap hover:text-brand"
                      >
                        {q.id}
                      </Link>
                      <span className="block text-[11px] text-muted capitalize">{q.source}</span>
                    </Td>
                    <Td>
                      <span className="block text-[13px] font-medium">{q.customer}</span>
                      <span className="block text-[12px] text-muted">{q.area}</span>
                    </Td>
                    <Td>
                      <span className="block text-[13px]">{q.items[0].product}</span>
                      <span className="block text-[12px] text-muted">
                        {q.items.length > 1
                          ? `+${q.items.length - 1} more, `
                          : ''}
                        {q.items.reduce((n, i) => n + i.windows, 0)} windows
                      </span>
                    </Td>
                    <Td>
                      <StatusPill kind="quote" status={q.status} label={quoteStatusLabel[q.status]} />
                    </Td>
                    <Td>
                      <span
                        className={
                          q.owner === 'Unassigned' ? 'text-[13px] text-brand' : 'text-[13px] text-muted'
                        }
                      >
                        {q.owner}
                      </span>
                    </Td>
                    <Td align="right" className="font-semibold whitespace-nowrap">
                      {total > 0 ? money(total) : <span className="text-muted">Not priced</span>}
                    </Td>
                    <Td align="right">
                      <span className="text-[13px] whitespace-nowrap text-muted">
                        {since(q.requestedAt)}
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  )
}
