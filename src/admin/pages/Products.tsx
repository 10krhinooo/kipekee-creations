import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../lib/format'
import { Button, cx } from '../../components/ui'
import { adjustStock, useCatalogue } from '../../data/catalogueStore'
import type { Product } from '../../data/types'
import { Card, PageHeader, Segmented, Table, Td, Th } from '../components/AdminUI'
import { ProductForm } from '../components/ProductForm'
import { isLow, rowOf } from '../data/stock'

type Filter = 'all' | 'buy' | 'quote' | 'low'

/**
 * The catalogue, as staff work on it.
 *
 * Every row here is a product the shop is selling, read from the same
 * catalogue the shop renders. It used to be a separate list of thirteen
 * hand-written rows, which meant five products - the entire hotel linen range
 * among them - could not be seen or edited from the console at all, and the
 * ones that could showed stock counts the shop disagreed with.
 *
 * The mode column is the consequential one: it decides whether the storefront
 * offers "Add to cart" or "Request a quote", so it decides whether a shopper
 * can buy the thing without anyone speaking to them.
 */
export function Products() {
  const catalogue = useCatalogue()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  /** The row just saved, highlighted briefly so a change is visibly a change. */
  const [saved, setSaved] = useState<string | null>(null)

  const rows = useMemo(() => {
    let list = catalogue.map(rowOf)
    if (filter === 'buy' || filter === 'quote') list = list.filter((s) => s.mode === filter)
    if (filter === 'low') list = list.filter(isLow)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((s) => `${s.name} ${s.category}`.toLowerCase().includes(q))
    }
    return list
  }, [catalogue, filter, query])

  const all = useMemo(() => catalogue.map(rowOf), [catalogue])

  const options: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: all.length },
    { id: 'buy', label: 'Ready-made', count: all.filter((s) => s.mode === 'buy').length },
    { id: 'quote', label: 'Made to measure', count: all.filter((s) => s.mode === 'quote').length },
    { id: 'low', label: 'Low stock', count: all.filter(isLow).length },
  ]

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (slug: string) => {
    setEditing(catalogue.find((p) => p.slug === slug) ?? null)
    setFormOpen(true)
  }

  const onSaved = (slug: string) => {
    setSaved(slug)
    window.setTimeout(() => setSaved((s) => (s === slug ? null : s)), 2500)
  }

  return (
    <>
      <PageHeader
        title="Products"
        intro="Prices, stock levels, and whether each product is bought outright or quoted. Everything here is live on the shop."
        action={
          <Button size="sm" onClick={openNew}>
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
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
              const low = isLow(s)
              return (
                <tr
                  key={s.slug}
                  className={cx(
                    'transition-colors',
                    saved === s.slug ? 'bg-ok-bg' : 'hover:bg-shell',
                  )}
                >
                  <Td>
                    <button
                      onClick={() => openEdit(s.slug)}
                      className="block text-left text-console font-medium hover:text-brand hover:underline"
                    >
                      {s.name}
                    </button>
                    <span className="block text-console-sm text-muted-foreground">{s.unit}</span>
                  </Td>
                  <Td>
                    <span className="text-console text-muted-foreground">{s.category}</span>
                  </Td>
                  <Td>
                    <span
                      className={cx(
                        'inline-flex rounded-full border px-2.5 py-1 text-console-xs font-semibold',
                        s.mode === 'buy'
                          ? 'border-ok-line bg-ok-bg text-ok-ink'
                          : 'border-ink bg-ink text-white',
                      )}
                    >
                      {s.mode === 'buy' ? 'Buy now' : 'Quoted'}
                    </span>
                  </Td>
                  <Td align="right" className="font-semibold whitespace-nowrap">
                    {s.mode === 'quote' && (
                      <span className="text-console-xs font-normal text-muted-foreground">from </span>
                    )}
                    {money(s.price)}
                  </Td>
                  <Td align="right">
                    {s.mode === 'quote' ? (
                      <span className="text-console text-muted-foreground">Made to order</span>
                    ) : (
                      <span className={cx('text-console font-semibold', low ? 'text-brand' : 'text-ink')}>
                        {s.stock}
                        {low && <span className="ml-1.5 text-console-xs font-normal">low</span>}
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(s.slug)}
                        className="text-console text-brand hover:underline"
                      >
                        Edit
                      </button>
                      <Link
                        to={`/admin/products/${s.slug}/photos`}
                        className="text-console text-brand hover:underline"
                      >
                        Photos
                      </Link>
                      {/* Quoted work is cut to order, so there is no shelf to
                          count up or down and the control would do nothing. */}
                      {s.mode === 'buy' && (
                        <div className="inline-flex items-center rounded-full border border-line">
                          <button
                            onClick={() => adjustStock(s.slug, -1)}
                            className="px-2.5 py-1 text-sm hover:text-brand"
                            aria-label={`Reduce stock of ${s.name}`}
                          >
                            &minus;
                          </button>
                          <span className="px-1 text-console-xs text-muted-foreground">adjust</span>
                          <button
                            onClick={() => adjustStock(s.slug, 1)}
                            className="px-2.5 py-1 text-sm hover:text-brand"
                            aria-label={`Increase stock of ${s.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No products match that search.
          </p>
        )}
      </Card>

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        onSaved={onSaved}
      />
    </>
  )
}
