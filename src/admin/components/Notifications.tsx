import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../../components/ui'
import { NOW, fittings, orders, quotes, since, stock } from '../data/operations'

/**
 * What needs a person right now, in one list.
 *
 * Deliberately the same four queues the sidebar badges count, rather than a
 * separate feed: a notification that does not correspond to something on a
 * screen is a notification nobody can clear. Each row goes to the page that
 * resolves it.
 *
 * Ordered by how expensive it is to ignore. An unanswered quote request is the
 * costliest thing that happens in this business, which is why it leads, and
 * low stock is last because nothing is waiting on it today.
 */

export interface Alert {
  id: string
  title: string
  detail: string
  to: string
  /** Leads the list and takes the accent colour. */
  urgent?: boolean
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const listOf = (names: string[]) => {
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

/** The day part of the prototype's clock, for "today" comparisons. */
const TODAY = NOW.toISOString().slice(0, 10)

export function alertsNow(): Alert[] {
  const out: Alert[] = []

  const newQuotes = quotes.filter((q) => q.status === 'new')
  if (newQuotes.length > 0) {
    // The oldest is what the one-working-day promise is measured against.
    const oldest = newQuotes.reduce((a, b) => (a.requestedAt < b.requestedAt ? a : b))
    out.push({
      id: 'quotes-new',
      title: plural(newQuotes.length, 'new quote request', 'new quote requests'),
      detail: `Oldest waiting ${since(oldest.requestedAt)} · ${oldest.customer}`,
      to: '/admin/quotes',
      urgent: true,
    })
  }

  const toPack = orders.filter((o) => o.status === 'new' || o.status === 'packing')
  if (toPack.length > 0) {
    out.push({
      id: 'orders-pack',
      title: plural(toPack.length, 'order to pack', 'orders to pack'),
      detail: `Before 2pm leaves today · ${listOf(toPack.map((o) => o.id))}`,
      to: '/admin/orders',
    })
  }

  const today = fittings.filter((f) => f.date === TODAY)
  if (today.length > 0) {
    out.push({
      id: 'visits-today',
      title: plural(today.length, 'visit today', 'visits today'),
      detail: listOf(today.map((f) => f.area)),
      to: '/admin/schedule',
    })
  }

  const low = stock.filter((s) => s.mode === 'buy' && s.stock <= s.reorderAt)
  if (low.length > 0) {
    out.push({
      id: 'stock-low',
      title: plural(low.length, 'product low on stock', 'products low on stock'),
      detail: listOf(low.map((s) => s.name)),
      to: '/admin/products',
      urgent: true,
    })
  }

  return out
}

/**
 * The panel itself. Closes on Escape, on a click outside and on following a
 * row, because a menu that survives the click that acted on it is a menu you
 * have to dismiss twice.
 */
export function NotificationsPanel({
  alerts,
  onClose,
}: {
  alerts: Alert[]
  onClose: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onClickAway = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node)) onClose()
    }

    document.addEventListener('keydown', onKey)
    // Deferred to the next frame so the click that opened this does not
    // immediately close it again.
    const id = requestAnimationFrame(() => document.addEventListener('mousedown', onClickAway))

    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', onClickAway)
    }
  }, [onClose])

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Notifications"
      className="absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
    >
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-[14px] font-semibold text-ink">Needs you</h2>
      </div>

      {alerts.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted">
          Nothing needs you right now.
        </p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.id} className="border-b border-line last:border-0">
              <Link
                to={alert.to}
                onClick={onClose}
                className="block px-4 py-3 transition-colors hover:bg-shell"
              >
                <span
                  className={cx(
                    'block text-[13px] font-medium',
                    alert.urgent ? 'text-brand' : 'text-ink',
                  )}
                >
                  {alert.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                  {alert.detail}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
