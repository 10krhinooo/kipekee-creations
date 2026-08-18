/**
 * A very small promise wrapper over one IndexedDB database.
 *
 * Deliberately generic rather than photo-specific. Product photos are the first
 * tenant, but the material capture work needs the same database, and two
 * modules each calling `indexedDB.open('kipekee', n)` with different version
 * numbers deadlock each other on a `versionchange` that nobody handles. One
 * opener, one version, every store declared in `upgrade()` below.
 *
 * Nothing here throws to its caller. IndexedDB is refused outright in a private
 * Firefox window and can fail mid-session when a user clears site data, and
 * neither is a reason for the shop to stop rendering. Callers get an empty
 * result and carry on; the same reasoning as the try/catch either side of the
 * basket's localStorage access.
 */

const DB_NAME = 'kipekee'
const DB_VERSION = 1

/** Uploaded product photography. `materials` joins it here later. */
export const PHOTO_STORE = 'photos'

let dbPromise: Promise<IDBDatabase | null> | null = null

const upgrade = (db: IDBDatabase) => {
  if (!db.objectStoreNames.contains(PHOTO_STORE)) {
    const store = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' })
    store.createIndex('productSlug', 'productSlug', { unique: false })
  }
}

export function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      return resolve(null)
    }
    request.onupgradeneeded = () => upgrade(request.result)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    // Firefox in private mode resolves neither, so do not hang the caller.
    request.onblocked = () => resolve(null)
  })

  return dbPromise
}

const run = <T,>(
  store: string,
  mode: IDBTransactionMode,
  work: (s: IDBObjectStore) => IDBRequest<T>,
  fallback: T,
): Promise<T> =>
  openDb().then(
    (db) =>
      new Promise<T>((resolve) => {
        if (!db) return resolve(fallback)
        try {
          const tx = db.transaction(store, mode)
          const request = work(tx.objectStore(store))
          request.onsuccess = () => resolve(request.result ?? fallback)
          request.onerror = () => resolve(fallback)
          tx.onabort = () => resolve(fallback)
        } catch {
          resolve(fallback)
        }
      }),
  )

export const idbPut = <T,>(store: string, value: T): Promise<void> =>
  run(store, 'readwrite', (s) => s.put(value) as IDBRequest<unknown>, undefined).then(() => undefined)

export const idbRemove = (store: string, key: IDBValidKey): Promise<void> =>
  run(store, 'readwrite', (s) => s.delete(key) as IDBRequest<unknown>, undefined).then(() => undefined)

export const idbAll = <T,>(store: string): Promise<T[]> =>
  run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>, [])

export const idbAllByIndex = <T,>(store: string, index: string, key: IDBValidKey): Promise<T[]> =>
  run<T[]>(store, 'readonly', (s) => s.index(index).getAll(key) as IDBRequest<T[]>, [])
