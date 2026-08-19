# Kipekee Creations — storefront follow-ups, admin documents, accounts, backend scaffold

> Working document, not polished for anyone but us. Tracks a large batch of asks that arrived in
> one session: some shipped same-day, the rest wait on a backend that doesn't exist yet.

## Working preferences (how, not just what)

Standing conventions for this whole batch of work, given mid-session and applying to every phase
below, not just Phase 1:

- **Branching and PRs**: every non-trivial change goes on its own feature branch cut from an
  up-to-date `main`, with a PR opened back to `main` when done — never commit straight to `main`.
  Before branching, fetch and check whether the branch you'd naturally build on has already been
  merged, so you don't build on stale history or drag in already-merged work.
- **Commit messages and PR descriptions must not include**: a "Test plan" section, trailers (e.g.
  `Co-Authored-By`, `Generated-with`), or em dashes. Plain hyphens/commas instead.
- **Backend stack**: Quarkus + Java, not Node — matches `dondooHomes`/`webchama-2.0` conventions,
  in a **new sibling directory** (`Projects/kipekee-creations-backend/`), not nested inside this
  frontend repo.
- **Email provider**: Resend.
- **Admin auth**: add it now rather than deferring — real customer/business data (documents,
  wishlist emails, accounts) is about to sit behind `/admin`.
- **Social links**: Instagram, Facebook, TikTok specifically (not X/YouTube/LinkedIn) — ship the
  icons now with placeholder links rather than waiting on real URLs.
- **Logo**: no asset exists yet and that's fine — reuse the existing text wordmark + inline SVG
  mark everywhere a logo is needed (site header/footer and printed documents) until a real file is
  provided; don't block work on sourcing one.
- **Discount editing**: wait for the backend-backed version rather than shipping a quick
  client-only (IndexedDB) override — correctness/shared-across-devices over shipping speed here.
- **Buttons should explain themselves on hover**: native `title` tooltips on icon-only controls
  (compare, wishlist, close, quantity steppers, etc.), not just an `aria-label` that only
  screen readers see.
- **Login/register visual style**: follow the pattern in
  `Projects/apeiro-marketing/components/auth/SignInScreen.tsx` — centered white card on a dark
  decorative background, split into a left form panel and a right brand panel with floating
  cards/shapes and a soft entrance animation — but reskinned to Kipekee's own brand tokens
  (`#A11C20` red, `#17181A` ink, Poppins/Open Sans) and built with **anime.js**, not GSAP, since
  this repo already uses anime.js (`RoomPreview.tsx`) and GSAP would be a new dependency for no
  reason.
- **Customer accounts matter for repeat B2B-ish buyers**: hotels and similar frequent customers
  should be able to keep a persistent record of orders, wishlist, and preferences across visits —
  this is the reason accounts exist at all here, not a generic "add auth" ask, so the account area
  (Phase 3) should foreground order history and reorder-ability rather than being a bare profile
  page.

## Context

This request bundles well over a dozen distinct asks, spanning three different kinds of work:

1. **Small, self-contained frontend fixes** — copy changes, a repositioned UI element, a fuller
   WhatsApp message, placeholder social icons, a bigger dropdown, inline validation, hover tooltips.
2. **Admin features that need real data to be useful** — a discount editor and a document
   generator only matter once there's something to edit or bill. Today `src/admin/data/operations.ts`
   is a hardcoded mock array with no create/update/delete of any kind, and there is no admin
   authentication at all (confirmed: `/admin` is a fully open route).
3. **A backend from nothing** — this repo has never had a server (confirmed: no server framework
   in `package.json`, no `server/`/`api/`/`backend/` directory anywhere). Wiring the storefront to
   a real backend (persisted orders, real emails, admin auth, customer accounts) is its own
   multi-week project, not a same-day add-on to the frontend list above.

Given that, this plan does the frontend fixes for real first, and scaffolds the backend as a
running skeleton (matching the `webchama-2.0` Quarkus conventions) with just enough endpoints to
back the features that categorically require a server: emailing a wishlist, admin login, and now
customer accounts. It explicitly does **not** attempt to rewire the whole admin mock-data layer or
the checkout flow onto the new backend in one pass — that is flagged as follow-up work, because
doing it well means touching every admin page and the whole `operations.ts` module.

User decisions collected so far:
- Backend: **Quarkus + Java**, in a **new sibling directory** `Projects/kipekee-creations-backend/`.
- Email: **Resend**.
- Admin: **add basic auth now**, since real customer data (documents, wishlist emails) will sit
  behind it.
- Social icons: **Instagram, Facebook, TikTok**, placeholder `#` links until real URLs are given.
- Logo: **no asset yet** — reuse the existing text wordmark + inline SVG mark on printed documents.
- Discount editing: **wait for the backend-backed version**, no client-only IndexedDB override.
- Compare toggle: the real complaint was the **product-card corner overlay**
  (`src/components/ProductCard.tsx`), not the header nav — fixed in Phase 1.
- **New**: customer accounts (login/register, persistent orders/wishlist/choices) for repeat
  customers — hotels and similar. Needs a `Customer` entity and auth flow in the backend.
- **New**: the login screen (both customer and admin) should follow the visual pattern from
  `Projects/apeiro-marketing/components/auth/SignInScreen.tsx` — a centered white card on a dark,
  decorative background, split into a left form panel and a right brand panel with floating
  cards/shapes and a soft entrance animation. That project uses GSAP; this repo already has
  `animejs` (used in `RoomPreview.tsx`) so the login entrance should use anime.js instead of adding
  a new animation dependency, adapted to Kipekee's brand tokens (`#A11C20` red, `#17181A` ink,
  Poppins/Open Sans) rather than the navy/mint apeiro palette.

---

## Phase 1 — Frontend fixes ✅ DONE — shipped in PR #9 (`feat/storefront-followups` → `main`)

All of the following are committed and verified live in the browser (not just typechecked):

- **1a. Compare toggle on `ProductCard`** — now a circular icon button matching the wishlist
  heart's shape, side by side instead of stacked as a mismatched pill.
- **1b. WhatsApp quote messages carry full detail** — new `src/lib/whatsapp.ts` shared formatter,
  used by `ProductPage.tsx`, `BasketDrawer.tsx`, and `QuoteRequest.tsx` so every entry point sends
  colour, room, size, window count, and notes consistently.
- **1c. Hotels/trade CTA copy** — `Trade.tsx` now reads "Talk to a member of the team".
- **1d. Social media footer icons** — Instagram/Facebook/TikTok added to `Footer.tsx`, placeholder
  `href="#"` links.
- **1e. Checkout county dropdown** — new `src/data/kenya.ts` with all 47 counties; the existing
  Nairobi-only "Pay on delivery" gate and tiered delivery-time copy both still work off the
  selected county id.
- **1f. Inline form validation** — new `src/lib/validate.ts` (`isValidKenyanPhone`,
  `isValidEmail`), wired into `QuoteRequest.tsx`, `Checkout.tsx`, `Contact.tsx` as controlled
  inputs with on-blur error messages.
- **Bonus, requested mid-session**: native `title` hover tooltips added to every icon-only button
  across `Header.tsx`, `BasketDrawer.tsx`, `Lightbox.tsx`, and `AdminLayout.tsx` that previously had
  only an `aria-label`. Also fixed a latent bug in `Button` (`src/components/ui.tsx`) where
  `onClick` was dropped on its `Link`/`<a>` forms, meaning "Checkout" and "Request my quote" never
  closed the basket drawer on navigate.

---

## Phase 2 — Admin: auth gate + discount editing + document generator (not started)

### 2a. Basic admin auth
`/admin` is currently a fully open sibling route tree (`src/App.tsx`, `AdminLayout.tsx`) with no
session concept anywhere in the codebase. Add a login screen — styled per the apeiro reference
above — that checks a password against the backend (Phase 3) via `/api/admin/login`, returning a
token stored in `sessionStorage`, checked by a route guard wrapping `AdminLayout`. Intentionally
minimal, not a full role system.

### 2b. Discount / compareAt editing — deferred to Phase 3
`compareAt` only exists as a hardcoded literal in `src/data/catalogue.ts`; the admin's
`Products.tsx` reads a *disconnected* mock list in `operations.ts` with no `compareAt` field at
all. Ships once Phase 3 has a `product_override` table (`slug`, `price`, `compare_at`) and an
admin-login-gated `ProductOverrideResource`. The storefront's `bySlug`/`priceOf` fetch overrides
from the API and apply them on top of the catalogue literal if present.

### 2c. Document generator (invoice / receipt)
New admin page `src/admin/pages/Documents.tsx`, two modes: from a system order/quote (pre-fills
from `operations.ts`), or manual entry for walk-ins/WhatsApp orders. Printable HTML (browser
print-to-PDF, no new PDF dependency). Reuses the existing text wordmark + inline SVG mark — no logo
asset yet. Uses `money()` from `src/lib/format.ts`; needs a small date formatter alongside it (none
exists yet).

---

## Phase 3 — Backend scaffold + customer accounts (new repo, not started)

New repo `Projects/kipekee-creations-backend/`, mirroring `webchama-2.0` conventions:

- **Maven**, Quarkus **3.37.x**, **Java 21**, `packaging=quarkus`, group id `com.kipekeecreations`
  (confirm exact naming when starting).
- Extensions: `quarkus-hibernate-orm-panache`, `quarkus-rest` + `quarkus-rest-jackson`,
  `quarkus-hibernate-validator`, `quarkus-flyway`, `quarkus-jdbc-postgresql`, `quarkus-mailer`
  (Resend via SMTP relay). Skip `quarkus-oidc`/Keycloak — both admin and customer auth are simple
  password/session checks here, not full OIDC; flag as a gap if Keycloak parity is wanted later.
- **Layering**: `domain/model`, `dto`, `repository` (Panache repositories), `rest` (JAX-RS
  resources), `service` — matches `webchama-2.0`'s `Member`/`MemberRepository`/`MemberResource`.
- **Local Postgres**: `docker-compose.yml`, Postgres 16-alpine, port **5435** (webchama-2.0 already
  uses 5434), db name `kipekee`.
- **CORS/dev wiring**: no `quarkus.http.cors*` config; add a Vite dev-server proxy
  (`server.proxy['/api'] = 'http://localhost:8080'`) instead, matching `webchama-2.0`. This repo's
  `vite.config.ts` has no proxy today — add it.
- **Entities for this phase**:
  - `AdminUser` — Phase 2a's login.
  - `Customer` — email, hashed password, name, phone; the account itself.
  - `CustomerSession` (or a signed token approach) — login persistence.
  - `WishlistItem` — `customer_id`, product `slug`, so a signed-in customer's wishlist survives
    across devices instead of living only in `localStorage`.
  - `Order` / `OrderLine` — real persisted orders tied to a `Customer` (nullable for guest
    checkout), superseding `operations.ts`'s mock `Order` type for anything created through the
    live site going forward. Existing mock admin data stays as-is until the admin rewrite
    (see non-goals).
  - `WishlistEmailRequest` — for the guest "email me this list" feature (no account needed).
  - `ProductOverride` — if 2b's backend-backed discount editor is built in this pass.
- **Flyway migrations** for all of the above, `quarkus.hibernate-orm.database.generation=none`.
- `CLAUDE.md` in the new repo documenting `./mvnw quarkus:dev`, `docker compose up -d`, ports.

### Customer accounts (new scope)
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` — email/password,
  session token in an httpOnly cookie or `sessionStorage` (decide based on whether SSR/CSRF matters
  here — this is a pure SPA today, so `sessionStorage` + bearer token is the simpler match for the
  existing `useBasket`/`useSaved` provider pattern).
- Frontend: `src/pages/Login.tsx`, `src/pages/Register.tsx`, both built from the apeiro-styled split
  panel described above, adapted to Kipekee's brand tokens and using anime.js for the entrance
  instead of GSAP.
- A `useAccount()` provider (same shape as `useBasket`/`useSaved`) that, once signed in, syncs
  `saved.tsx`'s wishlist and basket history to the backend instead of (or in addition to)
  `localStorage`, and exposes order history pulled from the new `Order` table.
- `src/pages/Account.tsx` — order history, saved wishlist, saved delivery details, aimed
  specifically at repeat B2B-ish customers (hotels) who reorder often, per the original ask.
- Guest checkout stays fully functional — accounts are additive, not required to buy.

### Wishlist-email endpoint (guest path, no account needed)
`POST /api/wishlist/email {email, slugs[]}` → sends via `quarkus-mailer`/Resend SMTP. Frontend:
"Email me this list" action on `src/pages/Wishlist.tsx`.

---

## Explicit non-goals for this pass (follow-up work, not silently dropped)

- Full checkout persistence beyond what Phase 3's `Order` entity provides at first — richer
  post-purchase flows (tracking, cancellation, returns) are separate.
- Migrating `src/admin/data/operations.ts`'s mock arrays onto the backend wholesale (touches every
  admin page: Orders, Quotes, Customers, Dashboard, Schedule) — Phase 3 only introduces `Order` for
  new real purchases, it doesn't retire the mock data admin pages read today.
- Photo storage moving to a bucket (user said "when we launch" — explicitly deferred).
- Full OIDC/Keycloak-grade auth for either admin or customers (both ship as simple password/session
  auth instead).
- A hotel-specific page distinct from `/hotel-linen` sharing `Trade.tsx`.

---

## Verification

- **Frontend (Phase 1)**: done — `npm run build`, then exercised live via Chrome tooling: compare
  toggle and tooltips, WhatsApp message content from all three entry points, county dropdown COD
  gating, validation errors on all three forms.
- **Admin (Phase 2)**: log in through the new gate, confirm `/admin` is unreachable without it; edit
  a discount and confirm the storefront reflects it; generate one document in each mode.
- **Backend + accounts (Phase 3)**: `docker compose up -d`, `./mvnw quarkus:dev`, confirm Flyway
  migrations apply cleanly; register and log in as a customer, add to wishlist while signed in,
  confirm it survives a fresh browser/session; place a guest order and confirm it lands in `Order`;
  hit the wishlist-email endpoint against a test inbox; confirm the Vite proxy delivers `/api` calls
  from the frontend dev server through to the backend.
