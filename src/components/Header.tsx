import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { categories, categoryBySlug, products } from '../data/catalogue'
import { useBasket } from '../store/basket'
import { useSaved } from '../store/saved'
import { swatch } from '../lib/swatch'
import { Button, Container, WhatsAppIcon, cx, whatsappLink } from './ui'
import { money } from '../lib/format'

/*
 * One menu, grouped by how people actually shop: by room, then by product.
 * Eight categories rather than a long flat list, so the choice stays small
 * enough to make.
 */
const primary = [
  { to: '/shop', label: 'Shop' },
  { to: '/custom-curtains', label: 'Made to Measure' },
  { to: '/hotel-linen', label: 'For Hotels' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/**
 * Header search.
 *
 * Matches against the room list and the resolved category *name* as well as the
 * product text, because the category field holds a slug: without that, "bedroom"
 * and "wrought iron" both return nothing, which are two of the likelier things
 * somebody types.
 *
 * The results panel is a listbox rather than a stack of buttons. Arrow keys move
 * through it and Enter opens the active hit, so the fastest path through the
 * catalogue does not require reaching for the mouse.
 */
function Search({ onDone }: { onDone?: () => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const query = q.trim().toLowerCase()

  const hits = useMemo(() => {
    if (query.length < 2) return []
    return products
      .filter((p) => {
        const category = categoryBySlug(p.category)?.name ?? ''
        return `${p.name} ${p.summary} ${p.category} ${category} ${p.rooms.join(' ')}`
          .toLowerCase()
          .includes(query)
      })
      .slice(0, 6)
  }, [query])

  const showPanel = open && query.length > 1

  // Cmd/Ctrl-K focuses search, but not while somebody is typing into another
  // field, where it would yank focus mid-sentence.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'k' || !(e.metaKey || e.ctrlKey)) return
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Clicking away closes the panel. Blur alone is not enough, because a click
  // on a result blurs the input before the click lands on it.
  useEffect(() => {
    if (!showPanel) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPanel])

  const go = (to: string) => {
    navigate(to)
    setQ('')
    setOpen(false)
    onDone?.()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!showPanel) return
    // One past the last hit is the "see all results" row.
    const last = hits.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i >= last ? 0 : i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? last : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = hits[active]
      go(hit ? `/product/${hit.slug}` : `/shop?q=${encodeURIComponent(q.trim())}`)
    }
  }

  return (
    <div className="relative w-full" ref={wrapRef}>
      <label className="sr-only" htmlFor="kc-search">
        Search products
      </label>
      <input
        id="kc-search"
        ref={inputRef}
        value={q}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search curtains, fabrics, towels…"
        className="w-full rounded-full border border-line bg-shell py-2.5 pr-4 pl-11 text-sm outline-none transition-colors focus:border-brand focus:bg-white"
      />
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-xl"
        >
          {hits.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">No products match “{q.trim()}”.</p>
          ) : (
            hits.map((p, i) => (
              <button
                key={p.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(`/product/${p.slug}`)}
                className={cx(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm',
                  i === active ? 'bg-shell' : 'bg-white',
                )}
              >
                <img
                  src={swatch(p.pattern, p.colours[0].swatch || p.accent, i)}
                  alt=""
                  className="h-9 w-8 shrink-0 rounded-md object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{p.name}</span>
                  <span className="block truncate text-[12px] text-muted">
                    {categoryBySlug(p.category)?.name}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {p.mode === 'quote' ? 'from ' : ''}
                  {money(p.price)}
                </span>
              </button>
            ))
          )}

          {hits.length > 0 && (
            <button
              id={`${listId}-${hits.length}`}
              role="option"
              aria-selected={active === hits.length}
              onMouseEnter={() => setActive(hits.length)}
              onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`)}
              className={cx(
                'block w-full border-t border-line px-4 py-2.5 text-left text-[13px] font-medium text-brand',
                active === hits.length ? 'bg-shell' : 'bg-white',
              )}
            >
              See all results for “{q.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { cartCount, quoteCount, openDrawer } = useBasket()
  const { savedCount } = useSaved()
  const [open, setOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    setShopOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      {/* Announcement bar carries the two promises worth repeating everywhere. */}
      <div className="bg-ink text-white">
        <Container wide className="flex h-9 items-center justify-between text-[12px]">
          <p className="truncate">
            Free delivery in Nairobi over <strong>{money(10000)}</strong> · Free window measure
          </p>
          <a
            href={whatsappLink('Hello Kipekee, I have a question about your products.')}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-1.5 hover:text-brand-200 sm:inline-flex"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            0721 527 797
          </a>
        </Container>
      </div>

      <Container wide className="border-b border-line">
        <div className="flex h-18 items-center gap-4 py-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="-ml-1 rounded-lg p-2 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>

          <Link to="/" className="shrink-0">
            <span className="font-display text-xl leading-none font-bold tracking-tight text-ink">
              Kipekee
            </span>
            <span className="block text-[10px] tracking-[0.28em] text-brand uppercase">
              Creations
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <NavLink
                to="/shop"
                className={({ isActive }) =>
                  cx(
                    'inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-brand' : 'text-ink hover:text-brand',
                  )
                }
              >
                Shop
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </NavLink>

              {shopOpen && (
                <div className="absolute top-full left-0 w-[560px] rounded-2xl border border-line bg-white p-3 shadow-xl">
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        to={`/shop?category=${c.slug}`}
                        className="rounded-xl px-3 py-2.5 transition-colors hover:bg-shell"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-ink">
                          {c.name}
                          {c.mode === 'quote' && (
                            <span className="rounded bg-sand px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
                              Quoted
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                          {c.blurb}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {primary.slice(1).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-brand' : 'text-ink hover:text-brand',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden max-w-xs flex-1 md:block">
            <Search />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            {/* Saved sits left of the two baskets: it is the step before either
                of them, not a third destination. */}
            <Link
              to="/wishlist"
              className="relative rounded-full p-2.5 transition-colors hover:bg-shell"
              aria-label={`Saved products, ${savedCount} items`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={savedCount > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 20.5l-1.4-1.3C5.4 14.5 2 11.4 2 7.6 2 4.9 4.1 3 6.7 3c1.5 0 3 .7 3.9 1.9l1.4 1.8 1.4-1.8C14.3 3.7 15.8 3 17.3 3 19.9 3 22 4.9 22 7.6c0 3.8-3.4 6.9-8.6 11.6z" />
              </svg>
              {savedCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* Two baskets, always visible, so neither path is ever a dead end. */}
            <button
              onClick={() => openDrawer('quote')}
              className="relative rounded-full p-2.5 transition-colors hover:bg-shell"
              aria-label={`Quote list, ${quoteCount} items`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M9 3h6l4 4v14H5V3h4z" />
                <path d="M15 3v5h4M9 13h6M9 17h4" />
              </svg>
              {quoteCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                  {quoteCount}
                </span>
              )}
            </button>

            <button
              onClick={() => openDrawer('cart')}
              className="relative rounded-full p-2.5 transition-colors hover:bg-shell"
              aria-label={`Cart, ${cartCount} items`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6L5 2H2" />
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Container>

      {open && (
        <div className="border-b border-line bg-white lg:hidden">
          <Container wide className="space-y-1 py-4">
            <div className="mb-3">
              <Search onDone={() => setOpen(false)} />
            </div>
            {primary.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-shell"
              >
                {item.label}
              </NavLink>
            ))}
            <p className="px-3 pt-4 pb-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Categories
            </p>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/shop?category=${c.slug}`}
                className="block rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-shell"
              >
                {c.name}
              </Link>
            ))}
            <div className="px-3 pt-4">
              <Button
                variant="whatsapp"
                full
                href={whatsappLink('Hello Kipekee, I have a question about your products.')}
              >
                <WhatsAppIcon />
                Chat on WhatsApp
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
