import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, products, rooms } from '../data/catalogue'
import type { Room } from '../data/types'
import { money } from '../lib/format'
import { ProductCard } from '../components/ProductCard'
import { Photo } from '../components/Photo'
import { Reveal } from '../components/Reveal'
import { RoomView } from '../components/preview/RoomView'
import {
  Button,
  Container,
  Eyebrow,
  SectionHeading,
  Stars,
  WhatsAppIcon,
  whatsappLink,
} from '../components/ui'
import { organisationJsonLd, useSeo } from '../lib/seo'

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

/**
 * A room to the photograph that stands for it, and a category to the product
 * shot that sells it best.
 *
 * Kept as data rather than an index into an array, because the old version
 * paired a room with whatever swatch happened to be sixth in a literal, and
 * reordering `rooms` in the catalogue silently reassigned every tile.
 */
const roomPhoto: Record<Room, string> = {
  'Living room': 'room-living-room',
  Bedroom: 'room-bedroom',
  Kitchen: 'room-kitchen',
  Bathroom: 'room-bathroom',
  'Kids room': 'room-kids-room',
  'Hotel & hospitality': 'room-hotel',
  Outdoor: 'room-outdoor',
}

const categoryPhoto: Record<string, string> = {
  curtains: 'kitenge-blockout-curtains-2',
  fabrics: 'velvet-upholstery-fabric-1',
  'cushion-covers': 'embroidered-cushion-cover-2',
  'hotel-linen': 'hotel-bed-linen-set-2',
  towels: 'egyptian-cotton-towel-set-1',
  household: 'woven-table-mats-2',
  'wrought-iron': 'wrought-iron-curtain-rail-2',
  'bed-canopies': 'four-poster-bed-canopy-2',
}

export function Home() {
  useSeo({
    title: 'Kipekee Creations | Curtains, Hotel Linen & Interior Decor, Nairobi',
    description:
      'Made-to-measure curtains, blinds and canopies from our Katani Road workshop, plus cushions, fabric and hotel linen. Free measure in Nairobi, delivery across Kenya.',
    path: '/',
    image: '/photos/hero-home-1600.jpg',
    jsonLd: organisationJsonLd,
  })

  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 4)
  const readyToShip = products.filter((p) => p.mode === 'buy' && p.leadTimeDays <= 1).slice(0, 4)

  return (
    <>
      <Hero />

      {/* PROMISES. Four specific, checkable commitments. */}
      <section className="border-b border-line bg-white">
        <Container className="grid gap-7 py-10 sm:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="font-ui text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* SHOP BY ROOM, people shop for a room, not for "Household Accessories". */}
      <section className="section">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Start here"
              title="Shop by room"
              intro="Tell us where it goes and we'll show you what works there, with the prices attached."
            />
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
              {rooms.slice(0, 6).map((room) => (
                <Link
                  key={room}
                  to={`/shop?room=${encodeURIComponent(room)}`}
                  className="group card-lift relative w-40 shrink-0 overflow-hidden rounded-media sm:w-auto"
                >
                  <Photo
                    name={roomPhoto[room]}
                    alt=""
                    aspect={3 / 4}
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 31vw, 160px"
                    className="w-full"
                    imgClassName="card-zoom"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                  <span className="absolute right-3 bottom-3 left-3 font-ui text-[13px] leading-tight font-semibold text-white">
                    {room}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <Visualiser />

      {/* CATEGORY GRID, 8 grouped categories with a blurb and an honest mode label. */}
      <section className="section bg-shell">
        <Container>
          <Reveal>
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/shop?category=${c.slug}`}
                  className="group card-lift overflow-hidden rounded-card border border-line bg-white"
                >
                  <div className="relative">
                    <Photo
                      name={categoryPhoto[c.slug]}
                      alt=""
                      aspect={16 / 10}
                      sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
                      tint={c.accent}
                      className="w-full"
                      imgClassName="card-zoom"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 font-ui text-eyebrow font-semibold text-ink uppercase backdrop-blur">
                      {c.mode === 'buy' ? 'Buy now' : 'Made to measure'}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-[17px] font-semibold text-ink transition-colors duration-200 group-hover:text-brand">
                      {c.name}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.blurb}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* BEST SELLERS, with the price on every card. */}
      <section className="section">
        <Container>
          <Reveal>
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
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {bestSellers.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* MADE-TO-MEASURE PROCESS. Buying custom work is unfamiliar, so the
          steps and the cost of each are spelled out. */}
      <section className="section bg-ink text-white">
        <Container>
          <Reveal>
            <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20">
              <div>
                <Eyebrow tone="light" className="mb-3 text-brand-400">
                  Made to measure
                </Eyebrow>
                <h2 className="text-display font-semibold">You don't need measurements to start</h2>
                <p className="mt-5 max-w-xl text-lede text-white/70">
                  Most people put off ordering curtains because they think they need to measure first.
                  You don't. Send a photo, we do the rest, and nothing is charged until you approve a
                  written quote.
                </p>

                <ol className="mt-12 grid gap-8 sm:grid-cols-2">
                  {steps.map((s) => (
                    <li key={s.n} className="border-t border-white/15 pt-5">
                      <span className="font-ui text-sm font-semibold tracking-[0.18em] text-brass">
                        {s.n}
                      </span>
                      <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
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
                    href={whatsappLink(
                      'Hello Kipekee, I would like a quote for curtains. Here is a photo of the room:',
                    )}
                  >
                    <WhatsAppIcon />
                    Send a photo on WhatsApp
                  </Button>
                </div>
              </div>

              {/* The workshop, because "sewn on Katani Road, not imported" is the
                  claim the whole made-to-measure offer rests on and a photograph
                  of a machinist carries it better than another icon would. */}
              <figure className="relative">
                <Photo
                  name="workshop-1"
                  aspect={4 / 5}
                  sizes="(min-width: 1024px) 38vw, 92vw"
                  className="w-full rounded-panel"
                />
                <figcaption className="absolute -bottom-5 left-5 right-12 rounded-card bg-white p-5 shadow-float">
                  <p className="eyebrow text-brand">Our workshop</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                    Katani Road, off Mombasa Road. Every curtain on this site is cut and sewn here.
                  </p>
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* READY TO SHIP */}
      <section className="section">
        <Container>
          <Reveal>
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
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {readyToShip.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i + 8} />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* TRADE BAND. Architects, hoteliers and property managers buy very
          differently from homeowners, so they get their own entry point. */}
      <section className="section bg-sand">
        {/* Two Reveals rather than one around the pair: a single wrapper here
            would become the grid's only child and collapse the two columns
            into one. Staggered so the copy leads and the photography follows. */}
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow className="mb-3">Trade &amp; contract</Eyebrow>
            <h2 className="text-display font-semibold text-ink">
              Furnishing a hotel, lodge or development?
            </h2>
            <p className="mt-5 max-w-lg text-lede text-ink-soft">
              We hold trade terms for architects, interior designers, hoteliers and property
              managers: volume pricing from 50 units, net-30 accounts, sample boards on request and
              a named account manager for the whole job.
            </p>
            <ul className="mt-7 space-y-3 text-[15px]">
              {[
                'Volume pricing bands at 50, 150 and 400 units',
                'Contract-grade specs with Martindale and wash-cycle data',
                'Sample boards couriered anywhere in Kenya',
                'Phased delivery to match your handover programme',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-1 h-4 w-4 shrink-0 text-brand"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/hotel-linen" size="lg" variant="dark">
                Open a trade account
              </Button>
              <Button to="/shop?category=hotel-linen" size="lg" variant="outline">
                See contract range
              </Button>
            </div>
          </Reveal>

          <Reveal index={1} className="grid grid-cols-5 gap-4">
            <Photo
              name="trade-hospitality"
              aspect={4 / 5}
              sizes="(min-width: 1024px) 28vw, 55vw"
              className="col-span-3 w-full rounded-panel"
            />
            <Photo
              name="hotel-bed-linen-set-1"
              aspect={4 / 5}
              sizes="(min-width: 1024px) 18vw, 37vw"
              className="col-span-2 mt-12 w-full rounded-panel"
            />
          </Reveal>
        </Container>
      </section>

      {/* TESTIMONIALS. Proof from named customers in named places. */}
      <section className="section">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="Reviews" title="What our customers say" center />
            <div className="grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="rounded-card border border-line bg-white p-7">
                  <Stars rating={t.rating} />
                  <blockquote className="mt-5 font-display text-[19px] leading-[1.5] text-ink">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 border-t border-line pt-5 font-ui">
                    <span className="block text-sm font-semibold text-ink">{t.name}</span>
                    <span className="block text-[13px] text-muted-foreground">{t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FINAL CTA. A low-commitment way in for anyone not ready to buy. */}
      <section className="pb-8">
        <Container>
          <Reveal>
            <div className="rounded-panel bg-brand px-6 py-14 text-center text-white sm:px-12 sm:py-20">
              <h2 className="text-display font-semibold">Not sure where to start?</h2>
              <p className="mx-auto mt-5 max-w-xl text-lede text-white/85">
                Send us a photo of the room. We'll come back with two or three options, an honest
                price for each, and no pressure to go ahead.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  variant="whatsapp"
                  href={whatsappLink(
                    'Hello Kipekee, here is a photo of my room. What would you suggest?',
                  )}
                >
                  <WhatsAppIcon />
                  Send a photo
                </Button>
                <Button to="/contact" size="lg" variant="dark">
                  Book a showroom visit
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}

/**
 * The hero.
 *
 * A photograph the width of the window, and the headline over it. The previous
 * version put three generated swatch tiles in a collage beside the copy, which
 * is what made a visitor's first impression "a prototype" rather than "a decor
 * brand". This is the single highest-leverage image on the site, so it is the
 * one and only `priority` photo on the page.
 */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Photo
        name="hero-home"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full"
        imgClassName="object-[center_35%]"
      />
      {/*
        Two overlays, not one. The horizontal gradient buys contrast for the
        copy on the left while leaving the right side of the room visible; the
        flat wash underneath guarantees the 4.5:1 the text needs even if the
        photograph is ever swapped for a brighter one.
      */}
      <div className="absolute inset-0 bg-ink/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />

      <Container className="relative py-24 sm:py-32 lg:py-40">
        <div className="max-w-2xl animate-rise">
          <Eyebrow tone="light" className="mb-5">
            Sewn in Nairobi since 2012
          </Eyebrow>

          <h1 className="text-hero font-semibold text-white">
            Curtains made to your window.
            <span className="mt-1 block text-brass">Decor made to your room.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lede text-white/80">
            Made-to-measure curtains, blinds and canopies from our Katani Road workshop, and the
            cushions, fabrics and linen that finish the room. Homes, hotels and architects.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/custom-curtains" size="lg">
              Book a free measure
            </Button>
            <Button to="/shop?mode=buy" size="lg" variant="outline">
              Shop ready-made
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <Stars rating={4.8} />
              <span className="font-ui text-sm text-white/70">
                <strong className="font-semibold text-white">4.8</strong> from 340+ Nairobi
                customers
              </span>
            </div>
            <p className="font-ui text-sm text-white/70">
              Curtains from{' '}
              <strong className="font-semibold text-white tabular">{money(3200)}</strong> a metre,
              fitted
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}

/**
 * "See it before you buy".
 *
 * The room visualiser, lifted out of the product page and onto the homepage.
 * It was buried behind a gallery tab, which meant the one thing on this site
 * that no competitor can copy in an afternoon was invisible to anyone who did
 * not click into a product. Curtains that open, and a room that goes from day
 * to night, are worth a section of their own.
 *
 * `RoomView` picks the 2D or 3D renderer at runtime, so this costs a phone
 * nothing extra: the window scene stays on the SVG tier either way.
 */
function Visualiser() {
  const [drawn, setDrawn] = useState(true)
  const [night, setNight] = useState(false)

  return (
    <section className="section bg-linen">
      <Container>
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow className="mb-3">Only here</Eyebrow>
              <h2 className="text-display font-semibold text-ink">See it before you buy</h2>
              <p className="mt-5 text-lede text-ink-soft">
                Every made-to-measure product on this site can be drawn in a room before you order
                it. Open and close the curtains, turn the daylight down to evening, change the colour
                and the heading, and see what actually arrives at your window.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant={drawn ? 'outline' : 'dark'}
                  onClick={() => setDrawn((d) => !d)}
                  aria-pressed={!drawn}
                >
                  {drawn ? 'Open the curtains' : 'Close the curtains'}
                </Button>
                <Button
                  variant={night ? 'dark' : 'outline'}
                  onClick={() => setNight((n) => !n)}
                  aria-pressed={night}
                >
                  {night ? 'Back to daylight' : 'See it at night'}
                </Button>
              </div>

              <p className="mt-6 font-ui text-[13px] text-muted-foreground">
                Live, not a video. It runs on the actual product data.
              </p>

              <div className="mt-8">
                <Button to="/product/kitenge-blockout-curtains" variant="ghost">
                  Open the full visualiser &rarr;
                </Button>
              </div>
            </div>

            {/*
              `aspect-4/5` is not a design choice, it is the scene's own viewBox
              (480x600). Match it and the SVG fills the panel exactly.

              Get it wrong and two things break at once: the scene pillarboxes,
              and the panel's own background becomes visible either side of it.
              That background is what produced the glitch on the day/night
              toggle, because a CSS colour transition on this box ran at its own
              speed while `RoomPreview` cross-faded the scene over `LIGHT_MS`,
              so the bars went dark about twice as fast as the room did. With the
              SVG filling the box there is no background left to see and no
              second transition to keep in step.
            */}
            <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-panel border border-line bg-sand shadow-card">
              <RoomView
                scene="window"
                variant="curtains"
                colour="#8d6f52"
                pattern="damask"
                heading="pencil"
                finial="ball"
                drawn={drawn}
                night={night}
                productSlug="kitenge-blockout-curtains"
                className="aspect-4/5"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
