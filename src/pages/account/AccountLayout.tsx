import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Container, cx } from '../../components/ui'
import { useAuth } from '../../auth/AuthProvider'

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('') || 'K'

const nav = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'Orders and quotes' },
  { to: '/account/saved', label: 'Saved list' },
  { to: '/account/addresses', label: 'Delivery addresses' },
  { to: '/account/profile', label: 'Your details' },
]

/**
 * The account area sits inside the storefront shell rather than in its own,
 * unlike the workshop console. A customer checking an order is still shopping,
 * and taking away the header and basket to show them a receipt would end the
 * visit early.
 */
export function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white">
          {initialsOf(user.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-ink">{user.name}</h1>
          <p className="truncate text-[13px] text-muted">{user.email}</p>
        </div>
        <button
          onClick={() => {
            logout().then(() => navigate('/', { replace: true }))
          }}
          title="Sign out of your account"
          className="ml-auto shrink-0 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand"
        >
          Sign out
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Scrolls horizontally on a phone rather than stacking into a wall of
            links above the content somebody came to read. */}
        <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-sand',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </Container>
  )
}

/** The panel every account page is built from, so the area reads as one thing. */
export function AccountPanel({
  title,
  intro,
  action,
  children,
}: {
  title: string
  intro?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-6 rounded-2xl border border-line p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {intro && <p className="mt-1 text-[13px] leading-relaxed text-muted">{intro}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-shell px-4 py-6 text-center text-[13.5px] leading-relaxed text-muted">
      {children}
    </p>
  )
}
