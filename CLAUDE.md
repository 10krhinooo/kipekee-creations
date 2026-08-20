# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`README.md` is thorough and current. It documents the product reasoning, the full route table, the
brand tokens and the scene mapping. Read it first and do not duplicate it here; this file covers the
invariants and gotchas that are only visible by reading several files at once.

`IMPLEMENTATION_PLAN.md` is the working plan for the WebGL room preview and the admin material
capture work. It records what is built, what is not, and the findings that cost time — read it before
touching anything under `src/three/` or `src/components/preview/`. It is untracked on purpose and is
part plan, part history, so trust the code over it for anything that already exists.

## Commands

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # tsc -b, then vite build. This is the typecheck.
npm run lint      # oxlint (not ESLint)
```

There is **no test framework** in this repo — no runner, no test files, no `npm test`. `npm run build`
is the only automated verification, since `tsc -b` typechecks the whole project before Vite bundles.
Do not report work as verified on the basis of the build alone when the change is behavioural;
exercise it in the browser.

The dev server is registered in `.claude/launch.json` as `kipekee`, so start it with the preview
tooling rather than a raw shell command.

## Architecture

### Two baskets, and `mode` as the branch point

`SellMode` (`'buy' | 'quote'`) in `src/data/types.ts` is the spine of the whole app. Ready-made stock
is bought at a firm price; made-to-measure work is quoted. `src/store/basket.tsx` holds two separate
line arrays for this reason, and page components branch on `product.mode` to decide which controls,
which basket and which call to action to render.

When adding a product surface, decide which mode it serves before writing markup. A control that
ignores the split (a single "add to basket", a price on a quote item presented as final) breaks the
model the business depends on.

`BasketProvider` persists to `localStorage` under `kipekee.basket.v1`. Changing the shape of `State`
means bumping that key, otherwise returning visitors hydrate a stale shape. Hydration is guarded and
failures are swallowed on purpose: private browsing must not stop the shop loading.

### The visualiser, and who owns which property

`src/components/RoomPreview.tsx` is the most constrained file in the repo. Its contract:

- **React owns the shape of the scene. anime.js owns `transform` on `[data-panel]`/`[data-bed]` and
  `opacity` on `[data-night]`.** React must never write those properties, or a re-render will fight a
  tween mid-flight. Elements opt in via the data attributes.
- The seeding effect (`utils.set`) deliberately depends on `[scene, variant, heading]` only. It reads
  `drawn`/`night`/`bedScale` through the `latest` refs instead of taking them as dependencies,
  because re-seeding on a state change would snap to the destination and leave the tween with
  nothing to travel. Do not "fix" those dependency arrays.
- Durations and easings are constants at the top of the file. Both paths respect
  `prefers-reduced-motion` by collapsing duration to 0.
- Every SVG id is scoped with `useId()`. SVG ids are global to the document and several previews can
  be mounted at once, so any new `<defs>` entry must go through the `id` map or scenes will steal
  each other's gradients and masks.

Scene selection is a three-step fallback chain in `ProductPage.tsx`:
`sceneBySlug` → `sceneByCategory` → `'sofa'`. Add new products to the category map, and reserve the
per-slug map for genuine exceptions.

The product route is keyed on the slug so navigating between products remounts rather than reuses.
Without that key the previous product's colour and heading leak into the next one and can select a
style it does not offer.

### One fabric definition, two consumers

`src/lib/swatch.ts` exports `patternDefs()`, which returns raw SVG markup for a `<defs>` block. The
gallery swatch bakes it into a data URI; `RoomPreview` injects it live via `dangerouslySetInnerHTML`.
Sharing one definition is what keeps the cloth on the window identical to the cloth on the swatch.

Because the output is injected as markup, `patternDefs` validates its own inputs — the colour against
a `#rrggbb` regex, the id stripped to `[A-Za-z0-9_-]`. Those guards must survive any edit to that
function; catalogue colours are ours today but are meant to come from an API later.

### Storefront and admin are separate shells

`App.tsx` mounts `StorefrontLayout` and `AdminLayout` as sibling route trees. They share no header,
footer or basket drawer, and admin has its own `admin/data/operations.ts`.

### One session, one set of auth screens

`src/auth/AuthProvider.tsx` holds the only session in the app. There is deliberately **no separate
staff session and no separate staff login** — both audiences prove identity identically, and the
only difference is `role`, which decides where they are let in. Two providers would have meant two
of everything behind them and somewhere for the two to drift.

`RequireAuth` waits on `checking` rather than trusting that a token exists, since the stored token
is revalidated against the backend on load. It is **routing, not security**: it decides what to
render, and the backend re-checks the role on every request. Anything that treats the client-side
role as an authorisation decision is wrong by construction.

Three invariants worth not breaking:

- **Registration can never set a role.** The backend hard-wires `CUSTOMER` and the request record
  has no field for it, because that endpoint is public.
- **An invited account has no password until the invitee chooses one.** Staff are invited by a
  one-time link (`/accept-invite`), never a temporary password, so nothing that opens the console
  is ever transmitted. `password_hash` is nullable for exactly this gap, and "invite pending" is
  read off it rather than a second column that could disagree.
- The old `/admin/login` paths are redirects, not duplicates. They are in bookmarks and in
  already-sent emails.

### The curtain owns page transitions

`PageCurtain` wraps `<Routes>` and renders them through a **deferred location**. That indirection is
the whole point: React Router commits the new route in the same render as the location change, so an
overlay that merely watches `useLocation()` closes over a page that has already swapped — you see
the destination, then a curtain covers it, then reveals the same thing. Holding `shown` one step
behind, and advancing it only when the close finishes, puts the swap behind a shut curtain.

Consequences to respect:

- **`ScrollToTop` takes a pathname, it does not read one.** Scrolling on the real location would
  jolt the page somebody is still looking at.
- **The entrance goes on a layout's `<main>`, never on a wrapper around the whole tree.** An
  animated `transform` makes its element a containing block, and `position: fixed` inside one stops
  being fixed to the viewport — the header, basket drawer and WhatsApp button would all break.
  `animate-page-rise` in `index.css` carries the delay that holds the content back until the cloth
  has cleared.
- **Navigation inside `/account` or `/admin` is exempt** (`SECTIONS` in `PageCurtain`). Moving
  between account tabs or console sidebar items changes a panel, not a page, and a full curtain
  over that is heavier than the thing it covers.
- **`AuthScene` must not draw curtains of its own.** It used to, and once the transition covered
  auth routes too you got cloth drawing across to reveal more cloth — two identical fabrics at
  different scales read as a duplicate. What is left there is the lit room behind them.
- **React must not set `opacity` on the overlay.** It owns `display`; the transition effect owns
  `opacity`. Setting both meant every re-render stomped the tween and stranded the cloth mid-screen.
- **The panels are tweened with `element.animate`, not with anime.** That is a performance
  constraint, not taste. A `transform` written from JavaScript on a half-viewport element forces a
  re-raster every frame; declared as a Web Animation it runs on the compositor and never repaints.
  Measured across one page change: 1141 raster tasks and 605ms of raster work before, 31 tasks and
  24ms after. `CURTAIN_EASE_CSS` in `lib/motion.ts` is `CURTAIN_EASE` sampled into a CSS `linear()`
  from the same exponent, so the curve is identical to the one the visualiser runs on anime's timer.
  Moving this back onto a per-frame callback undoes the whole fix.

`components/Curtains.tsx` owns the cloth for both, for the same reason `patternDefs` is shared: two
curtains that do not match read as two products. It is HTML and CSS, not SVG: each panel is a
promoted layer wearing `clothTile()` as a repeating background at a fixed pixel size, so there is a
bitmap for the compositor to scale and the weave stays square at every viewport instead of being
stretched by `preserveAspectRatio="none"`.

### Emails are React, rendered once

`emails/` is a separate workspace with its own `package.json`, deliberately outside the app's
`tsc -b` and dependency tree. Its templates are rendered at build time into static Qute templates in
the backend; nothing renders React at send time.

The bridge works because Qute's delimiters contain nothing HTML-special, so `{customerName}` and
`{#for line in lines}` pass through React's renderer as literal text. That imposes one rule: a
section tag lands as a bare text node, so every repeated block is a self-contained table rather than
a row of a shared one — a `{#for}` between two `<tr>`s would emit text into a `<tbody>`. `build.tsx`
asserts both that tags balance and that no delimiter came out escaped.

After changing a template, run `npm run build` in `emails/` and commit the rendered output with it.
The backend builds from the committed HTML.

## Conventions

- **Tailwind v4, configured in CSS.** Theme tokens live in the `@theme` block of `src/index.css`.
  There is no `tailwind.config.js`; do not add one. Custom utilities use `@utility`.
- **Brand colours and typefaces are fixed** and must not be changed: `#A11C20` brand red, `#17181A`
  ink, Poppins for display, Open Sans for body. See the token block in `src/index.css`.
- **All money goes through `money()`** in `src/lib/format.ts`, which normalises `Intl` output to the
  "KSh" spelling Kenyan retail uses. Never format a price inline.
- No UI component library and no state management dependency. Shared primitives are in
  `src/components/ui.tsx`; extend that file rather than adding a dependency.
- Comments in this codebase explain *why* a decision was made, not what the code does. Match that.

## Data and scope

The catalogue in `src/data/catalogue.ts` is mock data and product imagery is procedural SVG,
generated from each product's pattern and accent colour.

Four storefront forms now reach the backend through `src/lib/api.ts`: quote request, contact,
wishlist email and the checkout receipt. All four only **send email** — nothing is persisted beyond
a log row that a message went out, because the `Order` and `Customer` entities do not exist yet. A
success from any of them means "the workshop was told", not "this is recorded".

Still unbuilt: customer accounts, catalogue migration off the old WordPress site, working payments,
SMS, real photography, and per-route SEO metadata.

## Deployment

Vercel builds from `main` only — the `ignoreCommand` in `vercel.json` exits 0 on every other ref,
which tells Vercel to skip the build. The same file carries the SPA rewrite that makes deep links
like `/product/embroidered-cushion-cover` resolve instead of 404ing.

If merged work does not show on the live URL, check that the Vercel project's **Production Branch**
is `main` before investigating the build. A deployment with `"target": null` built as a preview and
never reached the production alias.
