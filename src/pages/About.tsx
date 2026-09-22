import { Photo } from '../components/Photo'
import { Button, Container, SectionHeading, WhatsAppIcon, whatsappLink } from '../components/ui'
import { useSeo } from '../lib/seo'

export function About() {

  useSeo({
    title: 'About the workshop | Kipekee Creations',
    description:
      'Cutting and sewing soft furnishings on Katani Road, Nairobi, since 2012. Everything made to measure is made by our own team, on our own machines.',
    path: '/about',
    image: '/photos/workshop-1-1600.jpg',
  })

  return (
    <>
      <section className="bg-shell">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              About us
            </p>
            <h1 className="font-display text-4xl leading-[1.1] font-bold text-ink sm:text-5xl">
              We are a workshop, not an importer
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Kipekee Creations has been cutting and sewing soft furnishings on Katani Road, off Mombasa Road, since
              2012. Everything made-to-measure that we sell is made by our own team, on our own
              machines, and hung by the people who sewed it.
            </p>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              That matters for one practical reason: when something is wrong, there is no supply
              chain to blame. We remake it.
            </p>
          </div>
          {/* The workshop, not a pattern render. The page claims "we make it
              ourselves", and that claim is only worth making if you can see the
              machines. */}
          <div className="grid grid-cols-2 gap-4">
            <Photo
              name="workshop-1"
              aspect={16 / 10}
              className="col-span-2 rounded-2xl"
              sizes="(min-width: 1024px) 44vw, 92vw"
            />
            <Photo
              name="workshop-2"
              aspect={1}
              className="rounded-2xl"
              sizes="(min-width: 1024px) 22vw, 45vw"
            />
            <Photo
              name="embroidered-sheer-fabric-2"
              aspect={1}
              className="rounded-2xl"
              sizes="(min-width: 1024px) 22vw, 45vw"
            />
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '2012', l: 'Sewing on Katani Road' },
              { n: '340+', l: 'Homes fitted in Nairobi' },
              { n: '28', l: 'Hospitality properties supplied' },
              { n: '10 days', l: 'Average made-to-measure turnaround' },
            ].map((stat) => (
              <div key={stat.l} className="border-t-2 border-brand pt-5">
                <p className="font-display text-3xl font-bold text-ink">{stat.n}</p>
                <p className="mt-1 text-[14px] text-muted-foreground">{stat.l}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-sand py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="How we work"
            title="Four things we hold ourselves to"
            intro="Not slogans. These are the specific promises we make on every job, and what happens when we miss them."
          />
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              {
                h: 'The quote is the price',
                b: 'Written, itemised, valid 30 days. If we underestimated the fabric, that is our problem, not a variation on your invoice.',
              },
              {
                h: 'The date is the date',
                b: 'We give you a fitting date before you commit. If we miss it, the fitting is free.',
              },
              {
                h: 'If we measured it, we own it',
                b: 'Our fitter measured and it does not fit? We remake it at our cost, no argument.',
              },
              {
                h: 'You can come and look',
                b: 'The workshop is open Monday to Saturday. Come and watch your curtains being sewn if you want to.',
              },
            ].map((v) => (
              <div key={v.h} className="rounded-2xl bg-white p-6">
                <h3 className="font-display text-lg font-semibold">{v.h}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{v.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl text-center">
          <SectionHeading center eyebrow="Who we work with" title="Homes, hotels and the people who design them" />
          <p className="-mt-4 text-[16px] leading-relaxed text-muted-foreground">
            About half our work is private homes across Nairobi, one room at a time, or a whole
            house at handover. The other half is contract: lodges, guesthouses and hotels from the
            coast to Naivasha, and the architects and property managers who specify for them.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/custom-curtains" size="lg">
              Book a free measure
            </Button>
            <Button to="/hotel-linen" size="lg" variant="outline">
              Trade &amp; contract
            </Button>
            <Button
              size="lg"
              variant="whatsapp"
              href={whatsappLink('Hello Kipekee, I would like to visit the showroom.')}
            >
              <WhatsAppIcon />
              Visit the showroom
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}
