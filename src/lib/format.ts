const kes = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

/**
 * The old site quoted dollars to a Kenyan audience. Everything here is KES,
 * normalised to the "KSh" spelling Kenyan retail actually uses, Intl emits
 * "Ksh" for en-KE and "KES" for other locales.
 */
export const money = (value: number) => kes.format(value).replace(/^(KES|Ksh)\s?/, 'KSh ')

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`

export const leadTime = (days: number) =>
  days === 0 ? 'Ships same day' : days <= 2 ? `Ships in ${plural(days, 'day')}` : `Ready in ${days} days`
