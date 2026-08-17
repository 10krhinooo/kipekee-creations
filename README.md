# Kipekee Creations

A React rebuild of [kipekeecreations.co.ke](https://kipekeecreations.co.ke), the storefront for a
Nairobi interior decor business that sews made-to-measure curtains on Mombasa Road and stocks the
cushions, fabrics and linen that finish a room.

**Live demo: [kipekee-creations.vercel.app](https://kipekee-creations.vercel.app)**

This repository is a **clickable UX prototype**. Every page is real and interactive, but the
catalogue is mock data and no form or payment is wired to a backend yet.

## Why the rebuild

An audit of the live WordPress site surfaced the problems that were costing orders:

| Problem on the live site | What this rebuild does |
| --- | --- |
| No price on any product, and "Add to cart" led nowhere | Every product carries a price, in KSh, on the card and the detail page |
| Product pages were empty shells with no description or specs | Full descriptions, spec tables, care notes, delivery terms and reviews |
| Four fabricated trust badges, including "free delivery over $200" | Four claims the business can actually keep, priced in the right currency |
| "Sold by: KipekeeAdmin" on every card, a leftover marketplace plugin | Removed |
| Navigation duplicated three times over, 16 flat categories | One menu, 8 grouped categories, plus shop-by-room entry points |
| No conversion path for made-to-measure work, their core business | A quote basket, a measuring guide with a live calculator, and WhatsApp throughout |
| Hoteliers and architects named in the copy but given nowhere to go | A dedicated trade page with volume pricing bands and an account form |

## The central idea: two baskets

Ready-made stock and made-to-measure work are different purchases, so the app keeps them apart.

- **Cart** holds ready-made stock at a firm price and runs to an M-Pesa checkout.
- **Quote list** holds made-to-measure items, carries the measurements a quote needs, and runs to a
  quote request or a WhatsApp handoff.

Both are visible in the header at all times, so neither path is ever a dead end. Splitting them is
what lets every product show an honest price instead of hiding prices site-wide.

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 7. No UI component library, no state
management dependency, no runtime data fetching.

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
  lib/           KSh formatting, and the procedural SVG swatch generator
  store/         The dual cart and quote basket, persisted to localStorage
  components/    Header, footer, product card, basket drawer, shared UI
  pages/         One file per route
```

**Images** are generated as inline SVG textile swatches keyed on each product's pattern and colour,
because the prototype ships without the client's photography. Each one occupies the exact slot a
real photo will, so swapping them out is a change to `ProductCard` and `ProductPage` only.

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
| `/admin` | Admin dashboard, action queues and revenue |
| `/admin/quotes`, `/admin/quotes/:id` | Quote queue and the quote builder |
| `/admin/orders`, `/admin/orders/:id` | Shop orders and fulfilment |
| `/admin/products` | Catalogue, pricing and stock levels |
| `/admin/schedule` | Measure and fitting calendar |
| `/admin/customers` | Customers derived from both streams |

Filters live in the query string, so any filtered view is shareable and the back button behaves.

## Brand

Colours and typefaces are carried over unchanged from the live site.

| Token | Value |
| --- | --- |
| Brand red | `#A11C20` |
| Ink | `#17181A` |
| Muted | `#888888` |
| Display face | Poppins |
| Body face | Open Sans |

## Room visualiser

Products that hang at a window open on a room scene rather than a flat swatch. Picking a colour
repaints the curtain in the room immediately, and the scene can be opened, closed and switched
between day and night, which is how a blockout lining shows its value.

`RoomPreview` draws the scene as three layers: a fixed base plate, a flat colour layer in the
shape of the fabric, and a shading layer multiplied on top to put the pleats back. The colour layer
is the only thing that changes. That is the same structure a photographic version uses, so
replacing the procedural base with a real photograph and a clip path of the curtain area is a swap
of two assets, not a rewrite.

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

## Deployment

Vercel builds **only from `main`**. The `ignoreCommand` in `vercel.json` exits 0 on any other
branch, which tells Vercel to skip the build, so feature branches and pull requests do not produce
preview deployments. Merging to `main` triggers the production deploy.

Client-side routes are served by the SPA rewrite in the same file, so deep links like
`/product/embroidered-cushion-cover` resolve instead of 404ing.

## Not yet built

The prototype stops at the boundary of the backend. Still to come: a real API and catalogue
migration, working payments, transactional email and SMS, product photography, an admin panel, and
SEO metadata per route.
