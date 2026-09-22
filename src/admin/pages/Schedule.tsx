import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, cx } from '../../components/ui'
import { Card, CardHeader, PageHeader } from '../components/AdminUI'
import { fittings } from '../data/operations'
import { addDays, startOfWeek, toDateKey, weekDays, weekLabel } from '../data/calendar'

/**
 * The fitters' week. Measure visits and fittings are the physical half of the
 * business, and the storefront promises a measure within 48 hours, so this
 * board is what makes that promise keepable.
 */
/*
 * This was a hardcoded list of six dates in August 2026, with two problems.
 *
 * It never moved, so the board showed an empty past week from the moment that
 * week ended. And the weekday names were typed beside the dates rather than
 * derived from them, so they were wrong: 18 August 2026 is a Tuesday and the
 * column said "Mon 18", which put every visit on the board one day away from
 * the day a fitter would read it under. Both come from the same mistake, of
 * treating a calendar as text.
 */
export function Schedule() {
  const [monday, setMonday] = useState(() => startOfWeek())

  const days = useMemo(() => weekDays(monday), [monday])
  const inWeek = useMemo(() => {
    const keys = new Set(days.map((d) => d.date))
    return fittings.filter((f) => keys.has(f.date))
  }, [days])

  const measures = inWeek.filter((f) => f.kind === 'measure').length
  const fits = inWeek.filter((f) => f.kind === 'fitting').length
  const isThisWeek = toDateKey(monday) === toDateKey(startOfWeek())

  return (
    <>
      <PageHeader
        title="Schedule"
        intro={
          inWeek.length === 0
            ? `Nothing booked for ${weekLabel(monday)}.`
            : `${measures} ${measures === 1 ? 'measure' : 'measures'} and ${fits} ${fits === 1 ? 'fitting' : 'fittings'} booked for ${weekLabel(monday)} across two fitters.`
        }
        action={
          <Button size="sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Book a visit
          </Button>
        }
      />

      {/* Week navigation. A diary that cannot be moved off the current week is
          no use to anyone booking a visit for next Tuesday. */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setMonday((m) => addDays(m, -7))}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Previous
        </Button>
        <Button
          size="sm"
          variant={isThisWeek ? 'ghost' : 'outline'}
          disabled={isThisWeek}
          onClick={() => setMonday(startOfWeek())}
        >
          This week
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMonday((m) => addDays(m, 7))}>
          Next
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Button>
        <span className="ml-1 font-ui text-console text-muted-foreground">{weekLabel(monday)}</span>
      </div>

      <div className="mb-5 flex flex-wrap gap-4 text-console">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-brand-50 ring-1 ring-brand-200" />
          Measure visit
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-ok-bg ring-1 ring-ok-line" />
          Fitting
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {days.map((day) => {
          const dayJobs = fittings
            .filter((f) => f.date === day.date)
            .sort((a, b) => a.time.localeCompare(b.time))
          return (
            <Card key={day.date} padded={false} className="flex flex-col">
              <div className="border-b border-line px-4 py-3">
                <p className="font-display text-console-md font-semibold">
                  {day.label}
                  {day.isToday && (
                    <span className="ml-2 rounded-full bg-brand px-2 py-0.5 align-middle font-ui text-console-2xs font-semibold tracking-wide text-white uppercase">
                      Today
                    </span>
                  )}
                </p>
                <p className="text-console-sm text-muted-foreground">
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
                        : 'border-ok-line bg-ok-bg',
                    )}
                  >
                    <p className="text-console-sm font-bold">{f.time}</p>
                    <p className="mt-0.5 text-console leading-snug font-medium">{f.customer}</p>
                    <p className="mt-0.5 text-console-sm text-ink-soft">{f.area}</p>
                    <p className="mt-1.5 text-console-xs text-ink-soft">
                      {f.fitter} · {f.windows} {f.windows === 1 ? 'window' : 'windows'}
                    </p>
                    {f.quoteId && (
                      <Link
                        to={`/admin/quotes/${f.quoteId}`}
                        className="mt-1.5 inline-block text-console-xs font-medium underline"
                      >
                        {f.quoteId}
                      </Link>
                    )}
                  </div>
                ))}

                {dayJobs.length === 0 && (
                  <button className="w-full rounded-xl border border-dashed border-line py-6 text-console-sm text-muted-foreground hover:border-brand hover:text-brand">
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
                  <div className="mb-1 flex justify-between text-console">
                    <span className="font-medium">{fitter}</span>
                    <span className="text-muted-foreground">
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
          <ul className="space-y-2 text-console">
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
                  <span className="text-muted-foreground">
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
