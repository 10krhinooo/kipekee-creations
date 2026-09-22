import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cx } from '../components/ui'
import { fittings } from './data/operations'
import { isLow, useStock } from './data/stock'
import { useOperations } from './data/store'
import { NotificationsPanel, useAlerts } from './components/Notifications'
import { useAuth } from '../auth/AuthProvider'

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('') || 'A'

const icons = {
  dashboard: <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z" />,
  quotes: (
    <>
      <path d="M9 3h6l4 4v14H5V3h4z" />
      <path d="M15 3v5h4M9 13h6M9 17h4" />
    </>
  ),
  orders: (
    <>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6L5 2H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </>
  ),
  schedule: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  products: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </>
  ),
  accounts: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <path d="M17.5 3.5l1 1.6 1.8.3-1.3 1.3.3 1.8-1.8-.9-1.8.9.3-1.8L14.7 5.4l1.8-.3z" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <path d="M16 5.5a3.5 3.5 0 010 6M18 20c0-2.6-1-4.9-2.6-6.4" />
    </>
  ),
}

/**
 * Console search.
 *
 * This was a styled `<input>` with no `value`, no `onChange` and no handler:
 * furniture that looked like a feature. Staff typed an order number into it
 * and nothing happened, which is a worse outcome than not offering a search at
 * all, because they had to discover it was decoration before they stopped
 * trying.
 *
 * It searches what the console actually holds: orders by reference, customer
 * or town; quotes by reference, customer or area. Enter goes to the first hit,
 * which is what somebody pasting a reference in wants.
 */
function ConsoleSearch() {
  const { orders, quotes } = useOperations()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const term = q.trim().toLowerCase()
  const hits = term
    ? [
        ...orders
          .filter((o) =>
            [o.id, o.customer, o.town].some((v) => v.toLowerCase().includes(term)),
          )
          .slice(0, 4)
          .map((o) => ({
            key: `o-${o.id}`,
            to: `/admin/orders/${o.id}`,
            kind: 'Order',
            title: o.id,
            detail: `${o.customer} · ${o.town}`,
          })),
        ...quotes
          .filter((x) =>
            [x.id, x.customer, x.area].some((v) => v.toLowerCase().includes(term)),
          )
          .slice(0, 4)
          .map((x) => ({
            key: `q-${x.id}`,
            to: `/admin/quotes/${x.id}`,
            kind: 'Quote',
            title: x.id,
            detail: `${x.customer} · ${x.area}`,
          })),
      ]
    : []

  const go = (to: string) => {
    setQ('')
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="relative hidden max-w-sm flex-1 sm:block">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // A blur that fires before the click lands would close the list out
        // from under the pointer, so it waits a frame.
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hits[0]) go(hits[0].to)
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Search orders, quotes, customers"
        aria-label="Search the console"
        className="w-full rounded-full border border-line bg-shell py-2 pr-4 pl-10 text-sm outline-none focus:border-brand focus:bg-white"
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

      {open && term !== '' && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-console text-muted-foreground">
              Nothing matches &ldquo;{q.trim()}&rdquo;.
            </p>
          ) : (
            hits.map((hit) => (
              <button
                key={hit.key}
                onClick={() => go(hit.to)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-shell"
              >
                <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 font-ui text-console-2xs font-semibold tracking-wide text-ink uppercase">
                  {hit.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-console font-medium text-ink">
                    {hit.title}
                  </span>
                  <span className="block truncate text-console-sm text-muted-foreground">
                    {hit.detail}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const adminName = user?.name ?? 'Admin'

  // Escape closes the drawer, and while it is open the page behind it does not
  // scroll. Both are what makes a slide-over feel like a panel rather than a
  // second page: without the scroll lock, dragging the menu drags the console
  // underneath it, which on a phone is the difference between "a drawer" and
  // "something went wrong".
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  // Changing page closes the panel: it describes the queues, and leaving it
  // open over the screen it just sent you to only asks to be dismissed twice.
  useEffect(() => setBellOpen(false), [location.pathname])

  const { quotes, orders } = useOperations()
  const stock = useStock()
  const { alerts, clearAll } = useAlerts()

  // Live badge counts, so the sidebar doubles as the work queue.
  const newQuotes = quotes.filter((q) => q.status === 'new').length
  const openOrders = orders.filter((o) => o.status === 'new' || o.status === 'packing').length
  const upcoming = fittings.length
  const lowStock = stock.filter(isLow).length

  const nav = [
    { to: '/admin', label: 'Dashboard', icon: icons.dashboard, end: true },
    { to: '/admin/quotes', label: 'Quotes', icon: icons.quotes, badge: newQuotes, urgent: true },
    { to: '/admin/orders', label: 'Orders', icon: icons.orders, badge: openOrders },
    { to: '/admin/schedule', label: 'Schedule', icon: icons.schedule, badge: upcoming },
    { to: '/admin/products', label: 'Products', icon: icons.products, badge: lowStock, urgent: true },
    { to: '/admin/customers', label: 'Customers', icon: icons.customers },
    // Managing who works here is an admin's job, so staff are not shown a link
    // to a page that would only refuse them.
    ...(isAdmin
      ? [{ to: '/admin/accounts', label: 'Workshop accounts', icon: icons.accounts }]
      : []),
  ]

  const sidebar = (
    <>
      <Link to="/admin" className="mb-7 block px-3">
        <span className="font-display text-lg leading-none font-bold text-white">Kipekee</span>
        <span className="mt-0.5 block text-console-2xs tracking-[0.24em] text-brand-400 uppercase">
          Workshop
        </span>
      </Link>

      <nav className="space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/6 hover:text-white',
              )
            }
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {item.icon}
            </svg>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span
                className={cx(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-console-xs font-bold',
                  item.urgent ? 'bg-brand text-white' : 'bg-white/15 text-white',
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/6 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M14 3h7v7M21 3l-9 9M10 5H4v15h15v-6" />
          </svg>
          View storefront
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-3 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-console-sm font-bold text-white">
            {initialsOf(adminName)}
          </span>
          <Link to="/admin/profile" className="min-w-0 flex-1" title="Your details">
            <span className="block truncate text-console font-medium text-white">{adminName}</span>
            <span className="block text-console-xs text-white/50">
              {isAdmin ? 'Admin' : 'Staff'} · your details
            </span>
          </Link>
          <button
            onClick={() => {
              logout().then(() => navigate('/login', { replace: true }))
            }}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/6 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-shell">
      {/* Fixed sidebar on desktop, slide-over on mobile. */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-y-auto bg-ink px-3 py-5 lg:flex">
        {sidebar}
      </aside>

      {/* The scrim fades over exactly as long as the panel takes to travel.
          Left on the default 150ms it finished first, so the last third of the
          slide happened against an already-bare page and read as a stutter. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cx(
          'fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 ease-out lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      {/* Kept mounted rather than conditionally rendered, because a panel that
          only exists while open has nothing to slide in from. `inert` while
          closed is what stops the off-screen copy of the whole menu from
          collecting tab stops and being read out by a screen reader - the cost
          of keeping it there. */}
      <aside
        inert={!open}
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-ink px-3 py-5 transition-transform duration-300 ease-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="-ml-1 rounded-lg p-2 lg:hidden"
            aria-label="Open menu"
            title="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <ConsoleSearch />

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-console text-muted-foreground sm:inline">
              {/* The real date. This read off the seed's frozen clock, so the
                  console told whoever was using it that today was the 16th of
                  August, every day, forever. */}
              {new Date().toLocaleDateString('en-KE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-full p-2.5 hover:bg-shell"
                aria-label={
                  alerts.length > 0
                    ? `Notifications, ${alerts.length} needing attention`
                    : 'Notifications'
                }
                aria-expanded={bellOpen}
                aria-haspopup="dialog"
                title="Notifications"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
                  <path d="M13.7 21a2 2 0 01-3.4 0" />
                </svg>
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand" />
                )}
              </button>

              {bellOpen && (
                <NotificationsPanel
                  alerts={alerts}
                  onClear={clearAll}
                  onClose={() => setBellOpen(false)}
                />
              )}
            </div>
          </div>
        </header>

        <main key={location.pathname} className="animate-page-rise px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
