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

Every product renders in the setting it belongs to, using its own colour and pattern data:

| Category | Scene |
| --- | --- |
| Curtains, fabrics, wrought iron | At a window in a furnished room |
| Hotel linen, bed canopies | Made up on a bed |
| Cushion covers | On a sofa |
| Towels, ceramics | In a bathroom |
| Table mats, household | Laid on a dining table |

Choosing a colour repaints the fabric. Choosing a **heading style** reshapes it: pencil pleat
gathers into thirteen narrow folds on a pole, wave heading falls in seven deep S curves from a slim
track, and eyelet threads through real holes punched in the cloth with the pole showing through
each one. Rails swap the finial between ball, scroll and spear. Beds widen with the selected size,
from single through to king.

The window scene opens and closes, and switches between day and night, which is how a blockout
lining shows what it is for.

### How a scene is built

Three layers, everywhere: a fixed base plate, a fabric layer filled with the product's pattern, and
a shading layer multiplied on top to put folds and creases back. Only the fabric layer changes when
the customer picks a colour.

The pattern definitions live in `src/lib/swatch.ts` and are shared by both consumers, the gallery
swatch and the live scene, so the cloth on the window is always the same cloth as the swatch.

This is the structure a photographic version uses too. Replacing the drawn base with a photograph
and a clip path of the fabric area is a swap of two assets, not a rewrite of the recolour.

### Motion

`anime.js` drives the animation. React owns the shape of the scene; anime owns exactly two things
on top of it, `transform` on the curtain panels and `opacity` on everything tied to the light
source. React never writes those two properties, so a re-render cannot fight a tween mid-flight.
Elements opt in with `data-panel`, `data-night` and `data-bed`, and the first paint is seeded with
`utils.set` so nothing animates itself on load.

Durations are constants at the top of `RoomPreview.tsx`: curtains gather over 900ms, and the light
changes over 1400ms, deliberately slower so it reads as light rather than a switch. Both respect
`prefers-reduced-motion`.

## The admin side

`/admin` is the staff view of the same two streams, and it has no login: this is a prototype, so
the route is open.

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

React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 7, anime.js 4. No UI component library,
no state management dependency, no runtime data fetching.

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

## How it is laid out

```
src/
  data/          Catalogue types and the mock product data
  lib/           KSh formatting, and the shared fabric pattern definitions
  store/         The dual cart and quote basket, persisted to localStorage
  components/    Header, footer, product card, basket drawer, room visualiser
  pages/         One file per storefront route
  admin/         The staff app: its own layout, data and pages
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
| `/admin` | Dashboard, action queues and revenue |
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

## Not yet built

The prototype stops at the boundary of the backend. Still to come: the API and catalogue data,
working payments, transactional email and SMS, product photography, authentication on `/admin`, and
per-route SEO metadata.
