import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../lib/format'
import { Button, cx } from '../../components/ui'
import { Card, PageHeader, Segmented, Table, Td, Th } from '../components/AdminUI'
import { stock } from '../data/operations'

type Filter = 'all' | 'buy' | 'quote' | 'low'

/**
 * Catalogue and stock in one table. The mode column is the important one: it
 * decides whether the storefront shows "Add to cart" or "Get a quote", which
 * decides whether the storefront offers a price or a quote, so it is the most
 * consequential field on the row.
 */
export function Products() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [levels, setLevels] = useState<Record<string, number>>(
    Object.fromEntries(stock.map((s) => [s.slug, s.stock])),
  )

  const rows = useMemo(() => {
    let list = stock
    if (filter === 'buy' || filter === 'quote') list = list.filter((s) => s.mode === filter)
    if (filter === 'low') list = list.filter((s) => s.mode === 'buy' && levels[s.slug] <= s.reorderAt)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((s) => `${s.name} ${s.category}`.toLowerCase().includes(q))
    }
    return list
  }, [filter, query, levels])

  const options: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stock.length },
    { id: 'buy', label: 'Ready-made', count: stock.filter((s) => s.mode === 'buy').length },
    { id: 'quote', label: 'Made to measure', count: stock.filter((s) => s.mode === 'quote').length },
    {
      id: 'low',
      label: 'Low stock',
      count: stock.filter((s) => s.mode === 'buy' && levels[s.slug] <= s.reorderAt).length,
    },
  ]

  const adjust = (slug: string, by: number) =>
    setLevels((prev) => ({ ...prev, [slug]: Math.max(0, prev[slug] + by) }))

  return (
    <>
      <PageHeader
        title="Products"
        intro="Prices, stock levels, and whether each product is bought outright or quoted."
        action={
          <Button size="sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add product
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented options={options} value={filter} onChange={setFilter} />
        <div className="relative sm:ml-auto sm:w-64">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
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
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Sold as</Th>
              <Th align="right">Price</Th>
              <Th align="right">Stock</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const level = levels[s.slug]
              const low = s.mode === 'buy' && level <= s.reorderAt
              return (
                <tr key={s.slug} className="hover:bg-shell">
                  <Td>
                    <span className="block text-[13px] font-medium">{s.name}</span>
                    <span className="block text-[12px] text-muted">{s.unit}</span>
                  </Td>
                  <Td>
                    <span className="text-[13px] text-muted">{s.category}</span>
                  </Td>
                  <Td>
                    <span
                      className={cx(
                        'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                        s.mode === 'buy'
                          ? 'border-[#bde2c9] bg-[#e8f5ec] text-[#1a6b39]'
                          : 'border-ink bg-ink text-white',
                      )}
                    >
                      {s.mode === 'buy' ? 'Buy now' : 'Quoted'}
                    </span>
                  </Td>
                  <Td align="right" className="font-semibold whitespace-nowrap">
                    {s.mode === 'quote' && <span className="text-[11px] font-normal text-muted">from </span>}
                    {money(s.price)}
                  </Td>
                  <Td align="right">
                    {s.mode === 'quote' ? (
                      <span className="text-[13px] text-muted">Made to order</span>
                    ) : (
                      <span
                        className={cx(
                          'text-[13px] font-semibold',
                          low ? 'text-brand' : 'text-ink',
                        )}
                      >
                        {level}
                        {low && <span className="ml-1.5 text-[11px] font-normal">low</span>}
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-3">
                    <Link
                      to={`/admin/products/${s.slug}/photos`}
                      className="text-[13px] text-brand hover:underline"
                    >
                      Photos
                    </Link>
                    {s.mode === 'buy' ? (
                      <div className="inline-flex items-center rounded-full border border-line">
                        <button
                          onClick={() => adjust(s.slug, -1)}
                          className="px-2.5 py-1 text-sm hover:text-brand"
                          aria-label={`Reduce stock of ${s.name}`}
                        >
                          &minus;
                        </button>
                        <span className="px-1 text-[11px] text-muted">adjust</span>
                        <button
                          onClick={() => adjust(s.slug, 1)}
                          className="px-2.5 py-1 text-sm hover:text-brand"
                          aria-label={`Increase stock of ${s.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button className="text-[13px] text-brand hover:underline">Edit rates</button>
                    )}
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-muted">No products match that search.</p>
        )}
      </Card>
    </>
  )
}
