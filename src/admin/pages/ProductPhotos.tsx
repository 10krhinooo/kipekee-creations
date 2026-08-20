import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCatalogue } from '../../store/catalogue'
import { mediaUrl } from '../../lib/api'
import { MAX_UPLOAD_BYTES, decodeAndResize, isWide, measure, rejectionMessage, rejectionOf } from '../../lib/image'
import { Button, cx } from '../../components/ui'
import { Card, EmptyState, PageHeader } from '../components/AdminUI'
import {
  deletePhoto,
  updatePhotoDetails,
  uploadPhoto,
  useAdminPhotos,
  type AdminPhoto,
} from '../data/api'

/**
 * Photo management for one product, backed by the admin's upload endpoint.
 *
 * Each file is still resized and re-encoded in the browser first, for the
 * same reason it always was: it strips the location data phone cameras embed
 * and cuts the upload to a tenth of the size. The backend re-checks the type
 * and the size on arrival regardless, since a limit enforced only in this
 * page is a limit anybody can skip by not using the page.
 */
export function ProductPhotos() {
  const { bySlug } = useCatalogue()
  const { slug = '' } = useParams()
  const product = bySlug(slug)
  const { data, loading, reload } = useAdminPhotos(slug)
  const photos = data ?? []

  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef<number | null>(null)
  /**
   * Edits applied on screen immediately; `reload()` after each save replaces
   * this with what the server actually stored, so a rejected change does not
   * silently stay on screen.
   */
  const [pending, setPending] = useState<Record<number, Partial<AdminPhoto>>>({})

  useEffect(() => setPending({}), [data])

  const view = photos.map((p) => ({ ...p, ...pending[p.id] }))

  const accept = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || !slug || busy) return
      setBusy(true)
      const errs: string[] = []

      for (const file of Array.from(files)) {
        const rejection = rejectionOf(file)
        if (rejection) {
          errs.push(rejectionMessage(rejection, file.name))
          continue
        }
        try {
          const blob = await decodeAndResize(file)
          const result = await uploadPhoto(slug, blob, file.name.replace(/\.[^.]+$/, '') + '.jpg')
          if (!result.ok) {
            errs.push(result.message)
            continue
          }
          const { width, height } = await measure(blob)
          if (width > 0 && isWide(width, height)) {
            await updatePhotoDetails(slug, result.data.id, { wide: true })
          }
        } catch {
          errs.push(rejectionMessage('decode', file.name))
        }
      }

      setErrors(errs)
      setBusy(false)
      reload()
      if (inputRef.current) inputRef.current.value = ''
    },
    [slug, busy, reload],
  )

  const patch = (id: number, details: Partial<Pick<AdminPhoto, 'alt' | 'colourId' | 'caption' | 'wide'>>) => {
    setPending((prev) => ({ ...prev, [id]: { ...prev[id], ...details } }))
    void updatePhotoDetails(slug, id, details)
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this photo? It cannot be recovered.')) return
    const result = await deletePhoto(slug, id)
    if (result.ok) reload()
  }

  const drop = (targetId: number) => {
    const from = dragging.current
    dragging.current = null
    if (from === null || from === targetId) return
    const ids = view.map((p) => p.id)
    const next = ids.filter((id) => id !== from)
    next.splice(ids.indexOf(targetId), 0, from)
    next.forEach((id, sortOrder) => void updatePhotoDetails(slug, id, { sortOrder }))
    reload()
  }

  if (!product) {
    return (
      <>
        <PageHeader title="Product not found" />
        <EmptyState title="No such product" body="It may have been renamed or retired." />
      </>
    )
  }

  const incomplete = view.filter((p) => !p.alt.trim()).length

  return (
    <>
      <PageHeader
        title={`Photos: ${product.name}`}
        intro="Photographs shown on the product page alongside the room view and the fabric swatch."
        action={
          <Button size="sm" variant="outline" to="/admin/products">
            Back to products
          </Button>
        }
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void accept(e.dataTransfer.files)
        }}
        className={cx(
          'mb-5 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-brand bg-brand-50' : 'border-line bg-white',
        )}
      >
        <p className="font-display text-[15px] font-semibold text-ink">
          {busy ? 'Uploading…' : 'Drop photographs here'}
        </p>
        <p className="mx-auto mt-1.5 mb-4 max-w-md text-[13px] text-muted">
          JPEG, PNG or WebP, up to {Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB each. Each one is
          resized to 2048px and re-encoded, which also strips the location data phone cameras embed.
        </p>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void accept(e.target.files)}
        />
      </div>

      {errors.length > 0 && (
        <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          {errors.map((e) => (
            <p key={e} className="text-[13px] text-brand">
              {e}
            </p>
          ))}
        </div>
      )}

      {incomplete > 0 && (
        <p className="mb-4 text-[13px] text-muted">
          {incomplete} photo{incomplete > 1 ? 's' : ''} still need description text. Every generated
          image on this site has one, so an upload without it is the only image a screen reader
          cannot describe.
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-muted">Loading photos…</p>
      ) : view.length === 0 ? (
        <EmptyState
          title="No photos yet"
          body="Add photographs above and they appear on the product page as soon as the upload finishes."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {view.map((p) => (
            <Card
              key={p.id}
              className={cx('cursor-move', !p.alt.trim() && 'ring-1 ring-brand-200')}
            >
              <div
                draggable
                onDragStart={() => {
                  dragging.current = p.id
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(p.id)}
              >
                <img
                  src={mediaUrl(p.src)}
                  alt={p.alt || 'Uploaded photo awaiting a description'}
                  className="mb-3 aspect-4/3 w-full rounded-xl object-cover"
                />
              </div>

              <label className="mb-2 block">
                <span className="mb-1 block text-[12px] font-medium text-ink">
                  Description
                  {!p.alt.trim() && <span className="ml-1 font-normal text-brand">required</span>}
                </span>
                <input
                  value={p.alt}
                  onChange={(e) => patch(p.id, { alt: e.target.value })}
                  placeholder="Kitenge curtains hung in a living room"
                  className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
                />
              </label>

              <label className="mb-2 block">
                <span className="mb-1 block text-[12px] font-medium text-ink">Caption</span>
                <input
                  value={p.caption ?? ''}
                  onChange={(e) => patch(p.id, { caption: e.target.value })}
                  placeholder="Optional, shown under the enlarged photo"
                  className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
                />
              </label>

              <label className="mb-3 block">
                <span className="mb-1 block text-[12px] font-medium text-ink">Colourway</span>
                <select
                  value={p.colourId ?? ''}
                  onChange={(e) => patch(p.id, { colourId: e.target.value || null })}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand"
                >
                  <option value="">Any colour</option>
                  {product.colours.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[12px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={Boolean(p.wide)}
                    onChange={(e) => patch(p.id, { wide: e.target.checked })}
                  />
                  Wide cell
                </label>
                <button onClick={() => remove(p.id)} className="text-[12px] text-brand hover:underline">
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-[12px] text-muted">
        Seen immediately on{' '}
        <Link to={`/product/${product.slug}`} className="text-brand hover:underline">
          the product page
        </Link>
        , for every visitor.
      </p>
    </>
  )
}
