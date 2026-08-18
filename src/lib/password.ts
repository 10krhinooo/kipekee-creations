/**
 * How strong a password looks, for the meter on the register screen.
 *
 * Deliberately about *shape* rather than a score out of a hundred. The useful
 * signal for somebody choosing a password is "this is short" or "this is one
 * dictionary word", and length dominates both. A checklist of character classes
 * would rate `P@ss1234` well, which is exactly backwards.
 */

export const MIN_PASSWORD_LENGTH = 10

export type Strength = {
  /** 0 unusable, 1 weak, 2 fair, 3 strong. */
  score: 0 | 1 | 2 | 3
  label: string
  /** The single most useful thing to do next, or null when it is fine. */
  hint: string | null
}

/** Sequences and repeats people reach for, which add length but no difficulty. */
const OBVIOUS = /^(.)\1+$|^(012|123|234|345|456|567|678|789|890|abc|qwe|asd|password|kipekee)/i

export function strengthOf(password: string): Strength {
  const value = password ?? ''

  if (value.length === 0) {
    return { score: 0, label: '', hint: null }
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return {
      score: 0,
      label: 'Too short',
      hint: `${MIN_PASSWORD_LENGTH - value.length} more character${
        MIN_PASSWORD_LENGTH - value.length === 1 ? '' : 's'
      } to go`,
    }
  }
  if (OBVIOUS.test(value)) {
    return { score: 1, label: 'Too easy to guess', hint: 'Avoid runs of letters or numbers' }
  }

  const variety =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/[0-9]/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value))

  // Length carries most of the weight, because it genuinely does. A long
  // lowercase phrase beats a short password with one of everything in it.
  if (value.length >= 16 || (value.length >= 12 && variety >= 3)) {
    return { score: 3, label: 'Strong', hint: null }
  }
  if (value.length >= 12 || variety >= 3) {
    return { score: 2, label: 'Fair', hint: 'A few more characters would make it strong' }
  }
  return { score: 1, label: 'Weak', hint: 'Try a longer phrase rather than a single word' }
}
