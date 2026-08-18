/**
 * The storefront's one way of talking to the backend.
 *
 * Every caller is a form somebody is waiting on, so this never throws: it
 * resolves to a discriminated result and leaves the page to decide what to say.
 * A form that explodes on a dropped connection loses whatever the visitor
 * typed, which on the quote screen is a set of measurements they took off a
 * window with a tape measure.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string }

/** What Hibernate Validator returns on a 400, so a field error can be surfaced. */
interface ViolationBody {
  violations?: { field?: string; message?: string }[]
  message?: string
}

const GENERIC = 'Something went wrong at our end. Try again, or message us on WhatsApp.'

export async function post<T = unknown>(path: string, body: unknown): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return {
      ok: false,
      message: 'Could not reach us. Check your connection, or send it on WhatsApp instead.',
    }
  }

  if (res.ok) {
    // 202 and 204 are both success here and only one of them has a body.
    const text = await res.text()
    return { ok: true, data: (text ? safeParse(text) : undefined) as T }
  }

  // The rate limiter's message is written for a customer to read, so it is
  // passed through rather than replaced with a generic failure.
  const parsed = safeParse(await res.text().catch(() => '')) as ViolationBody | undefined
  if (res.status === 429 && parsed?.message) return { ok: false, message: parsed.message }
  if (parsed?.message) return { ok: false, message: parsed.message }

  const violation = parsed?.violations?.find((v) => v.message)
  if (violation?.message) {
    return { ok: false, message: `Check the form: ${violation.message}.` }
  }

  return { ok: false, message: GENERIC }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
