import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Product, ProductPhoto } from '../data/types'
import { PHOTO_STORE, idbAll, idbPut, idbRemove } from '../lib/idb'
import { decodeAndResize, isWide, measure, rejectionOf, rejectionMessage } from '../lib/image'

/*
 * Staff-uploaded product photography.
 *
 * Two sources feed one gallery: photos committed to the catalogue under
 * `public/photos/`, and photos staff upload here. `photosFor()` merges them so
 * no consumer ever branches on where an image came from.
 *
 * IndexedDB rather than localStorage, because a single 2048px JPEG is larger
 * than the whole ~5 MB localStorage quota. The trade is that reads are async,
 * so this provider mirrors the basket's `ready` flag: nothing writes until the
 * initial load has settled, and a browser that refuses IndexedDB outright
 * simply reports no uploads instead of failing.
 */

export interface PhotoRecord {
  id: string
  productSlug: string
  /** The resized JPEG. Object URLs are minted once, in this provider. */
  blob: Blob
  alt: string
  colourId?: string
  caption?: string
  wide?: boolean
  order: number
  createdAt: string
}

/** A record plus the object URL this provider owns for it. */
interface Resolved extends PhotoRecord {
  url: string
}

interface PhotoApi {
  ready: boolean
  /** Catalogue photos first, then uploads in `order`. */
  photosFor: (product: Product | undefined) => ProductPhoto[]
  /** Uploads only, for the admin screen, which must be able to edit them. */
  uploadsFor: (slug: string) => Resolved[]
  addPhotos: (slug: string, files: FileList | File[]) => Promise<string[]>
  updatePhoto: (id: string, patch: Partial<Omit<PhotoRecord, 'id' | 'blob'>>) => void
  removePhoto: (id: string) => void
  reorder: (slug: string, ids: string[]) => void
}

const PhotoContext = createContext<PhotoApi | null>(null)

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `p${Date.now()}${Math.random().toString(16).slice(2)}`

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<Resolved[]>([])
  const [ready, setReady] = useState(false)

  /*
   * Every object URL this provider has minted, so unmount can release them.
   * Held in a ref rather than derived from `records` because a URL revoked on
   * the strength of a stale render would blank an image that is still on
   * screen.
   */
  const urls = useRef(new Map<string, string>())

  const resolve = useCallback((record: PhotoRecord): Resolved => {
    let url = urls.current.get(record.id)
    if (!url) {
      url = URL.createObjectURL(record.blob)
      urls.current.set(record.id, url)
    }
    return { ...record, url }
  }, [])

  const release = useCallback((id: string) => {
    const url = urls.current.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      urls.current.delete(id)
    }
  }, [])

  useEffect(() => {
    let live = true
    idbAll<PhotoRecord>(PHOTO_STORE)
      .then((stored) => {
        if (!live) return
        setRecords(stored.map(resolve))
      })
      .catch(() => {
        // A blocked or corrupt store must not stop the shop loading. The
        // gallery falls back to catalogue photography.
      })
      .finally(() => {
        if (live) setReady(true)
      })
    return () => {
      live = false
    }
  }, [resolve])

  // Release every URL on teardown. Without this, an admin session that uploads
  // and navigates repeatedly holds every blob it has ever shown.
  const urlsRef = urls
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      urlsRef.current.clear()
    },
    [urlsRef],
  )

  const addPhotos = useCallback(
    async (slug: string, files: FileList | File[]) => {
      const errors: string[] = []
      const list = Array.from(files)
      const created: Resolved[] = []

      // Ordering continues from whatever this product already has, so a second
      // upload appends rather than interleaving.
      let next = Date.now()

      for (const file of list) {
        const rejection = rejectionOf(file)
        if (rejection) {
          errors.push(rejectionMessage(rejection, file.name))
          continue
        }
        try {
          const blob = await decodeAndResize(file)
          const { width, height } = await measure(blob)
          const record: PhotoRecord = {
            id: newId(),
            productSlug: slug,
            blob,
            // Left blank on purpose. The admin screen flags a photo without alt
            // text as incomplete, because every generated image in this app has
            // a real alt and an upload should not be the one that does not.
            alt: '',
            wide: width > 0 && isWide(width, height),
            order: next++,
            createdAt: new Date().toISOString(),
          }
          // TODO: `/admin` has no authentication. This write must be
          // permission-gated before production rather than fronted by a login
          // that implies protection it does not provide.
          await idbPut(PHOTO_STORE, record)
          created.push(resolve(record))
        } catch {
          errors.push(rejectionMessage('decode', file.name))
        }
      }

      if (created.length) setRecords((prev) => [...prev, ...created])
      return errors
    },
    [resolve],
  )

  const updatePhoto = useCallback(
    (id: string, patch: Partial<Omit<PhotoRecord, 'id' | 'blob'>>) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const next = { ...r, ...patch }
          const { url: _url, ...record } = next
          void _url
          void idbPut(PHOTO_STORE, record)
          return next
        }),
      )
    },
    [],
  )

  const removePhoto = useCallback(
    (id: string) => {
      // TODO: permission-gate before production, as above.
      void idbRemove(PHOTO_STORE, id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      release(id)
    },
    [release],
  )

  const reorder = useCallback((slug: string, ids: string[]) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.productSlug !== slug) return r
        const at = ids.indexOf(r.id)
        if (at === -1 || at === r.order) return r
        const next = { ...r, order: at }
        const { url: _url, ...record } = next
        void _url
        void idbPut(PHOTO_STORE, record)
        return next
      }),
    )
  }, [])

  const uploadsFor = useCallback(
    (slug: string) =>
      records.filter((r) => r.productSlug === slug).sort((a, b) => a.order - b.order),
    [records],
  )

  const photosFor = useCallback(
    (product: Product | undefined): ProductPhoto[] => {
      if (!product) return []
      const uploaded = uploadsFor(product.slug).map<ProductPhoto>((r) => ({
        src: r.url,
        // Fall back to something honest rather than shipping an empty alt.
        alt: r.alt || `${product.name} photograph`,
        colourId: r.colourId,
        caption: r.caption,
        wide: r.wide,
      }))
      return [...(product.photos ?? []), ...uploaded]
    },
    [uploadsFor],
  )

  const value = useMemo<PhotoApi>(
    () => ({ ready, photosFor, uploadsFor, addPhotos, updatePhoto, removePhoto, reorder }),
    [ready, photosFor, uploadsFor, addPhotos, updatePhoto, removePhoto, reorder],
  )

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePhotos() {
  const ctx = useContext(PhotoContext)
  if (!ctx) throw new Error('usePhotos must be used inside a PhotoProvider')
  return ctx
}
