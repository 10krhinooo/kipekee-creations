import { useMemo, useState } from 'react'
import type { ProductPhoto } from '../data/types'
import { Lightbox } from './Lightbox'
import { cx } from './ui'

/**
 * The gallery behind the Photos tab.
 *
 * Photos tagged with the selected colourway sort to the front rather than
 * filtering the rest out. Filtering makes changing colour look like it deleted
 * pictures, and a shopper comparing two colourways wants both sets reachable.
 */
export function PhotoGrid({
  photos,
  colourId,
  label,
}: {
  photos: ProductPhoto[]
  colourId?: string
  label?: string
}) {
  const [open, setOpen] = useState<number | null>(null)

  const ordered = useMemo(() => {
    if (!colourId) return photos
    const rank = (p: ProductPhoto) => (p.colourId === colourId ? 0 : p.colourId ? 2 : 1)
    return [...photos].sort((a, b) => rank(a) - rank(b))
  }, [photos, colourId])

  if (!ordered.length) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ordered.map((photo, i) => (
          <button
            key={`${photo.src}-${i}`}
            onClick={() => setOpen(i)}
            className={cx(
              'group relative overflow-hidden rounded-xl bg-sand',
              photo.wide ? 'col-span-2 aspect-16/10' : 'aspect-square',
            )}
            aria-label={`Open ${photo.alt}`}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading={i < 4 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <Lightbox
          items={ordered}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          label={label}
        />
      )}
    </>
  )
}
