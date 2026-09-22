# Kipekee Creations

The storefront and workshop system for a Nairobi interior decor business that sews made-to-measure
curtains on Katani Road and stocks the cushions, fabrics and linen that finish a room.

**Live demo: [kipekee-creations.vercel.app](https://kipekee-creations.vercel.app)**

This repository is a **clickable prototype**. Every page is real and interactive, but the catalogue
is mock data and no form or payment is wired to a backend yet.

## The central idea: two baskets

Ready-made stock and made-to-measure work are different purchases, so the app keeps them apart.

- **Cart** holds ready-made stock at a firm price and runs to an M-Pesa checkout.
- **Quote list** holds made-to-measure items, carries the measurements a quote needs, and runs to a
  quote request or a WhatsApp handoff.

Both are visible in the header at all times, so neither path is ever a dead end. Splitting them is
what lets every product show an honest price. A single basket forces a choice between publishing
prices for work that genuinely varies by window, or hiding prices across the whole catalogue.

## Product visualiser

The storefront uses a hybrid visualiser. Curtains stay on the established SVG renderer, while
products whose depth and placement matter use a shared Three.js scene. Both renderers use the
same catalogue colour and pattern definitions:

| Category | Scene |
| --- | --- |
| Curtains and fabrics | 2D window scene with pleats, headings, open/close and day/night controls |
| Wrought-iron rails | 3D rod above a window with ball, scroll or spear finial |
| Wrought-iron brackets | 3D forged bracket pair on a wall |
| Hotel linen, bed canopies | Made up on a bed |
| Cushion covers | On a sofa |
| Towels, ceramics | In a bathroom |
| Table mats, household | Laid on a dining table |

The 3D scenes are catalogue-driven rather than generic placeholders. Bed width and length follow
the selected size; four-poster frames only appear for the four-poster option; canopy nets follow the
bed footprint and drop toward the floor; sofa width follows cushion size; towels change between
bath, pool, hand, decorative and towel-set layouts; and table mats render either six mats or six
mats with two runners. Ceramic bathroom sets render a dispenser, tumbler, soap dish and brush
holder as separate glazed pieces.

### How a scene is built

The SVG scene remains the lightweight fallback. The WebGL scene uses one persistent shared Canvas,
lazy-loaded only for capable devices, with Drei geometry helpers, procedural materials, shadows,
orbit inspection, and a flat fallback when WebGL is unavailable or loses its context.

The pattern definitions live in `src/lib/swatch.ts` and are shared by both consumers, the gallery
swatch and the live scene, so the cloth on the window is always the same cloth as the swatch.

This is the structure a photographic version uses too. Replacing the drawn base with a photograph
and a clip path of the fabric area is a swap of two assets, not a rewrite of the recolour.

### Motion

The 2D curtain renderer uses `anime.js` for pleat and lighting transitions. The 3D curtain panels
use damped mesh transforms for opening and closing, while the shared light rig changes for day and
night. Both paths respect `prefers-reduced-motion`.

Durations are constants at the top of `RoomPreview.tsx`: curtains gather over 900ms, and the light
changes over 1400ms, deliberately slower so it reads as light rather than a switch. Both respect
`prefers-reduced-motion`.

## The admin side

`/admin` is the staff view of the same two streams, behind the same login everyone else uses.

There is **one set of auth screens**, not one per audience. Staff and customers prove identity
identically, and the only real difference is what the account may reach, which is a role rather
than a separate door. Signing in routes on that role: a customer lands on `/account`, staff land on
`/admin`. `/admin/accounts` is admin-only on top of that, so not everyone who can read the order
queue can also promote themselves.

Admins add staff from `/admin/accounts`. The new account is created with **no password on it** and
the person is emailed a one-time invite link, good for a week, that lets them choose their own on
`/accept-invite`. Nothing that opens the console is ever put in an email: until the link is
followed there is nothing to sign in with, and a link that goes astray can be retired by sending
another. Suspending is the normal answer when somebody leaves: their name stays attached to the
quotes and fittings they worked on, which deleting would take with it.

### Signing in locally

The backend is not deployed yet, so the frontend runs on its own: a stand-in in the browser
(`src/lib/mockApi.ts`) answers every `/api` call in the same shape the real service does. It is on
unless `VITE_MOCK_API=false` says otherwise, so `npm run dev` needs nothing else running.

These accounts work against the stand-in, and are the same ones the backend seeds in its dev
profile. They never reach a real deployment.

| Email | Password | Role |
| --- | --- | --- |
| `admin@kipekeecreations.co.ke` | `kipekee-admin-dev` | Admin |
| `grace@kipekeecreations.co.ke` | `kipekee-staff-dev` | Staff |
| `david@kipekeecreations.co.ke` | `kipekee-staff-dev` | Staff |
| `workshop@kipekeecreations.co.ke` | `kipekee-staff-dev` | Staff |
| `jane@example.com` | `kipekee-customer-dev` | Customer |
| `bookings@sarova.example` | `kipekee-customer-dev` | Customer |

Two customers on purpose: the account area is built for the repeat trade buyer as much as the
one-off shopper, and those two want different things from it.

Anything the real service would email, the stand-in logs to the browser console instead: the
invite link after adding staff from `/admin/accounts`, and the reset link after a forgotten
password. Signed-in sessions, profile edits and addresses persist in `localStorage`; clearing
site data puts the seed accounts back.

Once the backend is live, set `VITE_MOCK_API=false` and the app goes straight back on the wire.

The screen that matters is the **quote builder** at `/admin/quotes/:id`. A request arrives from the
storefront carrying the customer's measurements; staff price each window, add or waive fitting,
apply a discount, and send a fixed total that splits into a 50% deposit and a 50% balance on
fitting. Nothing can be sent until every line is priced. Without this screen, "request a quote" on
the storefront is just an inbox.

The dashboard leads with action queues rather than revenue, because an unanswered quote is the
most expensive thing that happens in this business, and the storefront promises a written quote
within one working day.

Customers are derived from orders and quotes together rather than stored separately, which surfaces
the commercially interesting segment: people who have both bought stock and commissioned
made-to-measure work.

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 7, anime.js 4, Three.js 0.185,
React Three Fiber 9, and Drei 10. shadcn/ui on Radix for the interaction primitives. No runtime
data fetching.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build     # typecheck and production build
npm run lint      # oxlint
```

Anything that sends email, and the staff login, need the backend running alongside. The dev server
proxies `/api` to it on port 8080.

### Email templates

Transactional emails are authored as React in `emails/`, and rendered once at build time into
static Qute templates the backend fills in per message. Nothing renders React at send time.

```bash
cd emails
npm install
npm run dev       # preview the templates in a browser on :3030
npm run build     # render them into the backend's resources/templates/email
```

Re-run `npm run build` after any template change and commit the rendered output with it: the
backend builds from the committed HTML, never from this workspace.

## How it is laid out

```
src/
  data/          Catalogue types and the mock product data
  lib/           KSh formatting, and the shared fabric pattern definitions
  store/         The dual cart and quote basket, persisted to localStorage
  components/    Header, footer, product card, basket drawer, room visualiser
    shadcn/      Generated Radix primitives. See "UI kit" below before editing
  pages/         One file per storefront route
  admin/         The staff app: its own layout, auth, data and pages
emails/          React Email templates, rendered to Qute templates at build time
scripts/photos/  The photography manifest and the script that fetches it
public/photos/   The images themselves, committed, plus generated credits
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/shop` | Catalogue with URL-driven filters and sorting |
| `/product/:slug` | Product detail, branching on buy or quote mode |
| `/checkout` | Three-step checkout with M-Pesa, card and pay-on-delivery |
| `/quote` | Quote request with per-item measurements |
| `/custom-curtains` | Made-to-measure landing page and FAQ |
| `/measure-guide` | Measuring guide with a live price calculator |
| `/hotel-linen` | Trade and contract page |
| `/about`, `/contact` | Company pages |
| `/login`, `/register` | Sign in and sign up, for staff and customers alike |
| `/forgot-password`, `/reset-password` | Password reset, by emailed one-time link |
| `/accept-invite` | An invited staff member choosing their first password |
| `/change-password` | Changing your own password, knowing the current one |
| `/account` | Reorder, saved list, quotes |
| `/account/orders`, `/account/saved` | Order and quote history, the saved list |
| `/account/addresses`, `/account/profile` | Delivery addresses, personal details |
| `/admin` | Dashboard, action queues and revenue |
| `/admin/accounts` | Workshop accounts, admin only |
| `/admin/quotes`, `/admin/quotes/:id` | Quote queue and the quote builder |
| `/admin/orders`, `/admin/orders/:id` | Shop orders and fulfilment |
| `/admin/products` | Catalogue, pricing and stock levels |
| `/admin/schedule` | Measure and fitting calendar |
| `/admin/customers` | Customers derived from both streams |

Storefront filters live in the query string, so any filtered view is shareable and the back button
behaves.

## Brand

Every token lives in one `@theme` block at the top of `src/index.css`. There is no
`tailwind.config.js`; Tailwind v4 reads that file directly. `emails/theme.ts` restates the same
values for the transactional templates and says so in a comment, so a colour change is an edit in
two files or it is a bug.

| Token | Value | |
| --- | --- | --- |
| Brand red | `#a11c20` | Action and emphasis only. Off the client's own stylesheet, not ours to reinterpret |
| Brass | `#c9a15e` | The secondary accent, and what does the premium work next to the red |
| Ink | `#191512` | Warm, not neutral |
| Muted foreground | `#6f665e` | Secondary body text |
| Line | `#e7e0d8` | Borders |
| Shell / sand / linen | `#faf7f3` / `#f0e8de` / `#f7f1e8` | The warm neutral grounds |
| Display face | Fraunces | Variable serif, optical sizing on, SOFT and WONK at zero |
| UI face | Poppins | Buttons, eyebrows, badges, nav, prices, table headers |
| Body face | Open Sans | |

## UI kit

Two layers, and the boundary between them is deliberate.

**Ours.** `src/components/ui.tsx` holds `Button`, `Badge`, `SectionHeading`, `Stars`, `Container`
and the `cx()` joiner. These carry the brand: the pill buttons, the serif headings, the brass
variant. Anything with a Kipekee opinion in it belongs here.

**Generated.** `src/components/shadcn/` holds shadcn/ui components, which exist for the
interaction behaviour we would otherwise be hand-rolling badly: focus traps, roving tabindex,
portals, dismissable layers. Add them with:

```bash
npx shadcn@latest add <component>
```

Three rules keep the two from becoming two design systems:

1. **No second Button.** shadcn's `button` is not installed and should not be. `dialog.tsx` has had
   its import repointed at `@/components/ui`; re-apply that after any `shadcn add dialog`.
2. **No second palette.** The semantic block in `src/index.css` maps shadcn's names
   (`--primary`, `--border`, `--muted`) onto the brand ramp above it, so a generated component
   arrives in Kipekee's colours on the first render. Nothing in that block introduces a colour of
   its own. `baseColor` in `components.json` is never applied.
3. **`cn` and `cx` are not interchangeable.** `cn` resolves Tailwind conflicts and costs more;
   generated components need it, hand-written ones compose rather than override and use `cx`.

One name was renamed to make this work: `text-muted` is now `text-muted-foreground` throughout,
because shadcn uses `muted` for a light surface and `muted-foreground` for secondary text. Sharing
the vocabulary beat forking it.

## Deployment

Vercel builds **only from `main`**. The `ignoreCommand` in `vercel.json` exits 0 on any other
branch, which tells Vercel to skip the build, so feature branches and pull requests do not produce
preview deployments. Merging to `main` triggers the production deploy.

Client-side routes are served by the SPA rewrite in the same file, so deep links like
`/product/embroidered-cushion-cover` resolve instead of 404ing.

## Not yet built

The prototype stops at the boundary of the backend. Still to come: the API and catalogue data,
working payments, transactional email and SMS, authentication on `/admin`, and per-route SEO
metadata.

Photography is in, but it is licensed stock standing in for the client's own shoot. See
`public/photos/README.md` for how to swap the real thing in without touching a component.
