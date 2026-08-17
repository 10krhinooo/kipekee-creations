import { Link } from 'react-router-dom'
import { categories, products, rooms } from '../data/catalogue'
import { swatch } from '../lib/swatch'
import { money } from '../lib/format'
import { ProductCard } from '../components/ProductCard'
import { Button, Container, SectionHeading, Stars, WhatsAppIcon, whatsappLink } from '../components/ui'

/* The four claims below are the ones Kipekee can actually keep. Generic
 * reassurance badges read as untrustworthy to a Kenyan shopper, so every one of
 * these is specific and checkable. */
const promises = [
  {
    title: 'Free measure & fit',
    body: 'We come to your window anywhere in Nairobi, measure, and fit the finished job.',
    icon: (
      <>
        <path d="M3 7h18v10H3z" />
        <path d="M7 7v3M11 7v4M15 7v3M19 7v4" />
      </>
    ),
  },
  {
    title: 'Sewn on Katani Road',
    body: 'Our own workshop, not an importer. Come and see the machines.',
    icon: (
      <>
        <path d="M3 21V9l9-6 9 6v12" />
        <path d="M9 21v-7h6v7" />
      </>
    ),
  },
  {
    title: 'Pay with M-Pesa',
    body: 'Buy Goods on checkout, or pay half now and half on fitting for custom work.',
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
  {
    title: '14-day returns',
    body: 'Ready-made stock back for a full refund, unused and in its packaging.',
    icon: (
      <>
        <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
  },
]

const steps = [
  {
    n: '01',
    title: 'Tell us the room',
    body: 'Send a photo on WhatsApp or add items to your quote list. No measurements needed yet.',
  },
  {
    n: '02',
    title: 'We measure, free',
    body: 'A fitter visits within 48 hours across Nairobi, or you follow our 3-step guide anywhere else.',
  },
  {
    n: '03',
    title: 'Fixed quote in 24 hours',
    body: 'Itemised, in writing, valid for 30 days. Nothing moves until you approve it.',
  },
  {
    n: '04',
    title: 'Sewn and fitted',
    body: 'Ten working days on average. We hang it, dress the folds and clear up.',
  },
]

const testimonials = [
  {
    quote:
      'They measured on Tuesday and fitted on Friday. The quote I approved is exactly what I paid, no extras at the door.',
    name: 'Wanjiru M.',
    role: 'Homeowner, Kileleshwa',
    rating: 5,
  },
  {
    quote:
      'We furnished 64 rooms through Kipekee. Two years on the par stock is still in rotation and we have reordered twice.',
    name: 'Procurement Lead',
    role: '64-room lodge, Naivasha',
    rating: 5,
  },
  {
    quote:
      'I specify their wrought iron on almost every residential job now. Solid bar, forged properly, and they hit the dates.',
    name: 'Michael A.',
    role: 'Architect, Karen',
    rating: 5,
  },
]

export function Home() {
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 4)
  const readyToShip = products.filter((p) => p.mode === 'buy' && p.leadTimeDays <= 1).slice(0, 4)

  return (
    <>
      {/* HERO. States what they do, for whom, and gives both audiences a next
          step, with a price on the page above the fold. */}
      <section className="relative overflow-hidden bg-shell">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div className="animate-rise">
            <h1 className="font-display text-4xl leading-[1.08] font-bold text-ink sm:text-5xl lg:text-[3.4rem]">
              Curtains made to your window.
              <span className="block text-brand">Decor made to your room.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              We sew made-to-measure curtains, blinds and canopies at our Katani Road workshop off
              Mombasa Road, and stock the cushions, fabrics and linen that finish the room. Homes,
              hotels and architects, since 2012.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/custom-curtains" size="lg">
                Book a free measure
              </Button>
              <Button to="/shop?mode=buy" size="lg" variant="outline">
                Shop ready-made
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm">
              <Stars rating={4.8} />
              <span className="text-muted">
                <strong className="text-ink">4.8</strong> from 340+ Nairobi customers
              </span>
            </div>
          </div>

          {/* A composed image cluster stands in for real photography. */}
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            <img
              src={swatch('damask', '#8d6f52', 1)}
              alt="Blockout curtains in warm sand"
              className="col-span-1 row-span-2 h-full w-full rounded-2xl object-cover shadow-lg"
            />
            <img
              src={swatch('embroidery', '#a11c20', 2)}
              alt="Embroidered cushion covers"
              className="aspect-square w-full rounded-2xl object-cover shadow-lg"
            />
            <img
              src={swatch('iron', '#3b3a38', 3)}
              alt="Hand-forged curtain rail"
              className="aspect-square w-full rounded-2xl object-cover shadow-lg"
            />

            <div className="absolute right-3 -bottom-5 rounded-xl border border-line bg-white px-4 py-3 shadow-xl sm:right-6">
              <p className="text-[11px] tracking-wide text-muted uppercase">Curtains from</p>
              <p className="font-display text-xl font-bold text-ink">
                {money(3200)}
                <span className="ml-1 text-[12px] font-normal text-muted">/ metre, fitted</span>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* PROMISES. Four specific, checkable commitments. */}
      <section className="border-y border-line bg-white">
        <Container className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => (
            <div key={p.title} className="flex gap-3.5">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-6 w-6 shrink-0 text-brand"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {p.icon}
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* SHOP BY ROOM, people shop for a room, not for "Household Accessories". */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Start here"
            title="Shop by room"
            intro="Tell us where it goes and we'll show you what works there, with the prices attached."
          />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {rooms.slice(0, 6).map((room, i) => (
              <Link
                key={room}
                to={`/shop?room=${encodeURIComponent(room)}`}
                className="group relative w-40 shrink-0 overflow-hidden rounded-2xl sm:w-auto"
              >
                <img
                  src={swatch(
                    (['damask', 'plain', 'stripe', 'ceramic', 'geometric', 'weave'] as const)[i],
                    ['#8d6f52', '#5c6b4c', '#4e7d8c', '#dcd6cc', '#b8763b', '#6f7f74'][i],
                    i,
                  )}
                  alt=""
                  className="aspect-3/4 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <span className="absolute right-3 bottom-3 left-3 text-[13px] leading-tight font-semibold text-white">
                  {room}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CATEGORY GRID, 8 grouped categories with a blurb and an honest mode label. */}
      <section className="bg-shell py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="The range"
            title="Everything we make and stock"
            intro="Half our catalogue is ready to ship today. The other half we cut to your window. Both are priced up front."
            action={
              <Button to="/shop" variant="outline">
                View all products
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                to={`/shop?category=${c.slug}`}
                className="group overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-16/10 overflow-hidden">
                  <img
                    src={swatch(c.pattern, c.accent, i + 4)}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-ink uppercase">
                    {c.mode === 'buy' ? 'Buy now' : 'Made to measure'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-[15px] font-semibold text-ink group-hover:text-brand">
                    {c.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* BEST SELLERS, with the price on every card. */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Most ordered"
            title="Our best sellers"
            intro="What Nairobi actually buys, with the price on the card."
            action={
              <Button to="/shop" variant="outline">
                Shop all
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </Container>
      </section>

      {/* MADE-TO-MEASURE PROCESS. Buying custom work is unfamiliar, so the
          steps and the cost of each are spelled out. */}
      <section className="bg-ink py-16 text-white sm:py-24">
        <Container>
          <div className="mb-12 max-w-2xl">
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-brand-400 uppercase">
              Made to measure
            </p>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              You don't need measurements to start
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Most people put off ordering curtains because they think they need to measure first.
              You don't. Send a photo, we do the rest, and nothing is charged until you approve a
              written quote.
            </p>
          </div>

          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="border-t border-white/15 pt-5">
                <span className="font-display text-2xl font-bold text-brand-400">{s.n}</span>
                <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap gap-3">
            <Button to="/custom-curtains" size="lg">
              Book a free measure
            </Button>
            <Button
              size="lg"
              variant="whatsapp"
              href={whatsappLink('Hello Kipekee, I would like a quote for curtains. Here is a photo of the room:')}
            >
              <WhatsAppIcon />
              Send a photo on WhatsApp
            </Button>
          </div>
        </Container>
      </section>

      {/* READY TO SHIP */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="In stock now"
            title="Ships today, delivered tomorrow"
            intro="Ordered before 2pm on a weekday? It leaves the workshop the same afternoon."
            action={
              <Button to="/shop?mode=buy" variant="outline">
                All ready-made
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {readyToShip.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i + 8} />
            ))}
          </div>
        </Container>
      </section>

      {/* TRADE BAND. Architects, hoteliers and property managers buy very
          differently from homeowners, so they get their own entry point. */}
      <section className="bg-sand py-14 sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              Trade &amp; contract
            </p>
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Furnishing a hotel, lodge or development?
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
              We hold trade terms for architects, interior designers, hoteliers and property
              managers: volume pricing from 50 units, net-30 accounts, sample boards on request and
              a named account manager for the whole job.
            </p>
            <ul className="mt-6 space-y-2.5 text-[15px]">
              {[
                'Volume pricing bands at 50, 150 and 400 units',
                'Contract-grade specs with Martindale and wash-cycle data',
                'Sample boards couriered anywhere in Kenya',
                'Phased delivery to match your handover programme',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/hotel-linen" size="lg" variant="dark">
                Open a trade account
              </Button>
              <Button to="/shop?category=hotel-linen" size="lg" variant="outline">
                See contract range
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img src={swatch('plain', '#eae5db', 11)} alt="" className="aspect-square w-full rounded-2xl object-cover" />
            <img src={swatch('stripe', '#e8e4dc', 12)} alt="" className="mt-8 aspect-square w-full rounded-2xl object-cover" />
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS. Proof from named customers in named places. */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Reviews" title="What our customers say" center />
          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-line bg-white p-6">
                <Stars rating={t.rating} />
                <blockquote className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <span className="block text-sm font-semibold text-ink">{t.name}</span>
                  <span className="block text-[13px] text-muted">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA. A low-commitment way in for anyone not ready to buy. */}
      <section className="pb-6">
        <Container>
          <div className="rounded-3xl bg-brand px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Not sure where to start?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/85">
              Send us a photo of the room. We'll come back with two or three options, an honest
              price for each, and no pressure to go ahead.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                variant="whatsapp"
                href={whatsappLink('Hello Kipekee, here is a photo of my room. What would you suggest?')}
              >
                <WhatsAppIcon />
                Send a photo
              </Button>
              <Button to="/contact" size="lg" variant="dark">
                Book a showroom visit
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
