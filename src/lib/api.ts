/**
 * The one way this app talks to the backend.
 *
 * Every caller is a form somebody is waiting on, so this never throws: it
 * resolves to a discriminated result and leaves the page to decide what to say.
 * A form that explodes on a dropped connection loses whatever the visitor
 * typed, which on the quote screen is a set of measurements they took off a
 * window with a tape measure.
 */

import { handleMock, mockEnabled } from './mockApi'

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

  // While the backend is not deployed, a stand-in answers in the same shape.
  // Everything below this point is unchanged either way, so switching it off
  // with VITE_MOCK_API=false puts the app straight back on the wire.
  if (mockEnabled) {
    const mock = await handleMock(method, path, body, authToken)
    return interpret<T>(mock.status, mock.body)
  }

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
  return interpret<T>(res.status, text ? safeParse(text) : undefined)
}

/**
 * Turns a status and a parsed body into a result, for the wire and the
 * stand-in alike, so the two cannot drift apart in how they report a failure.
 */
function interpret<T>(status: number, parsedBody: unknown): ApiResult<T> {
  if (status >= 200 && status < 300) {
    // 200, 201, 202 and 204 are all success here and only some have a body.
    return { ok: true, data: parsedBody as T }
  }

  const parsed = parsedBody as ErrorBody | undefined

  // The backend's own messages - rate limits, "last admin", "email already
  // used" - are written for a person to read, so they are passed through rather
  // than replaced with something generic.
  if (parsed?.message) return { ok: false, message: parsed.message, status }

  const violation = parsed?.violations?.find((v) => v.message)
  if (violation?.message) {
    return { ok: false, message: `Check the form: ${violation.message}.`, status }
  }

  return { ok: false, message: GENERIC, status }
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
