import { useEffect, useMemo, useRef, useState } from 'react'
import { type ProductImage, fullSizeSrc } from '../lib/productImage'
import { Lightbox } from './Lightbox'
import { Photo } from './Photo'
import { cx } from './ui'

/**
 * The gallery behind the Photos tab.
 *
 * It used to be a grid of equal tiles, every photograph the same size as every
 * other. That is a contact sheet rather than a gallery: nothing leads, the
 * detail shot competes with the room shot, and on a phone the hero image of a
 * product arrived three columns wide and forty millimetres tall. A shop page
 * needs one image doing the selling and the rest offering themselves.
 *
 * So: one large frame, and a rail of thumbnails that changes what is in it.
 * The rail runs down the left on a desktop and scrolls horizontally under the
 * frame on a phone, which is the arrangement people already know from every
 * other shop they use.
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
  photos: ProductImage[]
  colourId?: string
  label?: string
}) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const ordered = useMemo(() => {
    if (!colourId) return photos
    const rank = (p: ProductImage) => (p.colourId === colourId ? 0 : p.colourId ? 2 : 1)
    return [...photos].sort((a, b) => rank(a) - rank(b))
  }, [photos, colourId])

  /*
   * Back to the first photograph when the ordering changes under us.
   *
   * Changing colourway re-sorts the rail, so holding position would leave the
   * frame showing whatever happened to land at that index: pick the third
   * photo, change colour, and the frame silently becomes a different product
   * shot without anything appearing to have been clicked.
   */
  useEffect(() => setActive(0), [colourId, photos])

  if (!ordered.length) return null

  const current = ordered[Math.min(active, ordered.length - 1)]

  /** Arrow keys walk the rail, which is what a listbox of images should do. */
  const onRailKey = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (active + delta + ordered.length) % ordered.length
    setActive(next)
    railRef.current?.querySelectorAll<HTMLElement>('[data-thumb]')[next]?.focus()
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[76px_1fr]">
        {/* The rail. Second in the DOM on a desktop only visually: it stays
            first in source order so tabbing reaches the choices before the
            frame they change. */}
        <div
          ref={railRef}
          role="listbox"
          aria-label={label ? `${label}, choose a photograph` : 'Choose a photograph'}
          onKeyDown={onRailKey}
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:max-h-[560px] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:px-0"
        >
          {ordered.map((photo, i) => (
            <button
              key={`${photo.name ?? photo.src}-${i}`}
              data-thumb
              role="option"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              aria-label={photo.alt}
              className={cx(
                'w-[68px] shrink-0 overflow-hidden rounded-lg bg-sand transition-all duration-200 lg:w-full',
                i === active
                  ? 'ring-2 ring-brand ring-offset-2 ring-offset-white'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <Photo
                name={photo.name}
                src={photo.src}
                alt=""
                aspect={1}
                sizes="76px"
                className="w-full"
              />
            </button>
          ))}
        </div>

        {/* The frame. A fixed 4:5 whatever is in it, so selecting a landscape
            room shot after a portrait detail does not resize the page under
            the cursor. */}
        <button
          onClick={() => setOpen(Math.min(active, ordered.length - 1))}
          className="group relative block w-full overflow-hidden rounded-media bg-sand"
          aria-label={`Open ${current.alt} full size`}
        >
          <Photo
            key={current.name ?? current.src}
            name={current.name}
            src={current.src}
            alt={current.alt}
            aspect={4 / 5}
            sizes="(min-width: 1024px) 40vw, 92vw"
            priority
            imgClassName="card-zoom"
            className="w-full"
          />

          <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 font-ui text-[12px] font-medium text-white backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            {Math.min(active, ordered.length - 1) + 1} / {ordered.length}
          </span>
        </button>
      </div>

      {open !== null && (
        <Lightbox
          /* The lightbox wants one URL per image: it is already showing each
             one as large as the screen allows, so there is no slot to pick a
             width for. */
          items={ordered.map((p) => ({
            src: fullSizeSrc(p),
            alt: p.alt,
            caption: p.caption,
            colourId: p.colourId,
            wide: p.wide,
          }))}
          index={open}
          onIndex={(i) => {
            setOpen(i)
            // Keep the frame behind the lightbox in step, so closing it leaves
            // the photograph that was being looked at.
            setActive(i)
          }}
          onClose={() => setOpen(null)}
          label={label}
        />
      )}
    </>
  )
}
