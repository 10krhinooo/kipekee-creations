/**
 * The one way this app talks to the backend.
 *
 * Every caller is a form somebody is waiting on, so this never throws: it
 * resolves to a discriminated result and leaves the page to decide what to say.
 * A form that explodes on a dropped connection loses whatever the visitor
 * typed, which on the quote screen is a set of measurements they took off a
 * window with a tape measure.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; status?: number }

/** What Hibernate Validator returns on a 400, so a field error can be surfaced. */
interface ErrorBody {
  violations?: { field?: string; message?: string }[]
  message?: string
}

const GENERIC = 'Something went wrong at our end. Try again, or message us on WhatsApp.'

/**
 * The bearer token, held here rather than passed through every call site.
 *
 * `AuthProvider` is the only thing that writes it, on sign-in, sign-out and
 * hydration. Threading it through each caller instead would mean every new
 * request is one forgotten argument away from being silently unauthenticated.
 */
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    return {
      ok: false,
      message: 'Could not reach us. Check your connection, or send it on WhatsApp instead.',
    }
  }

  const text = await res.text().catch(() => '')

  if (res.ok) {
    // 200, 201, 202 and 204 are all success here and only some have a body.
    return { ok: true, data: (text ? safeParse(text) : undefined) as T }
  }

  const parsed = safeParse(text) as ErrorBody | undefined

  // The backend's own messages - rate limits, "last admin", "email already
  // used" - are written for a person to read, so they are passed through rather
  // than replaced with something generic.
  if (parsed?.message) return { ok: false, message: parsed.message, status: res.status }

  const violation = parsed?.violations?.find((v) => v.message)
  if (violation?.message) {
    return { ok: false, message: `Check the form: ${violation.message}.`, status: res.status }
  }

  return { ok: false, message: GENERIC, status: res.status }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
}

/** Kept as a named export because the storefront forms read better with it. */
export const post = api.post

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
