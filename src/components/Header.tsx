import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { categories, products } from '../data/catalogue'
import { useBasket } from '../store/basket'
import { Button, Container, WhatsAppIcon, cx, whatsappLink } from './ui'
import { money } from '../lib/format'

/*
 * The live site repeats its navigation three times over, a mega menu, a
 * sidebar tree and a top bar, with 16 flat categories. This is one menu,
 * grouped by how people actually shop: by room, then by product.
 */
const primary = [
  { to: '/shop', label: 'Shop' },
  { to: '/custom-curtains', label: 'Made to Measure' },
  { to: '/hotel-linen', label: 'For Hotels' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

function Search({ onDone }: { onDone?: () => void }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const hits =
    q.trim().length > 1
      ? products
          .filter((p) =>
            `${p.name} ${p.summary} ${p.category}`.toLowerCase().includes(q.toLowerCase()),
          )
          .slice(0, 5)
      : []

  return (
    <div className="relative w-full">
      <label className="sr-only" htmlFor="kc-search">
        Search products
      </label>
      <input
        id="kc-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
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

      {hits.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          {hits.map((p) => (
            <button
              key={p.slug}
              onClick={() => {
                navigate(`/product/${p.slug}`)
                setQ('')
                onDone?.()
              }}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-shell"
            >
              <span className="font-medium text-ink">{p.name}</span>
              <span className="shrink-0 text-xs text-muted">
                {p.mode === 'quote' ? 'from ' : ''}
                {money(p.price)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { cartCount, quoteCount, openDrawer } = useBasket()
  const [open, setOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    setShopOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      {/* Announcement bar carries a real, verifiable promise instead of "$200". */}
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
