const kes = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

/**
 * Everything is priced in KES for a Kenyan audience, normalised to the "KSh"
 * spelling Kenyan retail actually uses. Intl emits "Ksh" for en-KE and "KES"
 * for other locales.
 *
 * The symbol is matched anywhere rather than anchored to the start of the
 * string. Anchoring looked right for as long as every amount was positive, and
 * quietly failed the first time one was not: Intl renders a negative as
 * "-Ksh 2,880", which put the minus sign where the anchor expected the symbol
 * and left a lowercase "Ksh" on every discount, credit and refund.
 */
export const money = (value: number) => kes.format(value).replace(/(KES|Ksh)\s?/, 'KSh ')

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`

export const leadTime = (days: number) =>
  days === 0 ? 'Ships same day' : days <= 2 ? `Ships in ${plural(days, 'day')}` : `Ready in ${days} days`
