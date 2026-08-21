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

The backend seeds these accounts in dev only. They exist while the backend runs with its dev
profile and never reach a real deployment.

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
React Three Fiber 9, and Drei 10. No runtime data fetching.

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
  pages/         One file per storefront route
  admin/         The staff app: its own layout, auth, data and pages
emails/          React Email templates, rendered to Qute templates at build time
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

| Token | Value |
| --- | --- |
| Brand red | `#A11C20` |
| Ink | `#17181A` |
| Muted | `#888888` |
| Display face | Poppins |
| Body face | Open Sans |

## Deployment

Vercel builds **only from `main`**. The `ignoreCommand` in `vercel.json` exits 0 on any other
branch, which tells Vercel to skip the build, so feature branches and pull requests do not produce
preview deployments. Merging to `main` triggers the production deploy.

Client-side routes are served by the SPA rewrite in the same file, so deep links like
`/product/embroidered-cushion-cover` resolve instead of 404ing.

### Where the backend is

The API is a separate deployment, on Railway. In development the Vite server proxies `/api` to
`localhost:8080`, so every path in `src/lib/api.ts` is relative and nothing needs configuring.
Deployed, the two are on different hosts and there is no proxy: the build reads `VITE_API_BASE` and
prefixes it onto every request, including the `/api/media/...` a photograph is served from.

| Set on | Variable | Value |
| --- | --- | --- |
| Vercel | `VITE_API_BASE` | The backend's origin, e.g. `https://backend-production-83b0.up.railway.app` |
| Railway | `STOREFRONT_ORIGIN` | This site's origin, which the backend allows through CORS |

The two have to agree, and this is the only place they do. `VITE_API_BASE` is read at build time
rather than at run time, so changing it needs a redeploy and not a restart. Left unset, every path
stays relative, which is what a local `npm run dev` wants.

## Not yet built

The prototype stops at the boundary of the backend. Still to come: the API and catalogue data,
working payments, transactional email and SMS, product photography, authentication on `/admin`, and
per-route SEO metadata.
