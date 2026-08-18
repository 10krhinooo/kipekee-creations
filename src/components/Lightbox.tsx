import { useCallback, useEffect, useRef } from 'react'
import type { ProductPhoto } from '../data/types'
import { cx } from './ui'

/**
 * Full-screen image viewer.
 *
 * z-50 is not cosmetic. The shared WebGL canvas is fixed at z-20, the WhatsApp
 * button at z-30 and the header at z-40, so anything lower than 50 is painted
 * over by the 3D canvas on exactly those products that have a 3D scene, which
 * presents as an image that vanishes on some products and not others.
 *
 * Generic over `ProductPhoto` so the fabric swatches use it too.
 */
export function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  label = 'Photo viewer',
}: {
  items: ProductPhoto[]
  index: number
  onIndex: (next: number) => void
  onClose: () => void
  label?: string
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  /** Whatever had focus when this opened, so Escape can hand it back. */
  const restoreRef = useRef<Element | null>(null)
  const dragStart = useRef<number | null>(null)

  const step = useCallback(
    (by: number) => {
      if (items.length < 2) return
      onIndex((index + by + items.length) % items.length)
    },
    [index, items.length, onIndex],
  )

  useEffect(() => {
    restoreRef.current = document.activeElement
    closeRef.current?.focus()

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      const restore = restoreRef.current
      if (restore instanceof HTMLElement) restore.focus()
    }
  }, [onClose, step])

  const photo = items[index]
  if (!photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm"
      // Pointer rather than touch events, so a trackpad swipe and a thumb both
      // work through the same handler.
      onPointerDown={(e) => {
        dragStart.current = e.clientX
      }}
      onPointerUp={(e) => {
        const from = dragStart.current
        dragStart.current = null
        if (from === null) return
        const dx = e.clientX - from
        if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1)
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <span className="text-[13px] tabular-nums opacity-80">
          {index + 1} / {items.length}
        </span>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 transition-colors hover:bg-white/15"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* The scrim closes, the image does not. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={onClose}>
        <img
          src={photo.src}
          alt={photo.alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain px-4 pb-4 select-none"
          draggable={false}
        />

        {items.length > 1 && (
          <>
            <Arrow side="left" onClick={() => step(-1)} />
            <Arrow side="right" onClick={() => step(1)} />
          </>
        )}
      </div>

      {photo.caption && (
        <p className="px-6 pb-5 text-center text-[13px] text-white/75">{photo.caption}</p>
      )}
    </div>
  )
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cx(
        'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/12 p-3 text-white transition-colors hover:bg-white/25',
        side === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={side === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  )
}
