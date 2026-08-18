import { products } from '../data/catalogue'
import { swatch } from '../lib/swatch'
import { money } from '../lib/format'
import { ProductCard } from '../components/ProductCard'
import { Button, Container, SectionHeading, WhatsAppIcon, whatsappLink } from '../components/ui'

/**
 * Hoteliers, architects and property managers buy on volume, specs and terms
 * rather than on styling, so they get their own landing page: volume pricing,
 * contract specs and a trade account form.
 */
export function Trade() {
  const contract = products.filter((p) => p.rooms.includes('Hotel & hospitality'))

  return (
    <>
      <section className="bg-ink text-white">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-brand-400 uppercase">
              Trade &amp; contract
            </p>
            <h1 className="font-display text-4xl leading-[1.1] font-bold sm:text-5xl">
              Furnishing a hotel, lodge or development
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/75">
              We have supplied soft furnishings to properties from 12-room guesthouses to 200-key
              hotels. Contract-grade specs, volume pricing from 50 units, phased delivery to match
              your handover programme.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" href="#trade-account">
                Open a trade account
              </Button>
              <Button
                size="lg"
                variant="whatsapp"
                href={whatsappLink('Hello Kipekee, I am furnishing a property and would like trade pricing.')}
              >
                <WhatsAppIcon />
                Talk to a member of the team
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img src={swatch('plain', '#eae5db', 14)} alt="" className="aspect-square w-full rounded-2xl object-cover" />
            <img src={swatch('stripe', '#e8e4dc', 15)} alt="" className="mt-8 aspect-square w-full rounded-2xl object-cover" />
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Volume pricing"
            title="The more rooms, the better the rate"
            intro="Published bands, so you can budget before you talk to us. All prices exclude VAT for trade accounts."
          />
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { band: '1–49 units', discount: 'List price', note: 'Standard retail rate' },
              { band: '50–149 units', discount: '12% off', note: 'Net-30 terms available' },
              { band: '150–399 units', discount: '18% off', note: 'Free sample board', featured: true },
              { band: '400+ units', discount: '25% off', note: 'Named account manager' },
            ].map((tier) => (
              <div
                key={tier.band}
                className={`rounded-2xl border p-6 ${
                  tier.featured ? 'border-brand bg-brand-50' : 'border-line bg-white'
                }`}
              >
                <p className="text-[13px] font-medium text-muted">{tier.band}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{tier.discount}</p>
                <p className="mt-2 text-[13px] text-muted">{tier.note}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-shell py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Why properties reorder"
            title="Specified for service, not for a showroom"
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                h: '200 wash cycles',
                b: 'Our contract percale is rated and tested to 200 industrial cycles at 90°C, with under 2% shrinkage.',
              },
              {
                h: 'Published specs',
                b: 'Martindale rub counts, gsm, fibre content and wash ratings on every contract line, the numbers your QS needs.',
              },
              {
                h: 'Phased delivery',
                b: 'We hold your par stock and release it floor by floor to match your handover, so you are not storing linen on site.',
              },
              {
                h: 'Reorder continuity',
                b: 'We keep your specification on file. Reorders match the original dye lot as closely as the mill allows.',
              },
            ].map((x) => (
              <div key={x.h}>
                <h3 className="mb-2 font-display text-base font-semibold">{x.h}</h3>
                <p className="text-[14px] leading-relaxed text-muted">{x.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Contract range" title="Specified for hospitality" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {contract.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <section id="trade-account" className="scroll-mt-28 pb-14 sm:pb-20">
        <Container className="max-w-3xl">
          <div className="rounded-3xl border border-line p-6 sm:p-10">
            <SectionHeading
              center
              eyebrow="Trade account"
              title="Tell us about the project"
              intro="We'll come back within one working day with indicative pricing and a sample board."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Your name" placeholder="Jane Wanjiru" />
              <Input label="Company" placeholder="e.g. Serena Group" />
              <Input label="Email" type="email" placeholder="jane@company.co.ke" />
              <Input label="Phone" type="tel" placeholder="07XX XXX XXX" />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">You are a…</span>
                <select className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand">
                  <option>Hotel or lodge</option>
                  <option>Architect or interior designer</option>
                  <option>Property manager</option>
                  <option>Developer</option>
                  <option>Other</option>
                </select>
              </label>
              <Input label="Number of rooms / units" type="number" placeholder="e.g. 64" />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">What do you need?</span>
                <textarea
                  rows={4}
                  placeholder="e.g. Full soft furnishing package for a 64-room lodge in Naivasha, handover March 2027."
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
            </div>
            <div className="mt-6">
              <Button full size="lg">
                Request trade pricing
              </Button>
              <p className="mt-3 text-center text-[12px] text-muted">
                Minimum order for trade terms is {money(150000)}. Prototype form. Nothing is sent.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

function Input({
  label,
  placeholder,
  type = 'text',
}: {
  label: string
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}
