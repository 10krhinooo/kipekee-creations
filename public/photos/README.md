# Product photography

Every photograph on the storefront is described by
[`scripts/photos/manifest.json`](../../scripts/photos/manifest.json) and fetched
by `npm run photos:fetch`. The image files **are committed**, so a clone has the
whole storefront and a deploy has no external dependency at build time. The
fetch script is what puts them here and what you re-run when the manifest
changes; it skips anything already present, so running it is cheap.

```bash
npm run photos:fetch                        # fetch anything missing
npm run photos:fetch -- --force             # re-fetch everything
npm run photos:fetch -- --only kitenge-blockout-curtains
npm run photos:fetch -- --generate-only     # rebuild the TS module, download nothing
```

## What the script produces

```
public/photos/<key>-<width>.<avif|webp|jpg>   the images
public/photos/CREDITS.md                      attribution, linked from the footer
src/data/photoSets.ts                         generated, imported by components/Photo.tsx
```

Three widths (480, 960, 1600; heroes also get 2400) in three formats. The
browser picks one from the `srcset` that `src/components/Photo.tsx` builds, so a
phone on a Safaricom connection downloads a 480px AVIF where a desktop
downloads a 1600px one.

`src/data/photoSets.ts` is generated too. Do not edit it by hand; edit the
manifest and re-run with `--generate-only`.

`prebuild` runs the fetch before every build. With the images committed that is
a no-op that costs a second and regenerates the module, which is exactly what
you want: a build can never ship a `photoSets.ts` that has drifted from the
manifest, and a missing file repairs itself rather than deploying as a gap.

## These are placeholders

Everything in the manifest today is stock photography under the [Unsplash
Licence](https://unsplash.com/license), standing in for the client's own shoot.
It is deliberately good stock, sized and self-hosted, rather than a hotlinked
image reused across four unrelated products — but it is still not the client's
work, and the site should not imply that it is.

## Swapping in the real shoot

Per product, when the photographs arrive:

1. Name the files `<key>-<width>.jpg` using the keys already in the manifest
   (`kitenge-blockout-curtains-1`, `-2`, `-3`) and drop them in this folder.
   Only the JPEGs are required; the AVIF and WebP variants are an optimisation,
   and `Photo` falls back to the JPEG when they are absent.
2. Delete that product's entries from `scripts/photos/manifest.json`.
3. Run `npm run photos:fetch -- --generate-only` so `photoSets.ts` and
   `CREDITS.md` stop claiming a photographer who did not take them.

No component changes. Nothing else in the app knows where an image came from.

## Conventions

- `role` decides the crop: `product` and `detail` are 4:5, `wide` and
  `editorial` are 16:10, `room` is 3:4, `hero` and `og` are 16:9.
- `alt` is required and is written to stand on its own. It is what a screen
  reader announces and what a failed load leaves behind, so "Deep red blockout
  curtain cloth, the weave catching side light" rather than "curtains".
- `tint` is the colour shown while the file downloads. Use the product's accent
  from `src/data/catalogue.ts` so the placeholder reads as the product.
- `colourId` ties a photograph to a colourway, which sorts it to the front when
  a shopper selects that colour.

## Staff uploads

Staff can add photography without a deploy at `/admin/products/:slug/photos`.
Those live in the browser's IndexedDB, are resized and EXIF-stripped by
`src/lib/image.ts`, and are merged on top of this list by `galleryFor()` in
`src/lib/productImage.ts`. They are per-browser, so they are a way to try a shot
before committing it, not a substitute for the manifest.
