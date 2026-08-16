import { Link } from 'react-router-dom'
import { products } from '../data/catalogue'
import { swatch } from '../lib/swatch'
import { money } from '../lib/format'
import { ProductCard } from '../components/ProductCard'
import {
  Button,
  Container,
  SectionHeading,
  WhatsAppIcon,
  whatsappLink,
} from '../components/ui'

const faqs = [
  {
    q: 'Do I need to measure before I contact you?',
    a: 'No. Send a photo of the window on WhatsApp and we will book a free measure. If you are outside Nairobi, our three-step guide takes about two minutes per window and we double-check the numbers before cutting.',
  },
  {
    q: 'How much does it actually cost?',
    a: `Blockout curtains start at ${money(3200)} per metre of track, fitted, and voiles at ${money(1850)}. A typical 220 cm sitting-room window with blockouts and a rail lands between ${money(9000)} and ${money(14000)} depending on the fabric you choose.`,
  },
  {
    q: 'How long does it take?',
    a: 'Ten working days on average from the day you approve the quote. We will tell you the exact date before you commit, and we hold ourselves to it. If we miss it, the fitting is free.',
  },
  {
    q: 'What if the measurements are wrong?',
    a: 'If our fitter measured, we remake it at our cost. If you measured, we will still remake it and only charge for the fabric. This is why we push the free measure so hard.',
  },
  {
    q: 'Can I see the fabric before committing?',
    a: `Yes. We post 15 × 15 cm cuttings anywhere in Kenya for ${money(200)}, refunded against your order. Or visit the Mombasa Road showroom and handle the full rolls.`,
  },
  {
    q: 'How do I pay?',
    a: 'Half on approval of the quote, half on the day of fitting. M-Pesa or bank transfer. Nothing at all is charged before you approve a written quote.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Send a photo',
    body: 'WhatsApp us a picture of the window, or add items to your quote list on the site. Takes thirty seconds and costs nothing.',
  },
  {
    n: '02',
    title: 'We measure, free',
    body: 'A fitter comes to you within 48 hours anywhere in Nairobi. They bring the fabric books so you can see the options against your own light.',
  },
  {
    n: '03',
    title: 'You get a written quote',
    body: 'Itemised down to the rail brackets, valid 30 days. Nothing moves and nothing is charged until you say yes.',
  },
  {
    n: '04',
    title: 'We sew it',
    body: 'Cut and sewn on Mombasa Road. Ten working days on average. You get a photo when it comes off the machine.',
  },
  {
    n: '05',
    title: 'We fit and dress it',
    body: 'We hang it, dress the folds so they set properly, and clear up. Pay the balance when you are happy with it.',
  },
]

export function CustomCurtains() {
  const madeToMeasure = products.filter((p) => p.mode === 'quote').slice(0, 4)

  return (
    <>
      <section className="bg-shell">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              Made to measure
            </p>
            <h1 className="font-display text-4xl leading-[1.1] font-bold text-ink sm:text-5xl">
              Curtains cut to your window, fitted by the people who sewed them
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Ready-made curtains are a compromise: too short, too narrow, and they never sit right.
              We measure your window, sew to it in our own workshop, and hang it ourselves. From{' '}
              {money(3200)} per metre of track, fitting included.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="whatsapp"
                href={whatsappLink(
                  'Hello Kipekee, I would like to book a free window measure. Here is a photo of the room:',
                )}
              >
                <WhatsAppIcon />
                Book a free measure
              </Button>
              <Button to="/shop?mode=quote" size="lg" variant="outline">
                Browse the range
              </Button>
            </div>
            <p className="mt-5 text-[13px] text-muted">
              Free across Nairobi · No obligation · Written quote in 1 working day
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img src={swatch('damask', '#8d6f52', 3)} alt="" className="row-span-2 h-full w-full rounded-2xl object-cover shadow-lg" />
            <img src={swatch('sheer', '#e6e2da', 6)} alt="" className="aspect-square w-full rounded-2xl object-cover shadow-lg" />
            <img src={swatch('iron', '#3b3a38', 7)} alt="" className="aspect-square w-full rounded-2xl object-cover shadow-lg" />
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="Five steps, and the first four cost you nothing"
            intro="The whole point is that you can find out exactly what it costs before you commit to anything."
          />
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s) => (
              <li key={s.n} className="border-t-2 border-brand pt-5">
                <span className="font-display text-2xl font-bold text-brand">{s.n}</span>
                <h3 className="mt-2 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-sand py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="What it costs"
            title="Honest starting prices"
            intro="Made-to-measure work varies by window, so these are the floor. Your quote confirms the real number before you pay anything."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Voiles & sheers',
                from: 1850,
                body: 'Daytime privacy without losing the light. Weighted hems as standard.',
              },
              {
                title: 'Lined blockouts',
                from: 3200,
                body: 'Triple-weave lining, 96% light blocked. Our most ordered product.',
                featured: true,
              },
              {
                title: 'Hand-forged rails',
                from: 2900,
                body: 'Solid 19 mm bar cut to your span, brackets and fitting included.',
              },
            ].map((tier) => (
              <div
                key={tier.title}
                className={`rounded-2xl border p-6 ${
                  tier.featured ? 'border-brand bg-white shadow-lg' : 'border-line bg-white'
                }`}
              >
                {tier.featured && (
                  <span className="mb-3 inline-block rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                    Most ordered
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold">{tier.title}</h3>
                <p className="mt-3 font-display text-3xl font-bold text-ink">
                  {money(tier.from)}
                  <span className="ml-1 text-[13px] font-normal text-muted">/ metre, fitted</span>
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{tier.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[13px] text-muted">
            Not sure what your window needs?{' '}
            <Link to="/measure-guide" className="text-brand underline">
              Read the measuring guide
            </Link>{' '}
            or just send us a photo.
          </p>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="The range"
            title="What we make to measure"
            action={
              <Button to="/shop?mode=quote" variant="outline">
                See all
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {madeToMeasure.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-14 sm:pb-20">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="Questions" title="The things people actually ask" center />
          <div className="divide-y divide-line rounded-2xl border border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
