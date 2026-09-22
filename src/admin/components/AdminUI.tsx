import type { ReactNode } from 'react'
import { cx } from '../../components/ui'
import type { OrderStatus, QuoteStatus } from '../data/operations'

/** Status pills. Colour carries meaning: red needs action, green is settled. */
const orderTones: Record<OrderStatus, string> = {
  new: 'bg-brand-50 text-brand border-brand-200',
  packing: 'bg-warn-bg text-warn-ink border-warn-line',
  dispatched: 'bg-info-bg text-info-ink border-info-line',
  delivered: 'bg-ok-bg text-ok-ink border-ok-line',
  cancelled: 'bg-shell text-muted-foreground border-line',
}

const quoteTones: Record<QuoteStatus, string> = {
  new: 'bg-brand-50 text-brand border-brand-200',
  measure_booked: 'bg-warn-bg text-warn-ink border-warn-line',
  measured: 'bg-warn-bg text-warn-ink border-warn-line',
  sent: 'bg-info-bg text-info-ink border-info-line',
  approved: 'bg-ok-bg text-ok-ink border-ok-line',
  in_production: 'bg-work-bg text-work-ink border-work-line',
  fitted: 'bg-ok-bg text-ok-ink border-ok-line',
  lost: 'bg-shell text-muted-foreground border-line',
}

export function StatusPill({
  status,
  label,
  kind,
}: {
  status: OrderStatus | QuoteStatus
  label: string
  kind: 'order' | 'quote'
}) {
  const tone =
    kind === 'order'
      ? orderTones[status as OrderStatus]
      : quoteTones[status as QuoteStatus]
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-console-xs font-semibold whitespace-nowrap',
        tone,
      )}
    >
      {label}
    </span>
  )
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section
      className={cx(
        'rounded-2xl border border-line bg-white',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-console-lg font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-console-sm text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * A KPI tile. `delta` is a percentage against the previous period; the sign
 * decides the colour, not the metric, so a fall in cancellations still reads
 * red. Metrics where down is good pass `invert`.
 */
export function Stat({
  label,
  value,
  delta,
  hint,
  invert,
  accent,
}: {
  label: string
  value: string
  delta?: number
  hint?: string
  invert?: boolean
  accent?: boolean
}) {
  const good = delta === undefined ? false : invert ? delta < 0 : delta > 0
  return (
    <Card className={cx(accent && 'border-brand-200 bg-brand-50')}>
      <p className="text-console-sm font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta !== undefined && (
          <span
            className={cx(
              'inline-flex items-center gap-0.5 text-console-sm font-semibold',
              good ? 'text-ok-ink' : 'text-brand',
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className={cx('h-3 w-3', delta < 0 && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-console-sm text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  )
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({
  children,
  align = 'left',
}: {
  children: ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope="col"
      className={cx(
        'border-b border-line px-4 py-3 text-console-xs font-semibold tracking-wide text-muted-foreground uppercase',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <td
      className={cx(
        'border-b border-line px-4 py-3 align-middle',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line py-16 text-center">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

export function PageHeader({
  title,
  intro,
  action,
}: {
  title: string
  intro?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {intro && <p className="mt-1.5 max-w-2xl text-console-md text-muted-foreground">{intro}</p>}
      </div>
      {action}
    </header>
  )
}

/** Segmented filter control used across the list screens. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-shell p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-console font-medium transition-colors',
            value === o.id ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cx(
                'rounded-full px-1.5 text-console-xs',
                value === o.id ? 'bg-shell text-ink' : 'text-muted-foreground',
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
