import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bySlug } from '../../data/catalogue'
import { MAX_UPLOAD_BYTES } from '../../lib/image'
import { usePhotos } from '../../store/photos'
import { Button, cx } from '../../components/ui'
import { Card, EmptyState, PageHeader } from '../components/AdminUI'

/**
 * Photo management for one product.
 *
 * The product is resolved from the catalogue rather than from the admin's own
 * `stock` array: `StockRow` carries no colourways, and assigning a photo to a
 * colourway is the whole reason a shopper's colour choice can surface the right
 * pictures first.
 *
 * Catalogue photography appears here too, marked and read-only, so staff can
 * see the complete set they are adding to instead of a list that looks empty
 * when the storefront is not.
 */
export function ProductPhotos() {
  const { slug = '' } = useParams()
  const product = bySlug(slug)
  const { ready, uploadsFor, addPhotos, updatePhoto, removePhoto, reorder } = usePhotos()

  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  /** The photo currently being dragged, for reordering. */
  const dragging = useRef<string | null>(null)

  if (!product) {
    return (
      <>
        <PageHeader title="Product not found" />
        <EmptyState title="No such product" body="It may have been renamed or retired." />
      </>
    )
  }

  const uploads = uploadsFor(product.slug)
  const catalogue = product.photos ?? []
  const incomplete = uploads.filter((u) => !u.alt.trim()).length

  const accept = async (files: FileList | File[] | null) => {
    if (!files || busy) return
    setBusy(true)
    setErrors(await addPhotos(product.slug, files))
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const drop = (targetId: string) => {
    const from = dragging.current
    dragging.current = null
    if (!from || from === targetId) return
    const ids = uploads.map((u) => u.id)
    const next = ids.filter((id) => id !== from)
    next.splice(ids.indexOf(targetId), 0, from)
    reorder(product.slug, next)
  }

  return (
    <>
      <PageHeader
        title={`Photos: ${product.name}`}
        intro="Photographs shown on the product page alongside the room view and the fabric swatch. Stored in this browser."
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
          {busy ? 'Processing…' : 'Drop photographs here'}
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

      {catalogue.length > 0 && (
        <Card className="mb-5">
          <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-muted uppercase">
            From the catalogue
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {catalogue.map((p) => (
              <figure key={p.src} className="overflow-hidden rounded-xl border border-line">
                <img src={p.src} alt={p.alt} className="aspect-square w-full object-cover" />
                <figcaption className="px-2 py-1.5 text-[11px] text-muted">
                  Committed to the catalogue
                </figcaption>
              </figure>
            ))}
          </div>
        </Card>
      )}

      {!ready ? (
        <p className="py-12 text-center text-sm text-muted">Loading photos…</p>
      ) : uploads.length === 0 ? (
        <EmptyState
          title="No uploaded photos"
          body="Add photographs above and they appear on the product page immediately, without a rebuild."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploads.map((u) => (
            <Card
              key={u.id}
              className={cx('cursor-move', !u.alt.trim() && 'ring-1 ring-brand-200')}
            >
              <div
                draggable
                onDragStart={() => {
                  dragging.current = u.id
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(u.id)}
              >
                <img
                  src={u.url}
                  alt={u.alt || 'Uploaded photo awaiting a description'}
                  className="mb-3 aspect-4/3 w-full rounded-xl object-cover"
                />
              </div>

              <label className="mb-2 block">
                <span className="mb-1 block text-[12px] font-medium text-ink">
                  Description
                  {!u.alt.trim() && <span className="ml-1 font-normal text-brand">required</span>}
                </span>
                <input
                  value={u.alt}
                  onChange={(e) => updatePhoto(u.id, { alt: e.target.value })}
                  placeholder="Kitenge curtains hung in a living room"
                  className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
                />
              </label>

              <label className="mb-2 block">
                <span className="mb-1 block text-[12px] font-medium text-ink">Caption</span>
                <input
                  value={u.caption ?? ''}
                  onChange={(e) => updatePhoto(u.id, { caption: e.target.value })}
                  placeholder="Optional, shown under the enlarged photo"
                  className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
                />
              </label>

              <label className="mb-3 block">
                <span className="mb-1 block text-[12px] font-medium text-ink">Colourway</span>
                <select
                  value={u.colourId ?? ''}
                  onChange={(e) => updatePhoto(u.id, { colourId: e.target.value || undefined })}
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
                    checked={Boolean(u.wide)}
                    onChange={(e) => updatePhoto(u.id, { wide: e.target.checked })}
                  />
                  Wide cell
                </label>
                <button
                  onClick={() => {
                    if (confirm('Delete this photo? It cannot be recovered.')) removePhoto(u.id)
                  }}
                  className="text-[12px] text-brand hover:underline"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-[12px] text-muted">
        Photos are held in this browser only. Seen on{' '}
        <Link to={`/product/${product.slug}`} className="text-brand hover:underline">
          the product page
        </Link>{' '}
        on this device.
      </p>
    </>
  )
}
