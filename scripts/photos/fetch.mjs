#!/usr/bin/env node
/**
 * Pull the storefront's photography and generate the module that describes it.
 *
 *   npm run photos:fetch          # fetch anything missing
 *   npm run photos:fetch -- --force   # re-fetch everything
 *   npm run photos:fetch -- --only kitenge-blockout-curtains
 *
 * Reads `scripts/photos/manifest.json`, writes:
 *
 *   public/photos/<key>-<width>.<avif|webp|jpg>
 *   public/photos/CREDITS.md          attribution, linked from the footer
 *   src/data/photoSets.ts             generated, imported by components/Photo.tsx
 *
 * No `sharp`, no local image processing. The source CDN is an imgix endpoint,
 * so it crops and re-encodes on request and we store what it returns. That
 * keeps the toolchain to Node alone and means a contributor on Windows does not
 * have to build a native module to get the site's images.
 *
 * `src/data/photoSets.ts` is committed, so the app builds on a clean checkout
 * before anyone runs this. The image files are not committed; this script is
 * how they arrive. See `public/photos/README.md`.
 */

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const OUT = resolve(ROOT, 'public/photos')
const MANIFEST = resolve(HERE, 'manifest.json')

/**
 * The widths every photograph is stored at, and the formats it is stored in.
 *
 * These two lists are the contract with `src/components/Photo.tsx`, which
 * builds its `srcset` from them. They are re-emitted into the generated module
 * rather than duplicated by hand, so changing them here changes both.
 *
 * Three widths, not five: the jump from 480 to 960 to 1600 covers a phone, a
 * two-up tablet grid and a full-bleed desktop panel, and each extra width
 * multiplies the file count by the number of formats.
 */
const WIDTHS = [480, 960, 1600]
const HERO_WIDTHS = [480, 960, 1600, 2400]
const FORMATS = ['avif', 'webp', 'jpg']

/** Aspect ratio per role, as width over height. Cropping is deterministic, which
 *  is what lets the generated module state dimensions without measuring a file. */
const ASPECTS = {
  product: 4 / 5,
  detail: 4 / 5,
  wide: 16 / 10,
  room: 3 / 4,
  category: 1 / 1,
  editorial: 16 / 10,
  hero: 16 / 9,
  og: 16 / 9,
}

/** JPEG and WebP quality. AVIF is given a little less, since it holds up. */
const QUALITY = { avif: 58, webp: 72, jpg: 78 }

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
/** Regenerate the TS module and CREDITS.md from the manifest without downloading
 *  anything. Used when the manifest's metadata changes but its photo ids do not,
 *  and on a machine that cannot reach the CDN. */
const GENERATE_ONLY = args.includes('--generate-only')
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null

const sourceUrl = (entry, width, format) => {
  const height = Math.round(width / (ASPECTS[entry.role] ?? ASPECTS.product))
  if (entry.source !== 'unsplash') {
    throw new Error(`unknown source "${entry.source}" on ${entry.key}`)
  }
  const q = new URLSearchParams({
    fm: format,
    w: String(width),
    h: String(height),
    fit: 'crop',
    crop: entry.crop ?? 'entropy',
    q: String(QUALITY[format]),
    auto: 'compress',
  })
  return `https://images.unsplash.com/${entry.photoId}?${q}`
}

const exists = (path) =>
  stat(path).then(
    (s) => s.size > 0,
    () => false,
  )

async function download(url, dest, attempt = 1) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    // A CDN that cannot produce the format asked for sometimes answers 200 with
    // an error page rather than an error code. Anything under 1 KB is not a
    // photograph.
    if (buf.length < 1024) throw new Error(`suspiciously small (${buf.length} bytes)`)
    await writeFile(dest, buf)
    return buf.length
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 400 * attempt))
      return download(url, dest, attempt + 1)
    }
    throw err
  }
}

/** Run `jobs` with a ceiling on how many are in flight. The CDN throttles a
 *  burst of several hundred requests and starts answering 503. */
async function pool(jobs, limit = 6) {
  const results = []
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const index = cursor++
      results[index] = await jobs[index]().then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error }),
      )
    }
  })
  await Promise.all(workers)
  return results
}

const widthsFor = (entry) => (entry.role === 'hero' || entry.role === 'og' ? HERO_WIDTHS : WIDTHS)

function generateModule(entries) {
  const rows = entries
    .map((e) => {
      const aspect = ASPECTS[e.role] ?? ASPECTS.product
      return `  '${e.key}': {
    key: '${e.key}',
    role: '${e.role}',
    slug: ${e.slug ? `'${e.slug}'` : 'null'},
    aspect: ${aspect.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')},
    widths: [${widthsFor(e).join(', ')}],
    alt: ${JSON.stringify(e.alt)},
    tint: '${e.tint}',
    credit: ${JSON.stringify(e.credit)},
    creditUrl: 'https://unsplash.com/@${e.creditUser}',
  },`
    })
    .join('\n')

  return `/*
 * GENERATED by \`npm run photos:fetch\`. Do not edit by hand.
 *
 * Source of truth is \`scripts/photos/manifest.json\`. This module is committed
 * so the app type-checks and builds on a clean checkout, before anyone has
 * downloaded an image.
 */

export const PHOTO_WIDTHS = [${WIDTHS.join(', ')}] as const
export const PHOTO_FORMATS = [${FORMATS.map((f) => `'${f}'`).join(', ')}] as const

export type PhotoRole = 'product' | 'detail' | 'wide' | 'room' | 'editorial' | 'hero' | 'og'

export interface PhotoSet {
  key: string
  role: PhotoRole
  /** The catalogue product this belongs to, or null for a page image. */
  slug: string | null
  /** Width over height. The crop is fixed per role, so this never lies. */
  aspect: number
  widths: number[]
  alt: string
  /** Shown until the image decodes, so a slow connection sees the product. */
  tint: string
  credit: string
  creditUrl: string
}

export const photoSets: Record<string, PhotoSet> = {
${rows}
}

/** Every key, for the admin photo screen and the sitemap. */
export const photoKeys = Object.keys(photoSets)

/**
 * Product slug to its photographs, in manifest order.
 *
 * Built here rather than by prefix-matching keys at the call site, because a
 * slug that is a prefix of another slug would quietly steal its photography.
 */
export const photoSetsBySlug: Record<string, PhotoSet[]> = photoKeys.reduce<
  Record<string, PhotoSet[]>
>((acc, key) => {
  const set = photoSets[key]
  if (!set.slug) return acc
  ;(acc[set.slug] ??= []).push(set)
  return acc
}, {})
`
}

function generateCredits(entries) {
  const lines = entries
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(
      (e) =>
        `| \`${e.key}\` | [${e.credit}](https://unsplash.com/@${e.creditUser}) | [Unsplash](https://unsplash.com/photos/${e.photoId.replace(/^photo-/, '')}) |`,
    )
    .join('\n')

  return `# Photography credits

Every photograph on this site is used under the [Unsplash
Licence](https://unsplash.com/license), which permits commercial use without
attribution. We credit anyway, because the people who took these made the site
possible and it costs us a page.

These are placeholders for the client's own shoot. See \`README.md\` in this
folder for how to swap them.

| File | Photographer | Source |
| --- | --- | --- |
${lines}

Generated by \`npm run photos:fetch\`. Do not edit by hand.
`
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
  const all = manifest.photos
  const entries = ONLY ? all.filter((e) => e.key.startsWith(ONLY) || e.slug === ONLY) : all

  if (!entries.length) {
    console.error(ONLY ? `No manifest entries match "${ONLY}".` : 'Manifest is empty.')
    process.exit(1)
  }

  await mkdir(OUT, { recursive: true })

  if (GENERATE_ONLY) {
    await writeFile(resolve(ROOT, 'src/data/photoSets.ts'), generateModule(all))
    await writeFile(resolve(OUT, 'CREDITS.md'), generateCredits(all))
    console.log(
      `Regenerated src/data/photoSets.ts and public/photos/CREDITS.md from ${all.length} manifest entries. No files downloaded.`,
    )
    return
  }

  const jobs = []
  for (const entry of entries) {
    for (const width of widthsFor(entry)) {
      for (const format of FORMATS) {
        const dest = resolve(OUT, `${entry.key}-${width}.${format}`)
        jobs.push(async () => {
          if (!FORCE && (await exists(dest))) return { skipped: true }
          const bytes = await download(sourceUrl(entry, width, format), dest)
          return { bytes, file: `${entry.key}-${width}.${format}` }
        })
      }
    }
  }

  console.log(`Fetching ${jobs.length} files for ${entries.length} photographs...`)
  const results = await pool(jobs)

  const failed = results.filter((r) => !r.ok)
  const skipped = results.filter((r) => r.ok && r.value.skipped).length
  const written = results.filter((r) => r.ok && !r.value.skipped)
  const bytes = written.reduce((sum, r) => sum + r.value.bytes, 0)

  // The generated module always describes the whole manifest, never the subset
  // `--only` fetched, or a later partial run would delete entries from it.
  await writeFile(resolve(ROOT, 'src/data/photoSets.ts'), generateModule(all))
  await writeFile(resolve(OUT, 'CREDITS.md'), generateCredits(all))

  console.log(
    `Wrote ${written.length} files (${(bytes / 1024 / 1024).toFixed(1)} MB), skipped ${skipped} already present.`,
  )
  console.log('Regenerated src/data/photoSets.ts and public/photos/CREDITS.md')

  if (failed.length) {
    console.error(`\n${failed.length} files failed:`)
    for (const f of failed.slice(0, 10)) console.error(`  ${f.error.message}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
