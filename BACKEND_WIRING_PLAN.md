# Wiring the storefront to the backend it already has

## Context

The question was whether any frontend work in the sister repo
(`Projects/kipekee-creations`) is not configured against a backend service. It is — but the
interesting finding is the *direction* of the gap.

The backend (`Projects/kipekee-creations-backend`) exposes **55 endpoints across 14 JAX-RS
resources**. The frontend calls **41 of them**. The shortfall is not mostly "the backend hasn't
been built": for nearly every unwired screen, **the endpoint already exists and is unused**. The
frontend's `CLAUDE.md` and `FOLLOWUP_PLAN.md` both describe a world where orders aren't persisted
and the catalogue is mock data — that is stale; `CheckoutResource`, `AccountResource` and
`CatalogueResource` all landed since.

There is also one gap in the opposite direction that is live-broken today: the backend emails
customers a quote-approval link to a frontend route that does not exist.

Sources: `src/lib/api.ts` (the only `fetch` in the app), `src/admin/data/api.ts`,
`src/main/java/com/kipekeecreations/rest/*`.

---

## Findings

### A. Backend exists, frontend never calls it (the bulk of it)

| # | Frontend surface | Current behaviour | Endpoint sitting unused |
|---|---|---|---|
| A1 | `src/pages/account/Orders.tsx` | Two hardcoded empty panels; comment says "Orders are not persisted yet" | `GET /api/account/orders`, `GET /api/account/orders/{reference}` (`AccountResource.java:138,144`) |
| A2 | `src/store/saved.tsx` | Wishlist lives only in `localStorage` (`kipekee.saved.v1`); `/account/saved` reads the server list, so the two silently diverge | `POST /api/account/saved` bulk merge (`AccountResource.java:170`) |
| A3 | `src/pages/Checkout.tsx:69` | Posts the legacy `POST /api/orders/confirmation`, which trusts client-computed amounts | `POST /api/checkout` — server prices everything, 409 on stock movement (`CheckoutResource.java:52`) |
| A4 | `src/store/photos.tsx`, `src/admin/pages/ProductPhotos.tsx` | Photos resized in-browser into IndexedDB — per-browser, invisible to customers and other staff. No `FormData` anywhere in the repo | `GET/POST/PUT/DELETE /api/admin/products/{slug}/photos` multipart + `GET /api/media/{name}` (`AdminProductResource.java:130-197`) |
| A5 | `src/admin/pages/Products.tsx` | Stock adjustment only — no create, edit, price/discount, or withdraw | `POST /api/admin/products`, `PUT /api/admin/products/{slug}`, `DELETE .../{slug}` (`AdminProductResource.java:82-107`) |
| A6 | `src/pages/Trade.tsx:130-165` | Uncontrolled inputs, no submit handler, caption literally reads *"Prototype form. Nothing is sent."* — while `/admin/trade-enquiries` already reads the table | `POST /api/trade/enquiry` (`TradeResource.java:39`) |
| A7 | Product page reviews | Reviews render from `?detail=1`; nothing posts one | `POST /api/catalogue/products/{slug}/reviews` (`CatalogueResource.java:97`) |
| A8 | `src/store/catalogue.tsx:61`, `src/pages/Shop.tsx`, `Header.tsx:137` | Pulls whole catalogue with `pageSize=200`, then filters/searches/paginates in memory | `GET /api/catalogue/products` already supports `category`, `room`, `mode`, `max`, `stock`, `q`, `sort`, `page`, `pageSize` |

### B. Backend exists, frontend route is missing — live-broken

**B1.** `StorefrontNotifier.java:127` emails the customer
`{baseUrl}/quote/{reference}?token={approvalToken}`. `src/App.tsx` has `/quote` (the request form)
but **no `/quote/:reference`**, and the catch-all is `<Route path="*" element={<Home />} />`. A
customer clicking "approve your quote" lands on the homepage with no error. Endpoints waiting:
`GET /api/quote/{reference}?token=` and `POST /api/quote/{reference}/approve?token=`
(`QuoteApprovalResource.java:39,51`).

### C. Neither side exists

- **C1. Customer quote history** — `account/Orders.tsx` promises a Quotes panel; there is no
  `GET /api/account/quotes`. Needs a backend endpoint as well as the UI.
- **C2. Payments** — no gateway on either side. `PayMethod` is a recorded choice; `paid` is a
  boolean staff tick via `PUT /api/admin/orders/{reference}/payment`. An M-Pesa STK push +
  callback is genuinely unbuilt work, not a wiring job.
- **C3. Client-side commerce logic that should be server-quoted** — delivery fee and ETA are
  computed in `src/data/kenya.ts`; the backend holds `kipekee.delivery.fee` /
  `kipekee.delivery.free-from` and disagreeing values are a real hazard once A3 lands.

### D. Static content, no service needed (listed so it isn't mistaken for a gap)

Home testimonials (`Home.tsx:78-99`, invented names and 5-star ratings — worth deleting rather than
wiring), Trade volume-pricing bands (`Trade.tsx:62-66`), footer social links at `href="#"`
(`Footer.tsx:15-19`), About/MeasureGuide/CustomCurtains copy, `src/three/data/fabrics.ts`, and
procedural SVG product imagery.

---

## Recommended sequencing

Ordered by *harm while unfixed*, not by effort.

1. **B1 — add `/quote/:reference`.** Smallest change, only one that is broken in production. A
   storefront page reading `GET /api/quote/{reference}?token=` from the query string, rendering
   lines and total, with an approve button. Read the token via `useSearchParams`; do not put it in
   `localStorage`.
2. **A6 — make the trade form real.** Control the inputs, reuse `isValidEmail` /
   `isValidKenyanPhone` from `src/lib/validate.ts` and the on-blur error pattern already in
   `Contact.tsx`, post to `/api/trade/enquiry`, delete the "Nothing is sent" caption. Closes the
   loop with the admin page that already lists enquiries.
3. **A3 + C3 — move checkout to `POST /api/checkout`.** Send slugs and quantities, let the server
   price. Handle 409 (stock moved) and 429 (throttled) explicitly — `api.ts` already surfaces
   `status` and passes the backend's human-readable `message` through. Then treat `kenya.ts`
   delivery figures as display-only, or drop them in favour of the server's total.
4. **A1 + A2 — finish the account area.** `GET /api/account/orders` into `account/Orders.tsx`
   (reorder is the whole reason accounts exist here, per `FOLLOWUP_PLAN.md`), and have
   `AuthProvider` fire `POST /api/account/saved` with the local slugs on sign-in, then treat the
   server as the source of truth for `saved.tsx` while signed in. Guests keep `localStorage`.
5. **A4 + A5 — the admin product console.** Replace the IndexedDB photo store with multipart upload
   to `/api/admin/products/{slug}/photos`, render from `/api/media/{name}`, and add product
   create/edit. This retires `src/store/photos.tsx`, `src/lib/idb.ts` and `src/lib/image.ts` (keep
   client-side resize before upload — `kipekee.media.max-bytes` is 12MB).
6. **A7, A8** — review submission, then server-side faceting once the catalogue outgrows 200 rows.
7. **C1, C2** — new backend work; scope separately.

Also worth doing while in here: `src/pages/Checkout.tsx:25`, `account/Orders.tsx:5-10`, the
frontend `CLAUDE.md` "Data and scope" section, and `FOLLOWUP_PLAN.md` all assert the backend is
absent or email-only. Update them as each item lands, or they will keep misleading the next reader.

## Verification

Backend: `docker compose up -d && ./mvnw quarkus:dev` (Postgres 5436, API 8080).
Frontend: `npm run dev` (5173; `vite.config.ts` proxies `/api` to 8080, so no CORS in dev).
`npm run build` is the only automated check in the frontend — there is no test runner — so every
item below must be exercised in the browser.

- **B1**: request a quote, price and send it from `/admin/quotes/:id`, open the emailed link (dev
  profile mocks the mailer — take the URL from the log), confirm the quote renders and approving
  moves its status.
- **A6**: submit the trade form, confirm the row appears in `/admin/trade-enquiries`.
- **A3**: check out as a guest and as a signed-in customer; confirm the order lands in
  `/admin/orders` attributed correctly, and that the total matches the server's, not `kenya.ts`'s.
- **A1/A2**: heart items while signed out, sign in, confirm they merge into `/account/saved`; place
  an order and confirm it appears in `/account/orders`.
- **A4/A5**: upload a photo in the console, confirm it survives a hard reload *in a different
  browser* and appears on the storefront product page.
- Backend regressions: `./mvnw test`.
