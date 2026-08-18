# Product photography

Files here are referenced by the `photos` field on a product in
`src/data/catalogue.ts` and shown behind the **Photos** tab on the product page.

Everything currently in this folder is a **placeholder**, deliberately labelled
"PHOTOGRAPH PENDING" so nobody mistakes it for the client's work. Replace each
one with a real photograph of the same name and nothing else needs to change.

Conventions:

- Portrait shots roughly 4:5 or square, landscape roughly 16:10 with `wide: true`
  on the catalogue entry so the grid gives it a two-column cell.
- Longest edge 2048px, JPEG. That is the same ceiling the admin uploader
  enforces, so committed and uploaded photography look alike.
- `alt` on the catalogue entry is required. It is what a screen reader and a
  failed image load both fall back to.
- `colourId` ties a photo to a colourway, which sorts it to the front when a
  shopper selects that colour.

Staff can also add photos without a deploy at `/admin/products/:slug/photos`.
Those live in the browser's IndexedDB and are merged on top of this list.
