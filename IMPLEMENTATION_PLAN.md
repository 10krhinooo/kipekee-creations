# Implementation Plan: Visualiser + Material Capture

> **Untracked on purpose.** This is a working document and is not committed. Do not `git add` it.
>
> It is now the **only** plan document. `VISUALISER_PLAN.md` and `MATERIAL_CAPTURE_PLAN.md` have been
> deleted and everything of theirs that is still ahead of the code lives in Appendix A and Appendix B
> at the end of this file. Where they disagreed with reality, reality is recorded here instead.

## Context

Two pieces of work, sequenced into one build:

- **The visualiser** — move the room preview to WebGL (React Three Fiber), keeping the existing SVG
  `RoomPreview` as a fallback tier. Entirely client-side.
- **Material capture** — an admin workflow where staff photograph a fabric, get suggested
  colour/pattern/finish, review it, and publish it to products. Roughly half of it is backend, and
  none of that half is being built yet.

They are not independent. Material capture has to connect uploaded texture maps to the 3D renderer,
and its material selector must survive into the quote basket the visualiser also modifies. Built
naively, the second rewrites the first's material layer and bumps the same localStorage key twice.

## Decisions taken

1. **Materials ship client-only first.** No server, no object storage, no vision API. Analysis is
   deterministic browser canvas work with the AI call stubbed behind the plan's own `VisionProvider`
   interface. Proves the admin UX and the visualiser seam with zero infrastructure; the adapter means
   a real backend drops in later without touching UI.
2. **Milestone 1 is 3D on product pages** (visualiser phases 1–6). The configurator is deferred.
3. **The `MaterialSource` union is designed up front**, in Milestone 1.4, not retrofitted.
4. **3D is the default and the visitor chooses the tier.** No capability scoring, no automatic
   demotion on frame timing. See 1.4b.
5. **Plan documents are not committed.** Neither are `CLAUDE.md` or the `.gitignore` edit.

## Corrections to the original design documents

Found by reading the code and by building it. The appendices are corrected where these apply:

| Plan says | Reality |
|---|---|
| "calls the existing `addQuote()`" | The API is `addToQuote()` / `addToCart()` (`basket.tsx:162,168`) |
| `BasketLine` | No such type. The payable line is `CartLine` (`data/types.ts:90`) |
| `RoomPreviewProps` moves to `preview/types.ts` | It was **not exported** (`RoomPreview.tsx:57`). Now `PreviewProps` |
| `swatch()` serves the 2D fallback for uploaded materials | `swatch(kind, accent, seed)` has **no image path**. Must be built |

One hazard neither plan mentions: `sameCartLine` (`basket.tsx:38`) dedupes on slug+colour+size. Add a
material without widening that identity and two different materials silently merge into one cart line.

## Ground truth about the repo

- **No backend of any kind.** Zero `fetch(`, no `api/` directory, no env vars. `vercel.json` is a
  static SPA rewrite plus a branch guard. The only persistence is one localStorage key in `basket.tsx:86`.
- **`RoomPreview` had exactly one call site**, `ProductPage.tsx:219`. "3D everywhere" is one
  conversion, not thirty.
- **No image handling exists.** No `<input type="file">`, no `FileReader`, no `<canvas>`, no `<img>`
  outside `swatch()` data URIs. Material capture introduces the repo's first binary-data path.
- **`admin/data/operations.ts` is static module data** — frozen arrays, no mutation, no persistence.
  Every admin edit today lives in component `useState` and evaporates on navigation. A materials
  feature cannot extend it; it needs its own store.

---

## Milestone 1 — 3D on product pages

### 1.1 Extraction — DONE (PR #4)

- `src/components/preview/types.ts` — `SceneKind`, `SceneVariant`, `Heading`, `Finial`, `PreviewProps`.
- `src/lib/motion.ts` — `CURTAIN_MS`, `LIGHT_MS`, `CURTAIN_EASE`, `LIGHT_EASE`, `GATHERED`,
  `reducedMotion()`.
- `RoomPreview.tsx` imports both. Its behaviour is untouched, including the four `useEffect`
  dependency arrays that must not be "fixed".

### 1.2 Tiering and fallback — DONE (PR #4)

- `src/lib/capability.ts` — `probeTier()`, cached in a module singleton, releases its probe context.
- `src/components/preview/TierProvider.tsx` — `{ tier, setTier, demote }`, mounted in `App.tsx` above
  both shells.
- `src/components/preview/RoomView.tsx` — the switcher. Every tier resolves to `RoomPreview` today.
- `ProductPage.tsx` renders `RoomView`. Its derivation logic at `:95-158` is untouched.

**Deviation from the plan:** `TierToggle` was *not* built. With no 3D behind it, a control offering
"3D view" that hands back 2D lies to the user. It lands in 1.3 when it can tell the truth.

**Baseline to protect:** entry chunk 476.53 kB raw / **140.70 kB gzip** on `main`, 477.87 / 141.22
after tiering. three.js must never enter this chunk.

### 1.3 Shared Canvas and lighting — DONE (PR #5, stacked on #4)

Installed `three@0.185`, `@react-three/fiber@9`, `@react-three/drei@10`, `maath@0.10`. Clean install,
no peer warnings. **Not** `zustand` or `@react-three/postprocessing` — configurator-only, Milestone 3.

Note fiber v9 pins `react: >=19 <19.3` and the repo is on 19.2.8. That is a tight upper bound: a
React 19.3 bump breaks the peer, and `package.json` carries `^19.2.8`, so a fresh install once 19.3
ships will resolve to something fiber v9 refuses.

Built:
- `preview/SharedCanvas.tsx` — `React.lazy`, mounted in `StorefrontLayout` **outside** the
  `key={slug}` subtree. `<View.Port />`, `PerformanceMonitor`, `AdaptiveDpr`, context-lost listener.
- `preview/Preview3DBoundary.tsx` — error boundary that demotes.
- `preview/TierToggle.tsx` — honest now that 3D exists, so it ships.
- `preview/RoomScene3D.tsx` — inline `<View>` plus a **placeholder** vignette (cloth panel, rod,
  floor, wall). Real parts land in 1.5.
- `three/Stage.tsx` — custom lighting, **not** drei's `<Stage>`, which auto-fits and would re-frame
  the room every time anything is added. ACES tone mapping, `ContactShadows`.
- `three/lib/invalidate.ts` — `useInvalidateOnViewport()`, passive scroll/resize listeners.

**Why one persistent Canvas:** `ProductPage` renders `<ProductDetail key={slug}>` so navigating
between products remounts. A `<Canvas>` inside that keyed subtree would create and destroy a WebGL
context per navigation; browsers cap live contexts near 16 then force-lose the oldest. Verified: the
context count stays at **1** across four product navigations.

---

## Findings from building 1.3

These cost real time and are in neither plan document. Read before touching the 3D layer.

### r3f and drei behaviour

**`<View track={ref}>` is deprecated.** drei wants inline views now, so there is no wrapper div and no
ref plumbing. `RoomScene3D` renders `<View className>` directly.

**A `<View>` only connects to `<View.Port />` if the Port already exists when the view mounts.** Both
arrive on lazy chunks, so the order was a race and the preview was blank roughly half the time — with
a correctly sized div, a live canvas, and **nothing in the console**. Fixed with `canvasReady` on
`TierProvider`, gating the view.

**Set `canvasReady` from inside the canvas tree, not from `onCreated`.** `onCreated` does not fire
again when the Canvas remounts after a visitor toggles Flat back to 3D, which left views permanently
gated off. It is set from a component rendered inside `<Canvas>`, where mounting proves the root
exists.

**Passing `eventSource` as a `RefObject` stops r3f initialising entirely.** The canvas stays at its
default 300x150, *no* children mount, and nothing is logged. It presents identically to a dozen other
bugs. Currently omitted; when drag-to-orbit needs it in 1.5, pass a resolved element, never a ref that
is still null at mount.

**A `className` cannot position the Canvas.** r3f writes an inline `position: relative` on its
container, and an inline style beats a Tailwind class, so `fixed` is silently dropped. Use the `style`
prop, which r3f spreads last.

**Canvas z-index is 20.** Above the page background so a preview paints over its sand placeholder,
below the FAB (z-30), header (z-40) and drawer (z-50) so 3D can never cover the chrome.

### three 0.185 incompatibilities

**drei's `<SoftShadows>` is broken.** It injects a PCSS shader calling `unpackRGBAToDepth`, which
three removed by 0.185. The fragment shader fails to compile and takes **every**
`MeshStandardMaterial` down with it, so the entire scene renders as nothing. Using VSM instead
(`shadows={{ type: VSMShadowMap }}` plus `shadow-radius` / `shadow-blurSamples`), which still widens
the penumbra with distance. `PCFSoftShadowMap` is deprecated here too, so `shadows="soft"` is also out.

**No HDRI presets.** drei's own docs call them prototyping-only because they are fetched from a CDN at
runtime. A multi-megabyte HDRI would undo the entire point of the render tier. The environment is
built from `<Lightformer>`s instead — and it must exist at all, because with lights but no
image-based lighting a metal has nothing to reflect and renders black.

**Light placement matters more than intensity here.** The first attempt put the key light "outside the
window" per the plan, at z=-5 — behind the vignette's solid back wall, so it lit nothing the camera
could see. That framing only works once a real window aperture exists for the curtain to occlude,
which arrives in 1.5. Until then the key is front-and-high, camera side.

### Known gap: frameloop

`frameloop` is `always`, not the `demand` the plan specifies. Hand-invalidating around the view mount
race produced a preview that rendered only *intermittently*, which is far worse than one that costs
frames. The fix belongs to the perf pass: pause the loop when no view is on screen, rather than
hand-invalidating each view. "Idle equals zero frames" is already that phase's exit criterion.
Flagged in a comment at the `frameloop` prop.

### Testing note

Calling `canvas.getContext('webgl2', { preserveDrawingBuffer: true })` on the live canvas to sample
pixels **causes a real context loss** — requesting a context with different attributes kills the
existing one. It fired the demote path and looked like a product bug for several minutes. It did
incidentally prove the context-lost fallback works. Do not probe the live canvas this way;
`readPixels` is useless without `preserveDrawingBuffer` regardless, since the buffer is cleared after
compositing.

---

## Milestone 1, remaining phases

### 1.4 The material layer — DONE (branch `feat/fabric-materials`, stacked on #5)

Built as designed below, plus two things the design did not anticipate. Files:
`three/lib/materialSource.ts`, `three/data/fabrics.ts`, `three/lib/fabricTexture.ts`,
`three/materials/useFabricMaterial.ts`, and `patternTile()` exported from `lib/swatch.ts`.
`RoomScene3D`'s placeholder cloth now takes a real fabric material, so the layer is exercised rather
than merely compiled.

**Correction to `VISUALISER_PLAN.md`.** It claims "every patternDefs tile size (8/24/40/48/56/64/72px)
divides 512 evenly, so the draw is seamless". **None of them do except 8 and 64**, and the list omits
`sheer` at 10px. Rasterising at 512 user units cuts the last tile in half and puts a hard seam down
every repeat. `fabricTexture.ts` instead rasterises `round(512 / tile)` whole tiles and scales that to
fill the texture, which is seamless for every pattern and stays at roughly 1:1 with the swatch.

**Correction to the finish registry's `tile` values.** The plan's numbers (`linen [3,4]`,
`velvet [2,3]`, `voile [4,6]`) assume a texture holding exactly one motif. Ours holds ~8, because
rasterising one 8px weave tile across 512 texels would put three enormous checks on a curtain. So
`repeat` multiplies an already-tiled texture, and the plan's values over-tiled the cloth into noise —
visible immediately on damask. Recalibrated around **1 = exactly the gallery swatch**, which is also
the number that makes the two tiers agree about what the fabric looks like.

**`plain` is a gradient, not a pattern**, so it cannot tile at all. Those maps wrap
`MirroredRepeatWrapping`, which folds the gradient back on itself instead of butting light against
dark.

**The Sobel sampler wraps.** A clamped one leaves a one-pixel ridge on all four edges, which tiles
into a grid of hard lines across the whole panel.

Deliberate deviations:
- **Maps are shared across consumers of the same fabric**, so `texture.repeat` is shared too. Correct
  while tile density is a property of the finish; the configurator's per-slot repeat slider will need
  texture clones. Flagged in the hook rather than left to be discovered in Milestone 3.
- **`useFabricMaterial` requires a referentially stable `source`.** It is the memo key. `ClothPanel`
  memoises it.
- **Roughness is baked into the map and `material.roughness` stays at 1.** three multiplies the two,
  so carrying the finish value in both places applies it twice and smooths cloth back to plastic.
- **The async rasterise never suspends.** Every map starts as a flat fill in the right colour and the
  weave is painted in when the SVG decodes, so a colourway click never blanks the vignette.

### 1.4a Framing and camera controls — DONE (same branch)

Not planned for this phase, but the vignette was unusable without it: the product rendered as a band
across the top third of the preview box, skewed.

**Cause.** The camera lived on the shared Canvas, which is the full viewport, so it carried the
*window's* wide aspect ratio. Scissoring that to a 4:5 portrait box crops rather than reframes. Fixed
by declaring `<PerspectiveCamera makeDefault>` **inside** the `<View>`, which takes its aspect from
the view's own rectangle. This reverses 1.3's note that `makeDefault` made the first paint
intermittent: the real cause was the view-before-Port race, and `canvasReady` already closed it.

**Drag to look around** (`three/lib/orbit.ts` + `CameraRig`), pulling 1.5's "gentle drag-to-orbit,
clamped" forward because a fixed camera on a placeholder box reads as a broken image:
- Pointer input comes from a **transparent overlay div**, not from r3f's event system. The canvas is
  `pointer-events-none` by design, and pointing `eventSource` at the shell is the change documented
  above as stopping r3f initialising entirely. The overlay sidesteps it and gives each preview its own
  drag while sharing one canvas.
- Yaw clamped to ±0.52 rad, pitch to ±0.2. Past roughly 30 degrees the camera clears the edge of the
  one-wall vignette and the illusion is over.
- Drag state is a ref written by the handler and read in `useFrame`. No `setState`, so a drag costs
  zero React renders. Damping is framerate-independent and **snaps when settled**, so it stops asking
  for frames instead of chasing a target forever.
- `touch-action: pan-y`, so a vertical swipe still scrolls the page on a phone.
- A "Drag to look around" pill, at `z-[21]`: above the fixed canvas (20), below the FAB (30). An
  unlayered label hides behind the render it describes.

### 1.4 design (as approved)

Build against a union from the start rather than the plan's static finish registry:

```ts
// src/three/lib/materialSource.ts
export type FinishId = 'linen' | 'velvet' | 'percale' | 'voile' | 'kitenge'

export type MaterialSource =
  | { kind: 'procedural'; pattern: PatternKind; colour: string; finishId: FinishId }
  | { kind: 'textured'; materialId: string; assetVersion: number; finishId: FinishId
      maps: { albedo: string; normal?: string; roughness?: string; opacity?: string } }

// assetVersion in the key is what stops a re-cropped material reusing stale GPU textures.
export const materialCacheKey = (s: MaterialSource) =>
  s.kind === 'procedural'
    ? `p|${s.pattern}|${s.colour}|${s.finishId}`
    : `t|${s.materialId}|${s.assetVersion}`
```

- `three/data/fabrics.ts` — finish registry (roughness / normalScale / sheen / tile).
- `three/lib/fabricTexture.ts` — `buildFabricMaps(source, maxAniso)`. Procedural branch:
  `patternDefs()` → Blob URL → 512×512 canvas → Sobel normal → roughness. Textured branch loads URLs.
  **Identical return shape.** sRGB on albedo only; `NoColorSpace` on normal and roughness;
  `RepeatWrapping` and max anisotropy on all three.
- LRU cache keyed on `materialCacheKey`, ~12 entries, `.dispose()` on eviction.
- `three/materials/useFabricMaterial.ts` — `MeshPhysicalMaterial` for velvet (sheen only exists
  there), `Standard` otherwise. Tiling **mutates** `texture.repeat` in an effect and calls
  `invalidate()`; it never rebuilds the material.

Only the procedural branch is exercised today. The textured branch compiles and is typechecked, so
Milestone 2 supplies data rather than code.

### 1.5 Parts, snapping, motion

`three/parts/` (`CurtainPanel`, `BedProduct`, `CushionProduct`, `TableProduct`, `RodProduct`,
`WindowFrame`), `three/lib/snapping.ts`, `three/lib/invalidate.ts` with `useInvalidateWhile(active)`.

Curtain open/close is a morph target driven by anime.js on a plain object with
`onUpdate: () => invalidate()` — zero React commits for the whole 900 ms. Reuse `GATHERED = 0.36` as
the gathered morph's compression so both tiers open to the same silhouette.

### 1.6 Demotion and heroes

Three triggers: `webglcontextlost`, drei `<PerformanceMonitor>` after `AdaptiveDpr` has bottomed out,
and the error boundary. Demotion is sticky for the session but **not persisted**; an explicit user
choice **is**. Then the Home and CustomCurtains hero showpieces.

---

## Milestone 2 — Material capture, client-only

### 2.1 Model and store
- `src/data/material.ts` — the `Material` interface. URL fields become IndexedDB blob keys resolved to
  object URLs at read time. Keep `status`, `analysisStatus`, `analysisConfidence`, `assetVersion`.
- `src/store/materials.tsx` — new provider. **IndexedDB, not localStorage**: one 2048px JPEG exceeds
  the ~5 MB quota alone. Mirror `basket.tsx`'s `ready` flag gating the write effect, and its
  try/catch on both sides, because private browsing must not stop the admin loading.

### 2.2 Analysis pipeline
- `src/lib/materials/analyze.ts` — decode → canvas re-encode (drops EXIF) → resize to ≤2048px →
  thumbnail + square crop → dominant/secondary colours → luminance, contrast, gloss, tile suitability
  → heuristic normal and roughness maps. The Sobel generator is **the same function** as
  `three/lib/fabricTexture.ts`, not a copy.
- `src/lib/materials/vision.ts` — the plan's `VisionProvider` interface verbatim, plus a
  `stubProvider` deriving guesses from the deterministic metrics with honest low confidence. Fills
  every field a real provider would, so the review UI is fully exercised.
- `src/lib/materials/normalize.ts` — runs on the stub's output **exactly as on a real provider's**:
  colours to `#rrggbb`, confidence and visual properties to `0..1`, tile to `0.25..8`, enums clamped,
  invalid output failing safe. This is the security boundary and must not be skipped because today's
  source happens to be local.

### 2.3 Admin surface
- `admin/pages/Materials.tsx` (draft / published / archived) and `MaterialEditor.tsx` (original, crop,
  palette, suggestions, confidence badges, every field editable, "estimated" labelling, manual-entry
  fallback, product assignment, save draft / publish / archive).
- Routes into the existing nested block in `App.tsx`. Reuse `AdminUI.tsx` primitives.
- The editor embeds `<RoomView>` with a `kind: 'textured'` source. This is where 1.4 pays off: what
  staff approve is rendered by the same component customers see.

### 2.4 The 2D image path
`swatch()` cannot show an uploaded material. Add an image-source variant, and teach `RoomPreview`'s
`Fabric` layer to fill from either `patternDefs()` markup or an `<image>`-backed `<pattern>`. Keep the
hex and id guards (`swatch.ts:39-40`) and add a URL guard (`blob:`, `data:`, `https:` only) — the
output is still injected with `dangerouslySetInnerHTML`. Without this the fallback tier lies about
uploaded materials, defeating the point of having it.

### 2.5 Basket and quote — one key bump, not two
Add `materialId?` to `CartLine` and `QuoteLine`, **and** `configs?: SavedConfig[]` to `State` for
Milestone 3, then bump `kipekee.basket.v1` → `v2` **once**. Widen `sameCartLine` to include
`materialId`. Quote lines snapshot material name, id, image and visual settings so an archived
material still renders in an old quote. Surface in `admin/pages/Quotes.tsx` and `QuoteBuilder.tsx`.
Storefront: material selector beside the colour selector, published and assigned only.

### 2.6 Not built
Object storage, database, managed vision provider, admin auth, job polling, rate limiting,
image-hash caching, retention cleanup — the whole "Image-analysis service design" section. `/admin`
stays unauthenticated per `CLAUDE.md`. Mark the publish call site with a comment that it must be
permission-gated before production, rather than shipping fake auth that implies protection it does
not provide.

---

## Milestone 3 — Configurator

Visualiser phases 7–10: `/configurator` with its own dedicated Canvas, both landscapes with the live
cross-fade, `CameraRig`, `Hotspots`, guided steps, snapshot, `spec.ts` → quote basket, perf pass.
Adds `zustand` (bounded to `src/configurator/store.ts`, the documented exception to `CLAUDE.md`'s
no-state-library rule, because `useFrame` must read values without subscribing) and
`@react-three/postprocessing` behind the presentation-quality toggle.

---

## Git workflow

Conventional Commits, matching existing history. Commit messages and PR bodies carry **no em dashes,
no trailers, no test-plan section**. `vercel.json`'s `ignoreCommand` skips builds on every ref except
`main`, so no branch produces a preview deployment; browser verification is local.

| Branch | Scope | State |
|---|---|---|
| `feat/render-tier-fallback` | Milestone 1.1–1.2 | PR #4 open, targets `main` |
| `feat/webgl-room-preview` | Milestone 1.3 | PR #5 open, **stacked on #4** |
| next branch | Milestone 1.4–1.6 | stack on #5, or rebase once #4 and #5 land |
| `feat/material-capture` | Milestone 2 | |
| `feat/room-configurator` | Milestone 3 | |

PRs #4 and #5 are stacked: #5 targets `feat/render-tier-fallback`, not `main`. Merge #4 first, and
#5's base retargets to `main` automatically.

Never commit: `IMPLEMENTATION_PLAN.md`, `VISUALISER_PLAN.md`, `MATERIAL_CAPTURE_PLAN.md`, `CLAUDE.md`,
or the `.gitignore` edit. Note that the uncommitted `.gitignore` adds `claude.md` lowercase, which
does not match `CLAUDE.md` on a case-sensitive filesystem, so that rule currently does nothing.

## Verification

No test framework exists, and `CLAUDE.md` is explicit that a passing build does not verify
behavioural work. Start the dev server via the `kipekee` entry in `.claude/launch.json`.

```bash
npm run build   # tsc -b then vite build, the only automated check
npm run lint    # oxlint
```

Then confirm three / r3f / drei sit in **separate lazy chunks** and the entry chunk has not grown.
This is what protects every 2D-tier visitor on metered data; treat a regression as blocking.

Measured, gzipped:

| Ref | Entry | Lazy 3D chunks |
|---|---|---|
| `main` before any work | 140.70 kB | — |
| after 1.1–1.2 (PR #4) | 141.22 kB | — |
| after 1.3 (PR #5) | **138.07 kB** | `View`/three/drei 234.99, `RoomScene3D` 20.03, `SharedCanvas` 3.09 |

The entry chunk *fell* at 1.3 only because Vite split `jsx-runtime` (4.61 kB gzip) out of it; the real
initial payload is flat. The check that matters is not the number but the grep: `THREE`,
`WebGLRenderer` and `BufferGeometry` must return **zero** hits across the entry and jsx-runtime
chunks. They do.

**Milestone 1** — verify the fallback first, it is the new risk surface.

Verified in the browser at 1.4:
- Damask/velvet renders with the weave in relief, lit rather than printed, and the motif at swatch
  scale after the tile recalibration
- Changing colourway repaints the 3D cloth (warm sand, terracotta, deep olive all correct)
- The whole product is in frame after the camera fix, rod included
- Drag swings the camera to a three-quarter view and settles, clamped, with the panel's side edge and
  the rod's perspective both reading correctly
- No console errors or shader warnings
- Entry chunk 138.16 kB gzip, unchanged from 1.3's 138.07 within noise; zero three.js symbols in the
  entry and jsx-runtime chunks

- Voile is genuinely translucent, with the wall reading through the panel
- Percale renders, and confirms `plain` has almost nothing to show: it is a gradient, not a motif, so
  the cloth carries only the mirrored gradient and a faint join where the mirror turns. Acceptable for
  a plain fabric and worth revisiting only if it still reads flat once the panel has folds

### 1.4b Legibility and the tier policy — DONE (same branch)

Two findings from the user looking at it, both worth recording because the first one is a trap.

**"The 3D view has no texture" was not a loading bug.** The maps were arriving correctly on every cold
load. The cloth was a flat box, evenly lit, and cloth is only legible because light rakes across a
fold: a plane with a perfect weave map on it reads as printed card. It was worst on the pale
colourways, because `patternDefs` derives its light and dark from `shade(base, ±26)`, and ±26 on a
cream base is a very small delta that a bright key light then washes out entirely.

So the diagnosis to remember: **if 3D fabric looks untextured, check the geometry before the
texture.** The fix was a placeholder `foldedPanel()` — a cosine displacement across the width with
`computeVertexNormals()` after it, amplitude easing in from the heading so it does not read as
corrugated metal. `NORMAL_STRENGTH` also went 2.4 to 6 and `ROUGHNESS_SPREAD` 0.12 to 0.22. The panel
now reads unmistakably as folded cloth carrying a damask.

`computeVertexNormals()` is the part that is easy to miss: displacing vertices alone leaves every
normal still pointing forward, so the folds exist geometrically and are invisible to the lighting.

**The tier no longer guesses. 3D is the default and the visitor chooses.** Removed from `probeTier()`:
`saveData`, `effectiveType`, `prefers-reduced-data`, `hardwareConcurrency`, `deviceMemory` and the
`MAX_TEXTURE_SIZE` floor. Removed from `SharedCanvas`: the `PerformanceMonitor` demotion after three
declining readings. What remains is the one question that is not a preference — does WebGL2 exist —
plus the genuine-failure paths, which are not policy either:

- `webglcontextlost`, because the alternative is a black rectangle
- the error boundary around the lazy chunk, because the alternative is a white screen

Both are still session-only and still not persisted. `AdaptiveDpr` stays: reducing quality is not the
same as taking the feature away.

Why: those signals are coarse and widely misreported, and the visible result was a capable machine
being handed a flat image with no explanation, which reads as the feature being broken rather than as
a data saving. The metered-bundle concern is real and is now answered by the toggle being labelled
with its consequence ("uses less data") instead of by deciding on someone's behalf. The removed block
is described in the `capability.ts` header if it ever needs to come back.

**The SVG-then-3D boot is by design, not a bug.** `RoomView` renders the flat scene until the lazy
canvas chunk has arrived and `canvasReady` is true. The alternative is an empty box for the length of
a 235 kB download. It is a visible swap and it will stay one.

Two notes for 1.5, both artefacts of the cloth being a placeholder rather than a curtain:
- A white voile against the sand back wall is still faint; it needs deeper folds than a cosine
- The scene shell ignores `scene` entirely, so a bed product renders the window vignette

Already verified through 1.3:
- Curtains gather to exactly `scaleX(0.36)` and the night crossfade completes to `in:1 / out:0`,
  proving the extracted motion constants survived the move intact
- Clean load with an auto-probed tier renders the lit vignette with a visible cast shadow
- Context count stays at **1** across four product navigations
- Flat view tears the canvas down completely (`canvas: 0`) and persists the choice
- Toggling back to 3D remounts both canvas and view
- Changing colourway repaints the 3D cloth, so props reach both tiers
- The SVG scene renders during the canvas boot gap, so there is no empty box at any point
- `loseContext()` fires the demote path and falls back to flat (observed accidentally, see the
  testing note above, but observed)
- Entry and jsx-runtime chunks contain zero three.js symbols

Still owed for Milestone 1:
- Force `'2d'` and confirm **zero** three chunks fetched in the Network tab
- Probe gates: Save-Data, Slow 3G, `prefers-reduced-data` each land on 2D with no three fetch
- Block the three chunk in DevTools → boundary catches, no white screen
- Override persists across reload; a *demotion* does not
- Prop parity across tiers once real parts exist (heading, finial, drawn, night)
- GPU memory flat over 20 navigations
- Idle 30 s → frame counter does not advance (blocked on the frameloop gap above)
- Mid-tier mobile throttle → `AdaptiveDpr` engages, then demotes rather than stuttering

**Milestone 2** — upload JPEG, PNG, WebP; each yields an editable draft. Reject oversized and corrupt
files. Force invalid provider output → cannot publish. Draft invisible on storefront; published only
on assigned products; archived leaves new selections but still renders in an existing quote. Re-crop →
`assetVersion` increments and the texture cache does not reuse the stale map. Carry a material through
product navigation into the quote basket and `/admin/quotes`. Confirm it renders in the 2D fallback
with 3D forced off. Confirm grid cards, basket drawer, checkout and collages still use `swatch()`.

**Milestone 3** — toggle home↔hotel, context survives. Raise the rod: hem stays off the floor and the
drop matches `snapToRod`. `prefers-reduced-motion` → curtains, landscape swap and camera flights jump
to end state in both tiers.

---

# Appendix A — Visualiser design not yet built

Absorbed from `VISUALISER_PLAN.md`, which is deleted. This is the part that is still ahead of the
code; everything already built is described above and this file wins on any disagreement.

## Prop parity is the contract

Both renderers accept exactly `PreviewProps`. If a prop arrives that only one tier can honour, the
tiers have diverged and the fallback is lying. The shared type in `preview/types.ts` is the guard, and
`tsc -b` enforces it.

## Parts vocabulary (1.5)

`src/three/parts/`: `CurtainPanel`, `BedProduct`, `CushionProduct`, `TableProduct`, `RodProduct`,
`WindowFrame`. Shared by the vignette and the configurator, so the two are the same product at two
scales rather than two lookalikes. `three/lib/invalidate.ts` gains `useInvalidateWhile(active)`.

**Snapping (`three/lib/snapping.ts`).** The curtain is never authored with a hardcoded height. It
derives from the rod, in `useLayoutEffect` so raising the rod never flashes a one-frame gap:

```ts
export function snapToRod(rod: Object3D, floorY: number) {
  rod.updateWorldMatrix(true, false)
  const box = new Box3().setFromObject(rod)
  const top    = box.min.y - RING_DROP          // cloth hangs from the rings, below the rod
  const height = top - floorY - HEM_CLEARANCE   // clearance per the existing measure guide
  const width  = (box.max.x - box.min.x) * FULLNESS   // 2.0x fullness gives the pleats cloth to make
  return { top, height, width, span: box.max.x - box.min.x }
}
```

Because it returns the numbers, the spec sheet's `widthCm`/`dropCm` are **measured from the scene**
rather than typed, and those are exactly the `QuoteLine` fields that already exist. That is the
feature a hotel buyer actually cares about.

**Open/close is a morph target**, not a scale. Two positions for one
`PlaneGeometry(width, height, 48, 24)`: base drawn flat with shallow pleats, `gathered` compressed
toward the rod end with deep pleats and a slight lean off the wall. A morph target is a per-vertex
delta blended on the GPU, so there is no CPU work per frame, and unlike `scale.x` it *deepens* folds
as the panel gathers instead of squashing the weave.

```tsx
useFrame(() => { mesh.current.morphTargetInfluences[0] = 1 - openness.current })  // read a ref
```

Driven by anime.js on a plain object, the documented v4 pattern for non-DOM targets, with
`duration: reducedMotion() ? 0 : CURTAIN_MS`, `ease: CURTAIN_EASE` and `onUpdate: () => invalidate()`.
Zero React renders for the whole 900 ms. `GATHERED = 0.36` becomes the gathered morph's compression,
so both tiers open to the same silhouette. Sheer voile gets a second inner panel
(`transparent, opacity 0.45, depthWrite: false`) with its own openness.

## Hard goods

```tsx
// Wood. metalness stays 0 because wood is a dielectric. A lacquer is low roughness plus a clearcoat,
// never "a bit of metalness" — faking it there turns the grain flat grey.
<meshPhysicalMaterial roughness={0.35} metalness={0} clearcoat={0.6} clearcoatRoughness={0.15}
  envMapIntensity={1.1} {...wood} />

// Legs and wrought iron. metalness is 0 or 1 in PBR; values between are physically meaningless.
<meshStandardMaterial color="#2c2c2c" metalness={1} roughness={0.18} envMapIntensity={1.4} />
```

Geometry procedural: `RoundedBox` top, tapered `CylinderGeometry` legs, optional iron scroll
stretcher from `TubeGeometry` along a `CatmullRomCurve3`, echoing the `iron` pattern's strokes.

## Vignette versus configurator

| | Product vignette | Configurator |
|---|---|---|
| Canvas | shared, via inline `<View>` | its own, dedicated |
| Scene | one wall, one window/bed/sofa/table per `SceneKind` | full room from a landscape descriptor |
| Camera | fixed 3/4, clamped drag (built) | full `CameraControls` plus scripted flights |
| Draw calls | budget ~40 | budget ~150 |

The five `SceneKind` and five `SceneVariant` values map 1:1 onto vignette compositions, so
`ProductPage`'s existing `sceneBySlug` to `sceneByCategory` to `'sofa'` chain keeps working untouched
and drives both renderers.

## Configurator (Milestone 3)

**Two state channels.** `Committed` re-renders React and is low frequency: `landscape`, `selection`,
`rodHeight`, `quality`, `night`, `focus`, `step`. `Transient` is never read through a hook and only
via `getState()` inside `useFrame`: `openness`, `tiling`, `camera`. This is the same discipline
`RoomPreview` already applies with its `latest` refs; the store only makes it shareable across a tree.
zustand is confined to `src/configurator/store.ts` and is the documented exception to `CLAUDE.md`'s
no-state-library rule, because `useFrame` runs 60x a second and must read current values *without*
subscribing a component to them. The vignette needs no store at all.

**Landscapes.** One `<Room>` primitive parameterised by a descriptor, so both share geometry code and
only numbers differ:

```ts
home:  { dims: [4.2, 2.7, 3.6], wall: '#f3ede7',
         floor: { kind: 'oak', roughness: 0.45 },
         windows: [{ x: 0, w: 1.8, h: 1.5, sillY: 0.9 }],
         props: ['sofa', 'coffeeTable', 'cushions', 'rug', 'plant'],
         camera: { pos: [3.2, 1.6, 3.4], target: [0, 1.2, -1.6] } }   // Nairobi apartment proportions

hotel: { dims: [5.4, 3.2, 4.6], wall: '#e8e2db',
         floor: { kind: 'walnut', roughness: 0.30, metalness: 0.02 },  // polished, catches the window
         windows: [{ x: 0, w: 3.6, h: 2.6, sillY: 0.15 }],             // near floor-to-ceiling
         props: ['kingBed', 'consoleTable', 'benchEnd', 'nightstands', 'runner'],
         camera: { pos: [3.8, 1.8, 4.2], target: [0, 1.1, -2.0] } }
```

Switching is a **child swap inside the live Canvas**, so renderer, env map, shadow maps and texture
cache all survive. `:landscape` is a route param that selects a descriptor and **must not key the
Canvas** — the mirror image of `ProductPage`'s deliberate `key={slug}`, and worth a comment saying so.
anime tweens a `dissolve` 1 to 0 cross-fading both groups, the camera flies on the same tween, and the
incoming props stagger in mid-flight. Reduced motion collapses all three to 0. Walls get
`receiveShadow` but **not** `castShadow`: a closed box casting onto itself wastes shadow-map
resolution and invites acne.

**Interactive layer.** `Hotspots.tsx` puts a drei `<Html occlude transform>` marker on each
configurable slot, pulsing until first clicked; clicking flies the camera and opens that slot's panel,
so the scene *is* the navigation. `CameraRig.tsx` uses `CameraControls` with damping and
polar/azimuth/distance clamped to the room, so a client cannot end up inside a wall — a real B2B
failure mode. Scripted flights animate a plain `{px,py,pz,tx,ty,tz}` object with anime and settle with
`maath`'s `damp3`, controls disabled for the flight. Four guided steps (`data/steps.ts`: choose
landscape, dress the windows, dress the bed/sofa, furnish and finish), skippable and remembered. A
live spec drawer totals through the existing `priceOf()` and `money()`.

**Snapshot.** `preserveDrawingBuffer: true` would force a buffer copy on every frame for a button
pressed twice a session. Render on demand and read back within the same frame, before the swap:
`gl.render(scene, camera)` then `gl.domElement.toDataURL('image/png')`.

**Postprocessing** (`@react-three/postprocessing`, SSAO plus subtle bloom) is presentation-quality
only, lazy, behind a toggle.

## Lighting reference

Currently in `three/Stage.tsx` as lightformers plus one directional key. The numbers that matter and
should survive any rework: `shadow-mapSize={[2048, 2048]}` because 1024 stair-steps along a 2.6m
curtain edge; frustum clamped tight to the room because texels spread over its volume;
`shadow-bias={-0.0004}` kills acne on the large flat floor and `shadow-normalBias={0.02}` kills
peter-panning where thin cloth meets the wall; ACES tone mapping at exposure 1.05 stops a sunlit
window blowing to flat white and keeps the deep brand reds from clipping. Day/night reuses
`LIGHT_MS = 1400` and `'inOutQuad'` across `directionalLight.intensity`, `environmentIntensity` and
two warm bedside `pointLight`s. Once a real window aperture exists, the key light moves **outside** it
so the curtain occludes it and throws its own shape on the far wall.

## The no-unnecessary-re-render contract

1. The shared Canvas mounts once per session, outside every keyed subtree. Product navigation swaps
   view contents only.
2. `frameloop="demand"`, with `useInvalidateWhile(active)` keeping frames coming during a tween and
   then stopping. **Currently `always`** — see the known gap above; this is the perf pass's target.
3. No `setState` in `useFrame` or in an anime `onUpdate`. Per-frame values live in refs or the
   transient channel.
4. Materials are memoised on finish/colour identity. Swapping a texture mutates `material.map`; it
   never constructs a new material and never touches the mesh.
5. Tiling mutates `texture.repeat` in an effect, never in render, and allocates nothing.
6. `React.memo` on every part, with props as ids and primitives, never inline arrays or freshly
   allocated objects, which silently defeat memo.
7. Dispose on unmount: procedural geometries, canvas textures and the LRU cache all release GPU memory
   in effect cleanups.
8. `AdaptiveDpr pixelated` degrades quality rather than the tier.

Exit criterion for the perf pass: idle equals zero frames, 60 fps on mid-range, no GPU memory growth
over 20 navigations. A dev-only `<Perf>` overlay behind `?debug=1`.

---

# Appendix B — Material capture design not yet built

Absorbed from `MATERIAL_CAPTURE_PLAN.md`, which is deleted. Milestone 2 above is the plan of record;
this is the detail behind it. Remember the decision taken: **client-only first**, no server, no object
storage, no vision API, with analysis as deterministic browser canvas work and the AI call stubbed
behind the `VisionProvider` interface.

## The record

```ts
interface Material {
  id: string
  name: string
  finish: 'linen' | 'velvet' | 'percale' | 'voile' | 'kitenge' | 'woven' | 'custom'
  pattern: PatternKind | 'floral' | 'embroidered' | 'abstract' | 'custom'
  colour: string
  secondaryColours: string[]

  // Client-only phase: these are IndexedDB blob keys resolved to object URLs at
  // read time, not URLs. One 2048px JPEG exceeds localStorage's ~5MB quota alone.
  sourceImageUrl: string
  albedoMapUrl?: string
  normalMapUrl?: string
  roughnessMapUrl?: string
  opacityMapUrl?: string

  roughness: number
  sheen: number
  transparency: number
  tile: [number, number]

  priceAdjustment: number
  stockMetres?: number
  productSlugs: string[]

  status: 'draft' | 'published' | 'archived'
  analysisStatus: 'pending' | 'complete' | 'failed' | 'reviewed'
  analysisConfidence?: { colour: number; pattern: number; finish: number }

  createdAt: string
  updatedAt: string
}
```

`assetVersion` is added on top of this, per Milestone 1.4: it is in the texture cache key, and without
it a re-crop silently reuses the stale GPU texture, so staff approve one thing and publish another.

## Pipeline

Decode, canvas re-encode (which drops EXIF), resize to <=2048px, thumbnail plus square crop, dominant
and secondary colours, then luminance, contrast, gloss and tile suitability, then heuristic normal and
roughness maps. **The Sobel generator is the same function as `three/lib/fabricTexture.ts`, not a
copy.**

`normalize.ts` runs on the stub's output **exactly as on a real provider's**: colours to `#rrggbb`,
confidence and visual properties to `0..1`, tile to `0.25..8`, enums clamped, invalid output failing
safe. This is the security boundary and must not be skipped because today's source happens to be
local. The same reasoning applies to the 2D image path: `swatch()` gains an image-source variant and
`RoomPreview`'s `Fabric` layer learns to fill from an `<image>`-backed `<pattern>`, keeping the hex and
id guards at `swatch.ts:39-40` and adding a URL guard (`blob:`, `data:`, `https:` only), because the
output is still injected with `dangerouslySetInnerHTML`.

## Server shape, for when there is one

```text
POST   /api/materials/upload
POST   /api/materials/analyze
POST   /api/materials
PATCH  /api/materials/:id
POST   /api/materials/:id/publish
POST   /api/materials/:id/archive
GET    /api/materials?productSlug=...
```

Images live in object storage; the database holds URLs and metadata, never image binary. Not built,
along with the vision provider, admin auth, job polling, rate limiting, image-hash caching and
retention cleanup. `/admin` stays unauthenticated per `CLAUDE.md`, and the publish call site carries a
comment that it must be permission-gated before production rather than shipping fake auth that implies
protection it does not provide.

## Acceptance

Upload JPEG, PNG and WebP; each yields an editable draft. Oversized and corrupt files are rejected.
Forced invalid provider output cannot be published. A draft is invisible on the storefront; a
published material appears only on assigned products; an archived one leaves new selections but still
renders in an existing quote. Re-crop increments `assetVersion` and the texture cache does not reuse
the stale map. A material carries through product navigation into the quote basket and
`/admin/quotes`, and renders in the 2D fallback with 3D forced off. Grid cards, basket drawer,
checkout and the decorative collages still use `swatch()`.
