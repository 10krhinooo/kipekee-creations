import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, cx } from '../../components/ui'
import { Card, CardHeader, PageHeader } from '../components/AdminUI'
import { useSchedule } from '../data/api'

/**
 * The fitters' week. Measure visits and fittings are the physical half of the
 * business, and the storefront promises a measure within 48 hours, so this
 * board is what makes that promise keepable.
 */
/**
 * The six working days from this Monday.
 *
 * These used to be six hardcoded dates in August 2026, which was fine for a
 * prototype and means an empty board on any other week. The week is worked out
 * from today now, and the same range is what the schedule endpoint is asked
 * for, so the board and the query cannot disagree about which week it is.
 */
const startOfWeek = () => {
  const today = new Date()
  const monday = new Date(today)
  // getDay() is 0 on Sunday, which belongs to the week just gone.
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return monday
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

const weekDays = () =>
  Array.from({ length: 6 }, (_, i) => {
    const date = new Date(startOfWeek())
    date.setDate(date.getDate() + i)
    return {
      date: isoDate(date),
      label: date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' }),
    }
  })

export function Schedule() {
  const DAYS = useMemo(weekDays, [])
  const { data, loading, error } = useSchedule(DAYS[0].date, DAYS.length)
  const fittings = useMemo(() => data ?? [], [data])

  const measures = fittings.filter((f) => f.kind === 'measure').length
  const fits = fittings.filter((f) => f.kind === 'fitting').length

  // The fitters are whoever is actually on the board this week, rather than the
  // two names the prototype had written into it.
  const fitters = [...new Set(fittings.map((f) => f.fitter).filter(Boolean))] as string[]

  return (
    <>
      <PageHeader
        title="Schedule"
        intro={`${measures} measures and ${fits} fittings booked this week across ${fitters.length} ${
          fitters.length === 1 ? 'fitter' : 'fitters'
        }.`}
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

      {loading && <p className="mb-5 text-sm text-muted">Loading the week…</p>}
      {error && <p className="mb-5 text-sm text-brand">{error}</p>}

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
            {fitters.map((fitter) => {
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
                      style={{ width: `${fittings.length ? (count / fittings.length) * 100 : 0}%` }}
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
                // Area is optional on a visit booked off a phone call, and
                // "not recorded" is worth showing rather than dropping: it is
                // the row somebody needs to go and fill in.
                const area = f.area ?? 'Area not recorded'
                acc[area] = (acc[area] ?? 0) + 1
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
