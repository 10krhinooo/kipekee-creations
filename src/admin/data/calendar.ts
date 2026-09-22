/**
 * Dates for the fitters' schedule.
 *
 * Small and deliberate, because the screen it feeds got both of the obvious
 * things wrong: the week was a hardcoded range in the past, and the weekday
 * labels were off by one against the dates beside them, so a fitter reading
 * Monday was looking at Tuesday's visits.
 */

/** Monday through Saturday. The workshop does not book Sundays. */
export const WORKING_DAYS = 6

/**
 * A `YYYY-MM-DD` key in the *local* calendar.
 *
 * Not `toISOString().slice(0, 10)`, which is the usual way to write this and
 * is wrong everywhere east of Greenwich. Kenya is UTC+3, so any time before
 * 03:00 local converts to the previous day in UTC, and a visit booked at
 * 09:00 on the 22nd would file itself under the 21st for anyone loading the
 * page early enough.
 */
export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * The Monday of the week containing `from`.
 *
 * `getDay()` is 0 for Sunday, so Sunday has to walk back six days rather than
 * forward one: a Sunday belongs to the week that has just ended, not the one
 * about to start.
 */
export function startOfWeek(from: Date = new Date()): Date {
  const day = from.getDay()
  const backToMonday = day === 0 ? 6 : day - 1
  const monday = addDays(from, -backToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export interface WeekDay {
  date: string
  /** "Mon 22", derived from the date rather than typed beside it. */
  label: string
  isToday: boolean
}

/** The six working days of the week starting at `monday`. */
export function weekDays(monday: Date): WeekDay[] {
  const today = toDateKey(new Date())
  return Array.from({ length: WORKING_DAYS }, (_, i) => {
    const d = addDays(monday, i)
    const key = toDateKey(d)
    return {
      date: key,
      label: `${d.toLocaleDateString('en-KE', { weekday: 'short' })} ${d.getDate()}`,
      isToday: key === today,
    }
  })
}

/** "22 - 27 September" or "29 September - 4 October" across a month boundary. */
export function weekLabel(monday: Date): string {
  const end = addDays(monday, WORKING_DAYS - 1)
  const sameMonth = monday.getMonth() === end.getMonth()
  const month = (d: Date) => d.toLocaleDateString('en-KE', { month: 'long' })
  return sameMonth
    ? `${monday.getDate()} - ${end.getDate()} ${month(end)}`
    : `${monday.getDate()} ${month(monday)} - ${end.getDate()} ${month(end)}`
}
