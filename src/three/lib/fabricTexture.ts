import {
  CanvasTexture,
  MirroredRepeatWrapping,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import { patternDefs, patternTile } from '../../lib/swatch'
import type { PatternKind } from '../../data/types'
import { FABRICS } from '../data/fabrics'
import { materialCacheKey, type MaterialSource } from './materialSource'

/**
 * Texture maps for one fabric.
 *
 * `patternDefs()` already emits validated, seamlessly tiling SVG for nine
 * patterns, and already serves both the gallery swatch and the SVG fallback. It
 * becomes the source for the 3D maps too, which is what makes the fallback feel
 * like the same product rather than a downgrade: it is not an approximation of
 * the 3D cloth, it is literally the same cloth definition.
 */
export interface FabricMaps {
  map: Texture
  normalMap: Texture
  roughnessMap: Texture
  /** Only ever set by the textured branch. Voile's transparency is uniform. */
  alphaMap: Texture | null
  dispose: () => void
}

/** 512 is enough for cloth at vignette scale and is a quarter of the memory of 1024. */
const SIZE = 512

/**
 * How hard the Sobel gradient pushes into the normal map.
 *
 * Baked at a fixed strength, with each finish's `normalScale` applied on the
 * material instead. That way changing how pronounced a weave looks costs a
 * uniform update rather than regenerating and re-uploading a texture.
 */
const NORMAL_STRENGTH = 6

/** Half-width of the roughness band around the finish's centre value. */
const ROUGHNESS_SPREAD = 0.22

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function canvasFilled(fill: string) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, SIZE, SIZE)
  return { canvas, ctx }
}

/**
 * Rasterise one pattern into a square image.
 *
 * The SVG is sized so it holds a whole number of tiles edge to edge, then scaled
 * to fill the texture. That is what keeps the result seamless: none of the tile
 * sizes in `patternDefs` (8, 10, 24, 40, 48, 56, 64, 72) divides 512 evenly, so
 * rasterising at 512 user units directly would cut the last tile in half and put
 * a visible seam down every repeat.
 */
function rasterisePattern(kind: PatternKind, colour: string): Promise<HTMLImageElement> {
  const tile = patternTile(kind)
  const reps = tile > 0 ? Math.max(1, Math.round(SIZE / tile)) : 1
  const span = tile > 0 ? reps * tile : SIZE

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${span} ${span}">` +
    `<defs>${patternDefs(kind, colour, 'f')}</defs>` +
    `<rect width="${span}" height="${span}" fill="url(#f)"/>` +
    `</svg>`

  // A blob URL rather than a data URI: the SVG for a 56px embroidery repeat is
  // several hundred bytes before percent-encoding, and blobs skip that entirely.
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`could not rasterise pattern: ${kind}`))
    }
    img.src = url
  })
}

/**
 * Derive the normal and roughness maps from the albedo already on the canvas.
 *
 * A weave that only exists in the colour map reads as printed paper: flat, and
 * completely unresponsive to the key light. The height signal is the albedo's own
 * luminance, which is a reasonable stand-in for a woven surface, where the
 * threads catching light really are the bright pixels.
 */
function deriveMaps(
  albedo: CanvasRenderingContext2D,
  normal: CanvasRenderingContext2D,
  roughness: CanvasRenderingContext2D,
  centre: number,
) {
  const src = albedo.getImageData(0, 0, SIZE, SIZE).data
  const lum = new Float32Array(SIZE * SIZE)
  for (let i = 0; i < lum.length; i += 1) {
    const p = i * 4
    lum[i] = (0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2]) / 255
  }

  const nOut = normal.createImageData(SIZE, SIZE)
  const rOut = roughness.createImageData(SIZE, SIZE)

  // Wrapping the sampler is not a detail: a clamped Sobel leaves a one-pixel
  // ridge around all four edges of the texture, which tiles into a hard grid of
  // lines across the whole curtain.
  const at = (x: number, y: number) => lum[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)]

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const gx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
      const gy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))

      const nx = gx * NORMAL_STRENGTH
      const ny = gy * NORMAL_STRENGTH
      const len = Math.hypot(nx, ny, 1)

      const i = (y * SIZE + x) * 4
      nOut.data[i] = ((nx / len) * 0.5 + 0.5) * 255
      nOut.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      nOut.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5
      nOut.data[i + 3] = 255

      // Inverted luminance into the finish's band: a thread crown catches the
      // light because it sits very slightly smoother than the valley beside it.
      const rough = clamp01(centre + (0.5 - lum[y * SIZE + x]) * ROUGHNESS_SPREAD)
      const grey = rough * 255
      rOut.data[i] = grey
      rOut.data[i + 1] = grey
      rOut.data[i + 2] = grey
      rOut.data[i + 3] = 255
    }
  }

  normal.putImageData(nOut, 0, 0)
  roughness.putImageData(rOut, 0, 0)
}

function configure(textures: Texture[], kind: PatternKind | null, maxAnisotropy: number) {
  for (const t of textures) {
    // RepeatWrapping is what makes `texture.repeat` mean anything at all.
    // Without it the texture clamps at its edge and tiling silently does nothing.
    //
    // `plain` is the exception: it is a corner-to-corner gradient rather than a
    // repeating tile, so repeating it butts light against dark. Mirroring folds
    // it back on itself and the join disappears.
    const wrap = kind === 'plain' ? MirroredRepeatWrapping : RepeatWrapping
    t.wrapS = wrap
    t.wrapT = wrap
    // Keeps the weave sharp at grazing angles, which is every curtain fold and
    // the far end of every bed.
    t.anisotropy = maxAnisotropy
  }
}

function buildProcedural(
  source: Extract<MaterialSource, { kind: 'procedural' }>,
  maxAnisotropy: number,
  onReady?: () => void,
): FabricMaps {
  const finish = FABRICS[source.finishId]

  // Every map starts valid and flat, and the weave is painted in when the
  // rasterise resolves. Rasterising an SVG through an <img> is asynchronous and
  // cannot be made otherwise, and the alternative — suspending — would blank the
  // whole vignette on every colourway click. A frame of flat cloth in the right
  // colour is a far better answer than a frame of nothing.
  const albedo = canvasFilled(source.colour)
  const normal = canvasFilled('#8080ff')
  const roughness = canvasFilled(`rgb(${[finish.roughness * 255, finish.roughness * 255, finish.roughness * 255].join()})`)

  const map = new CanvasTexture(albedo.canvas)
  const normalMap = new CanvasTexture(normal.canvas)
  const roughnessMap = new CanvasTexture(roughness.canvas)

  // sRGB on the albedo only. Normal and roughness are data, not colour, and
  // decoding them through sRGB is the classic bug that leaves fabric washed out
  // and vaguely plastic no matter what the roughness says.
  map.colorSpace = SRGBColorSpace
  normalMap.colorSpace = NoColorSpace
  roughnessMap.colorSpace = NoColorSpace
  configure([map, normalMap, roughnessMap], source.pattern, maxAnisotropy)

  rasterisePattern(source.pattern, source.colour)
    .then((img) => {
      albedo.ctx.drawImage(img, 0, 0, SIZE, SIZE)
      deriveMaps(albedo.ctx, normal.ctx, roughness.ctx, finish.roughness)
      for (const t of [map, normalMap, roughnessMap]) t.needsUpdate = true
      // The canvas is not on screen, so nothing else will ask for the frame that
      // shows the weave.
      onReady?.()
    })
    .catch(() => {
      // The flat fill stays. A pattern that will not rasterise must cost the
      // weave, never the product.
    })

  return {
    map,
    normalMap,
    roughnessMap,
    alphaMap: null,
    dispose: () => {
      for (const t of [map, normalMap, roughnessMap]) t.dispose()
    },
  }
}

function buildTextured(
  source: Extract<MaterialSource, { kind: 'textured' }>,
  maxAnisotropy: number,
  onReady?: () => void,
): FabricMaps {
  const finish = FABRICS[source.finishId]
  const loader = new TextureLoader()
  const loaded: Texture[] = []

  const load = (url: string, colourSpace: typeof SRGBColorSpace | typeof NoColorSpace) => {
    const texture = loader.load(url, () => onReady?.())
    texture.colorSpace = colourSpace
    loaded.push(texture)
    return texture
  }

  // An uploaded material may carry only an albedo. Rather than branching the
  // return shape, the missing maps fall back to the same flat canvases the
  // procedural path starts from, so every consumer sees identical fields whether
  // the fabric was photographed or generated.
  const flat = (fill: string) => {
    const texture = new CanvasTexture(canvasFilled(fill).canvas)
    texture.colorSpace = NoColorSpace
    loaded.push(texture)
    return texture
  }

  const map = load(source.maps.albedo, SRGBColorSpace)
  const normalMap = source.maps.normal ? load(source.maps.normal, NoColorSpace) : flat('#8080ff')
  const roughnessMap = source.maps.roughness
    ? load(source.maps.roughness, NoColorSpace)
    : flat(`rgb(${[finish.roughness * 255, finish.roughness * 255, finish.roughness * 255].join()})`)
  const alphaMap = source.maps.opacity ? load(source.maps.opacity, NoColorSpace) : null

  configure(alphaMap ? [map, normalMap, roughnessMap, alphaMap] : [map, normalMap, roughnessMap], null, maxAnisotropy)

  return {
    map,
    normalMap,
    roughnessMap,
    alphaMap,
    dispose: () => {
      for (const t of loaded) t.dispose()
    },
  }
}

export function buildFabricMaps(
  source: MaterialSource,
  maxAnisotropy: number,
  onReady?: () => void,
): FabricMaps {
  return source.kind === 'procedural'
    ? buildProcedural(source, maxAnisotropy, onReady)
    : buildTextured(source, maxAnisotropy, onReady)
}

/**
 * GPU memory is not garbage collected, and a client will click every colourway
 * on the page. Without a cache each click leaks three 512px textures; without a
 * bound the cache is the leak instead.
 *
 * Insertion-ordered Map as the LRU: a hit is deleted and re-set so it moves to
 * the end, which makes the first key the least recently used one.
 */
const CACHE_LIMIT = 12
const cache = new Map<string, FabricMaps>()

export function getFabricMaps(
  source: MaterialSource,
  maxAnisotropy: number,
  onReady?: () => void,
): FabricMaps {
  const key = materialCacheKey(source)
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }

  const built = buildFabricMaps(source, maxAnisotropy, onReady)
  cache.set(key, built)

  // Anything still on screen was just retrieved, so it sits at the end of the
  // order and cannot be the key evicted here. That only stops holding while more
  // than CACHE_LIMIT fabrics are visible at once, which no surface does — the
  // configurator dresses a handful of slots, not twelve.
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value as string
    cache.get(oldest)?.dispose()
    cache.delete(oldest)
  }

  return built
}

/** Test and teardown hook. Nothing in the app should need to drop the cache. */
export function clearFabricMaps() {
  for (const maps of cache.values()) maps.dispose()
  cache.clear()
}
