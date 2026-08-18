/**
 * Browser-side image intake.
 *
 * Every uploaded file goes through `decodeAndResize` before it is stored. That
 * is not only a size optimisation: drawing a decoded image to a canvas and
 * re-encoding it drops the EXIF block, which is where phone cameras put GPS
 * coordinates. Staff photographing fabric in the workshop should not be
 * publishing the workshop's location with it.
 *
 * Kept as its own module rather than living inside the photo store because the
 * material capture pipeline needs the identical decode, resize and re-encode
 * step, and two copies of it would drift.
 */

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/** 12 MB, checked before decode so a hostile file cannot allocate first. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

export type RejectReason = 'type' | 'size' | 'decode'

export const rejectionOf = (file: File): RejectReason | null => {
  if (!ACCEPTED.includes(file.type)) return 'type'
  if (file.size > MAX_UPLOAD_BYTES) return 'size'
  return null
}

export const rejectionMessage = (reason: RejectReason, name: string) => {
  switch (reason) {
    case 'type':
      return `${name} is not a JPEG, PNG or WebP.`
    case 'size':
      return `${name} is larger than 12 MB. Export it smaller and try again.`
    case 'decode':
      return `${name} could not be read. It may be corrupt.`
  }
}

const decode = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    img.src = url
  })

/**
 * Decode, cap the longest edge, re-encode as JPEG.
 *
 * @param maxEdge longest edge in pixels. 2048 is enough for a full-bleed
 *   lightbox on a retina laptop and roughly a tenth the bytes of a raw phone
 *   photo, which matters because these are held in IndexedDB rather than on a
 *   CDN.
 */
export async function decodeAndResize(file: File, maxEdge = 2048): Promise<Blob> {
  const img = await decode(file)
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('decode failed')
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82),
  )
  if (!blob) throw new Error('decode failed')
  return blob
}

/** Landscape shots earn a wide cell in the gallery grid. */
export const isWide = (width: number, height: number) => width / height > 1.25

export async function measure(blob: Blob): Promise<{ width: number; height: number }> {
  const file = new File([blob], 'measure', { type: blob.type })
  try {
    const img = await decode(file)
    return { width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return { width: 0, height: 0 }
  }
}
