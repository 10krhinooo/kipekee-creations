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

/**
 * Where the backend is.
 *
 * Empty in development, so every path stays relative and goes through the Vite
 * proxy in `vite.config.ts`, which is why there is no CORS configuration on
 * that side. In a real deployment the two are on different hosts, so this is
 * set to the backend's origin at build time and the backend allows it back.
 */
const BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

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

async function toResult<T>(fetchIt: () => Promise<Response>): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetchIt()
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

function request<T>(method: Method, path: string, body?: unknown): Promise<ApiResult<T>> {
  return toResult<T>(() => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (authToken) headers.Authorization = `Bearer ${authToken}`
    return fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  })
}

/**
 * A single file, as `multipart/form-data`.
 *
 * No `Content-Type` header here on purpose: the browser sets it, boundary
 * included, only when it builds the body itself from a `FormData`. Setting it
 * by hand is how a multipart request ends up without a boundary and the
 * backend cannot parse it.
 */
function upload<T>(path: string, field: string, file: Blob, filename: string): Promise<ApiResult<T>> {
  return toResult<T>(() => {
    const headers: Record<string, string> = {}
    if (authToken) headers.Authorization = `Bearer ${authToken}`
    const form = new FormData()
    form.append(field, file, filename)
    return fetch(BASE + path, { method: 'POST', headers, body: form })
  })
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload,
}

/** Kept as a named export because the storefront forms read better with it. */
export const post = api.post

/**
 * A `src` the backend handed back, resolved against wherever the backend is.
 *
 * Every other path in this app is relative and goes through the dev proxy or
 * a same-origin deploy, but `/api/media/...` is served by the backend
 * specifically, so it needs the same origin prefix a fetch does. A bare
 * `/api/media/...` in an `<img>` would resolve against the frontend's own
 * origin instead and 404 wherever the two are on different hosts.
 */
export const mediaUrl = (src: string) => (src.startsWith('/api/') ? BASE + src : src)

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
