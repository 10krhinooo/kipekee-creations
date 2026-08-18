import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cx } from '../components/ui'
import { orders, quotes, fittings, stock } from './data/operations'
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

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const adminName = user?.name ?? 'Admin'

  // Live badge counts, so the sidebar doubles as the work queue.
  const newQuotes = quotes.filter((q) => q.status === 'new').length
  const openOrders = orders.filter((o) => o.status === 'new' || o.status === 'packing').length
  const upcoming = fittings.length
  const lowStock = stock.filter((s) => s.mode === 'buy' && s.stock <= s.reorderAt).length

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
        <span className="mt-0.5 block text-[10px] tracking-[0.24em] text-brand-400 uppercase">
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
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
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
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
            {initialsOf(adminName)}
          </span>
          <Link to="/account/profile" className="min-w-0 flex-1" title="Your details">
            <span className="block truncate text-[13px] font-medium text-white">{adminName}</span>
            <span className="block text-[11px] text-white/50">
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
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-ink px-3 py-5 lg:flex">
        {sidebar}
      </aside>

      <div
        onClick={() => setOpen(false)}
        className={cx(
          'fixed inset-0 z-40 bg-ink/50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink px-3 py-5 transition-transform duration-300 lg:hidden',
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

          <div className="relative hidden max-w-sm flex-1 sm:block">
            <input
              placeholder="Search orders, quotes, customers"
              className="w-full rounded-full border border-line bg-shell py-2 pr-4 pl-10 text-sm outline-none focus:border-brand focus:bg-white"
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

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[13px] text-muted sm:inline">
              {new Date('2026-08-16T12:00:00').toLocaleDateString('en-KE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
            <button className="relative rounded-full p-2.5 hover:bg-shell" aria-label="Notifications" title="Notifications">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
                <path d="M13.7 21a2 2 0 01-3.4 0" />
              </svg>
              {newQuotes > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand" />
              )}
            </button>
          </div>
        </header>

        <main key={location.pathname} className="animate-page-rise px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
