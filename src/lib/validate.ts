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

/**
 * An M-Pesa transaction code, as it appears in the confirmation SMS.
 *
 * Ten characters, letters and digits, always sent uppercase. Normalising
 * rather than rejecting on case or a stray space, because the customer is
 * copying it off another screen and the shape is what matters. Deliberately
 * not checking any deeper: the code means nothing until somebody matches it
 * against the statement, and a stricter pattern would only reject real codes
 * when Safaricom changes the prefix.
 */
const MPESA_CODE = /^[A-Z0-9]{10}$/

export const normaliseMpesaCode = (value: string): string =>
  value.replace(/[\s-]/g, '').toUpperCase()

export const isValidMpesaCode = (value: string): boolean =>
  MPESA_CODE.test(normaliseMpesaCode(value))
