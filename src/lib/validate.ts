/**
 * Every placeholder in the app already shows the shape a Kenyan number takes:
 * `07XX XXX XXX` / `01XX XXX XXX` on Safaricom/Airtel-era prefixes, or the
 * same number in `+254` form. Accept both, with or without spaces.
 */
const KENYAN_PHONE = /^(?:\+254|0)(7\d{8}|1\d{8})$/

export const isValidKenyanPhone = (value: string): boolean =>
  KENYAN_PHONE.test(value.replace(/[\s-]/g, ''))

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (value: string): boolean => EMAIL.test(value.trim())
