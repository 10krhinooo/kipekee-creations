import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { rooms } from '../data/catalogue'
import { useCatalogue } from '../store/catalogue'
import type { Product } from '../data/types'
import { ProductCard } from '../components/ProductCard'
import { Button, Container, cx } from '../components/ui'
import { money } from '../lib/format'
import { RecentlyViewed } from '../components/RecentlyViewed'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'

const sorts: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Best rated' },
  { id: 'newest', label: 'Newest' },
]

const PRICE_MAX = 9000

/**
 * Faceted browsing driven entirely by the URL, so any filtered view is
 * shareable and back-button safe. The old shop had no filters at all, just
 * 150 products behind a 16-item category tree.
 */
export function Shop() {
  const { products, categories, categoryBySlug } = useCatalogue()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const selectedCategories = params.getAll('category')
  const selectedRooms = params.getAll('room')
  const mode = params.get('mode') ?? ''
  const maxPrice = Number(params.get('max') ?? PRICE_MAX)
  const inStockOnly = params.get('stock') === '1'
  const sort = (params.get('sort') as Sort) ?? 'featured'
  /** Free-text search, handed over by the header's search panel. */
  const search = (params.get('q') ?? '').trim().toLowerCase()

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    mutate(next)
    setParams(next, { replace: true })
  }

  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const current = p.getAll(key)
      p.delete(key)
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      next.forEach((v) => p.append(key, v))
    })

  const setSingle = (key: string, value: string) =>
    update((p) => (value ? p.set(key, value) : p.delete(key)))

  const activeCount =
    selectedCategories.length +
    selectedRooms.length +
    (mode ? 1 : 0) +
    (search ? 1 : 0) +
    (maxPrice < PRICE_MAX ? 1 : 0) +
    (inStockOnly ? 1 : 0)

  const results = useMemo(() => {
    let list: Product[] = products.filter((p) => {
      if (selectedCategories.length && !selectedCategories.includes(p.category)) return false
      if (selectedRooms.length && !p.rooms.some((r) => selectedRooms.includes(r))) return false
      if (
        search &&
        // Same haystack as the header's panel, so "see all results" cannot
        // return a different set from the dropdown that offered it.
        !`${p.name} ${p.summary} ${p.category} ${categoryBySlug(p.category)?.name ?? ''} ${p.rooms.join(' ')}`
          .toLowerCase()
          .includes(search)
      )
        return false
      if (mode && p.mode !== mode) return false
      if (p.price > maxPrice) return false
      if (inStockOnly && !(p.mode === 'buy' && p.stock > 0)) return false
      return true
    })

    list = [...list]
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        list.reverse()
        break
      default:
        list.sort((a, b) => Number(!!b.bestSeller) - Number(!!a.bestSeller))
    }
    return list
  }, [selectedCategories, selectedRooms, mode, maxPrice, inStockOnly, sort, search])

  const heading =
    selectedCategories.length === 1
      ? (categories.find((c) => c.slug === selectedCategories[0])?.name ?? 'Shop')
      : mode === 'quote'
        ? 'Made to measure'
        : mode === 'buy'
          ? 'Ready-made, in stock'
          : 'All products'

  const subheading =
    selectedCategories.length === 1
      ? categories.find((c) => c.slug === selectedCategories[0])?.blurb
      : mode === 'quote'
        ? 'Cut to your window and fitted by our team. Free measure across Nairobi.'
        : mode === 'buy'
          ? 'Priced, in stock and out of the workshop the same day.'
          : 'Everything Kipekee makes and stocks, with the price on every card.'

  const Filters = (
    <div className="space-y-7">
      <FilterGroup title="Category">
        {categories.map((c) => (
          <Check
            key={c.slug}
            checked={selectedCategories.includes(c.slug)}
            onChange={() => toggleMulti('category', c.slug)}
            label={c.name}
            count={products.filter((p) => p.category === c.slug).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Room">
        {rooms.map((r) => (
          <Check
            key={r}
            checked={selectedRooms.includes(r)}
            onChange={() => toggleMulti('room', r)}
            label={r}
            count={products.filter((p) => p.rooms.includes(r)).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="How you buy it">
        {[
          { id: 'buy', label: 'Buy now, ready-made' },
          { id: 'quote', label: 'Made to measure' },
        ].map((m) => (
          <Check
            key={m.id}
            type="radio"
            checked={mode === m.id}
            onChange={() => setSingle('mode', mode === m.id ? '' : m.id)}
            label={m.label}
            count={products.filter((p) => p.mode === m.id).length}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Maximum price">
        <input
          type="range"
          min={500}
          max={PRICE_MAX}
          step={100}
          value={maxPrice}
          onChange={(e) => setSingle('max', e.target.value)}
          className="w-full accent-[#a11c20]"
          aria-label="Maximum price"
        />
        <p className="mt-1 text-[13px] text-muted">
          Up to <strong className="text-ink">{money(maxPrice)}</strong>
          {maxPrice >= PRICE_MAX && ' (no limit)'}
        </p>
      </FilterGroup>

      <FilterGroup title="Availability">
        <Check
          checked={inStockOnly}
          onChange={() => setSingle('stock', inStockOnly ? '' : '1')}
          label="In stock, ships today"
          count={products.filter((p) => p.mode === 'buy' && p.stock > 0).length}
        />
      </FilterGroup>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}>
          Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{heading}</h1>
        {subheading && <p className="mt-3 max-w-2xl text-[15px] text-muted">{subheading}</p>}
      </header>

      <div className="flex gap-10">
        <aside className="hidden w-60 shrink-0 lg:block">{Filters}</aside>

        <div className="min-w-0 flex-1">
          {search && (
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-shell px-3 py-1.5 text-[13px]">
                Searching “{search}”
                <button
                  onClick={() => setSingle('q', '')}
                  aria-label="Clear the search"
                  className="text-muted hover:text-brand"
                >
                  &times;
                </button>
              </span>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
            <p className="text-sm text-muted">
              <strong className="text-ink">{results.length}</strong>{' '}
              {results.length === 1 ? 'product' : 'products'}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium lg:hidden"
              >
                Filters
                {activeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </button>

              <label className="sr-only" htmlFor="sort">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSingle('sort', e.target.value)}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand"
              >
                {sorts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-20 text-center">
              <h2 className="font-display text-lg font-semibold">Nothing matches those filters</h2>
              <p className="mx-auto mt-2 mb-6 max-w-sm text-sm text-muted">
                Try widening the price range, or tell us what you're after and we'll make it.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </Button>
                <Button to="/contact">Ask us to make it</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          )}

          <RecentlyViewed />
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div
        onClick={() => setFiltersOpen(false)}
        className={cx(
          'fixed inset-0 z-50 bg-ink/40 transition-opacity lg:hidden',
          filtersOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        className={cx(
          'fixed top-0 bottom-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-white p-5 transition-transform duration-300 lg:hidden',
          filtersOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Filters</h2>
          <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="p-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {Filters}
        <div className="mt-8">
          <Button full size="lg" onClick={() => setFiltersOpen(false)}>
            Show {results.length} {results.length === 1 ? 'product' : 'products'}
          </Button>
        </div>
      </div>
    </Container>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Check({
  checked,
  onChange,
  label,
  count,
  type = 'checkbox',
}: {
  checked: boolean
  onChange: () => void
  label: string
  count?: number
  type?: 'checkbox' | 'radio'
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[#a11c20]"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-[12px] text-muted">{count}</span>}
    </label>
  )
}
