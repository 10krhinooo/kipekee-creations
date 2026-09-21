import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  /**
   * What this alert is about *right now*, not just which queue it came from.
   * Clearing stores the signature, so dismissing "2 new quote requests"
   * acknowledges those two: when a third arrives the signature changes and
   * the alert comes back. A plain id would have silenced the queue for good.
   */
  signature: string
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
      signature: `quotes-new:${newQuotes.map((q) => q.id).sort().join(',')}`,
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
      signature: `orders-pack:${toPack.map((o) => o.id).sort().join(',')}`,
    })
  }

  const today = fittings.filter((f) => f.date === TODAY)
  if (today.length > 0) {
    out.push({
      id: 'visits-today',
      title: plural(today.length, 'visit today', 'visits today'),
      detail: listOf(today.map((f) => f.area)),
      to: '/admin/schedule',
      signature: `visits-today:${TODAY}:${today.map((f) => f.id).sort().join(',')}`,
    })
  }

  const low = stock.filter((s) => s.mode === 'buy' && s.stock <= s.reorderAt)
  if (low.length > 0) {
    out.push({
      id: 'stock-low',
      title: plural(low.length, 'product low on stock', 'products low on stock'),
      detail: listOf(low.map((s) => s.name)),
      to: '/admin/products',
      signature: `stock-low:${low.map((s) => s.slug).sort().join(',')}`,
      urgent: true,
    })
  }

  return out
}

const DISMISSED_KEY = 'kipekee.admin.dismissed.v1'

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

/**
 * The alerts worth showing, with the cleared ones taken out.
 *
 * Clearing is an acknowledgement of a situation, not of a category: it stores
 * the signature, so the row returns the moment the situation underneath it
 * changes. Signatures that match nothing current are dropped on the way
 * through, which is what stops the store growing forever and is also how an
 * alert clears itself once the work is actually done.
 */
export function useAlerts() {
  const [dismissed, setDismissed] = useState(readDismissed)

  const all = alertsNow()
  const signatures = all.map((a) => a.signature).join('|')

  // Only signatures still matching a live alert are worth keeping.
  useEffect(() => {
    const live = new Set(signatures.split('|'))
    setDismissed((current) => {
      const kept = current.filter((sig) => live.has(sig))
      if (kept.length === current.length) return current
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(kept))
      } catch {
        // Nothing to do if the store is unavailable; the list is still right
        // for this session.
      }
      return kept
    })
  }, [signatures])

  const alerts = useMemo(
    () => all.filter((a) => !dismissed.includes(a.signature)),
    // `all` is derived fresh each render, so the signature list is what
    // actually decides whether this needs recomputing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signatures, dismissed],
  )

  const clearAll = useCallback(() => {
    const next = alertsNow().map((a) => a.signature)
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    } catch {
      // As above.
    }
  }, [])

  return { alerts, clearAll }
}

/**
 * The panel itself. Closes on Escape, on a click outside and on following a
 * row, because a menu that survives the click that acted on it is a menu you
 * have to dismiss twice.
 */
export function NotificationsPanel({
  alerts,
  onClear,
  onClose,
}: {
  alerts: Alert[]
  onClear: () => void
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
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="font-display text-[14px] font-semibold text-ink">Needs you</h2>
        {alerts.length > 0 && (
          <button
            onClick={onClear}
            className="rounded-lg px-2 py-1 text-[12px] text-muted transition-colors hover:bg-shell hover:text-brand"
            title="Clear these until something changes"
          >
            Clear all
          </button>
        )}
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
