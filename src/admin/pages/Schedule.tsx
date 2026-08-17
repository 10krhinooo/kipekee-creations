import { Link } from 'react-router-dom'
import { Button, cx } from '../../components/ui'
import { Card, CardHeader, PageHeader } from '../components/AdminUI'
import { fittings } from '../data/operations'

/**
 * The fitters' week. Measure visits and fittings are the physical half of the
 * business, and the storefront promises a measure within 48 hours, so this
 * board is what makes that promise keepable.
 */
const DAYS = [
  { date: '2026-08-18', label: 'Mon 18' },
  { date: '2026-08-19', label: 'Tue 19' },
  { date: '2026-08-20', label: 'Wed 20' },
  { date: '2026-08-21', label: 'Thu 21' },
  { date: '2026-08-22', label: 'Fri 22' },
  { date: '2026-08-23', label: 'Sat 23' },
]

export function Schedule() {
  const measures = fittings.filter((f) => f.kind === 'measure').length
  const fits = fittings.filter((f) => f.kind === 'fitting').length

  return (
    <>
      <PageHeader
        title="Schedule"
        intro={`${measures} measures and ${fits} fittings booked this week across two fitters.`}
        action={
          <Button size="sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Book a visit
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-4 text-[13px]">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-brand-50 ring-1 ring-brand-200" />
          Measure visit
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#e8f5ec] ring-1 ring-[#bde2c9]" />
          Fitting
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {DAYS.map((day) => {
          const dayJobs = fittings
            .filter((f) => f.date === day.date)
            .sort((a, b) => a.time.localeCompare(b.time))
          return (
            <Card key={day.date} padded={false} className="flex flex-col">
              <div className="border-b border-line px-4 py-3">
                <p className="font-display text-[14px] font-semibold">{day.label}</p>
                <p className="text-[12px] text-muted">
                  {dayJobs.length === 0
                    ? 'Nothing booked'
                    : `${dayJobs.length} ${dayJobs.length === 1 ? 'visit' : 'visits'}`}
                </p>
              </div>

              <div className="flex-1 space-y-2 p-3">
                {dayJobs.map((f) => (
                  <div
                    key={f.id}
                    className={cx(
                      'rounded-xl border p-3',
                      f.kind === 'measure'
                        ? 'border-brand-200 bg-brand-50'
                        : 'border-[#bde2c9] bg-[#e8f5ec]',
                    )}
                  >
                    <p className="text-[12px] font-bold">{f.time}</p>
                    <p className="mt-0.5 text-[13px] leading-snug font-medium">{f.customer}</p>
                    <p className="mt-0.5 text-[12px] text-ink-soft">{f.area}</p>
                    <p className="mt-1.5 text-[11px] text-ink-soft">
                      {f.fitter} · {f.windows} {f.windows === 1 ? 'window' : 'windows'}
                    </p>
                    {f.quoteId && (
                      <Link
                        to={`/admin/quotes/${f.quoteId}`}
                        className="mt-1.5 inline-block text-[11px] font-medium underline"
                      >
                        {f.quoteId}
                      </Link>
                    )}
                  </div>
                ))}

                {dayJobs.length === 0 && (
                  <button className="w-full rounded-xl border border-dashed border-line py-6 text-[12px] text-muted hover:border-brand hover:text-brand">
                    Add a visit
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Fitter load" hint="Visits booked this week" />
          <ul className="space-y-3">
            {['Peter K.', 'John M.'].map((fitter) => {
              const count = fittings.filter((f) => f.fitter === fitter).length
              const windows = fittings
                .filter((f) => f.fitter === fitter)
                .reduce((n, f) => n + f.windows, 0)
              return (
                <li key={fitter}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-medium">{fitter}</span>
                    <span className="text-muted">
                      {count} visits, {windows} windows
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-shell">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(count / fittings.length) * 100}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Coverage" hint="Where the van is going" />
          <ul className="space-y-2 text-[13px]">
            {Object.entries(
              fittings.reduce<Record<string, number>>((acc, f) => {
                acc[f.area] = (acc[f.area] ?? 0) + 1
                return acc
              }, {}),
            )
              .sort((a, b) => b[1] - a[1])
              .map(([area, n]) => (
                <li key={area} className="flex justify-between">
                  <span>{area}</span>
                  <span className="text-muted">
                    {n} {n === 1 ? 'visit' : 'visits'}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
