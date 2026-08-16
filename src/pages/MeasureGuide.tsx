import { useState } from 'react'
import { money } from '../lib/format'
import { Button, Container, SectionHeading, WhatsAppIcon, cx, whatsappLink } from '../components/ui'

/**
 * A measuring guide with a live calculator. This is the highest-intent content
 * on the site: someone measuring their window has already decided to buy.
 */
export function MeasureGuide() {
  const [width, setWidth] = useState(220)
  const [drop, setDrop] = useState(240)
  const [fullness, setFullness] = useState(2.2)
  const [rate, setRate] = useState(3200)

  const trackWidth = width + 30 // rails overhang the window by 15 cm each side
  const fabricMetres = (trackWidth * fullness) / 100
  const estimate = Math.round((trackWidth / 100) * rate)

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          Measuring guide
        </p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          How to measure a window in three minutes
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted">
          You only need a steel tape and a second pair of hands. If you'd rather not, we measure
          free anywhere in Nairobi, but here's how it works so you know what you're buying.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          {[
            {
              n: '01',
              title: 'Measure the track, not the glass',
              body: 'Your rail should extend 15 cm past the window on each side so the curtains stack off the glass and let full light in when open. Measure the rail if you have one; if not, measure the window and add 30 cm.',
              tip: 'Use a steel tape, not a fabric one. Cloth tapes stretch and you will be 2–3 cm out.',
            },
            {
              n: '02',
              title: 'Decide your drop',
              body: 'Sill length stops 1 cm above the sill. Below-sill hangs 15 cm past it. Floor length stops 1 cm off the floor. Measure from the top of the rail, or from the eyelet ring if you are using eyelets, straight down.',
              tip: 'Floor length nearly always looks better, even on a short window. It is the single easiest way to make a room feel taller.',
            },
            {
              n: '03',
              title: 'Check the wall is square',
              body: 'Measure the drop at the left, centre and right. Older Nairobi builds are often 2–4 cm out across a wide window. Send us all three numbers and we cut to the shortest so the hem still runs level.',
              tip: 'If the three numbers differ by more than 5 cm, book the free measure. We will fix it with the rail position.',
            },
            {
              n: '04',
              title: 'Send it to us',
              body: 'Width, the three drops, and a photo of the window with the tape in shot. That is everything we need to quote properly.',
              tip: 'Photograph in daylight with the curtains open. It tells us about the light, the wall and the existing fittings all at once.',
            },
          ].map((step) => (
            <section key={step.n} className="flex gap-5">
              <span className="font-display text-2xl font-bold text-brand">{step.n}</span>
              <div>
                <h2 className="font-display text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{step.body}</p>
                <p className="mt-3 rounded-lg border-l-2 border-brand bg-shell px-4 py-2.5 text-[14px] leading-relaxed text-muted">
                  <strong className="text-ink">Tip:</strong> {step.tip}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* Live calculator */}
        <aside className="h-fit lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-shell p-6">
            <h2 className="mb-1 font-display text-lg font-semibold">Estimate your window</h2>
            <p className="mb-5 text-[13px] leading-relaxed text-muted">
              Rough figures to help you plan. Your written quote is the real price.
            </p>

            <div className="space-y-5">
              <Slider
                label="Window width"
                value={width}
                min={60}
                max={500}
                step={5}
                unit="cm"
                onChange={setWidth}
              />
              <Slider
                label="Drop"
                value={drop}
                min={80}
                max={340}
                step={5}
                unit="cm"
                onChange={setDrop}
              />

              <div>
                <p className="mb-2 text-[13px] font-medium">Fullness</p>
                <div className="flex gap-2">
                  {[
                    { v: 1.8, l: 'Light' },
                    { v: 2.2, l: 'Standard' },
                    { v: 2.5, l: 'Luxury' },
                  ].map((f) => (
                    <button
                      key={f.v}
                      onClick={() => setFullness(f.v)}
                      className={cx(
                        'flex-1 rounded-lg border px-3 py-2 text-[13px] transition-colors',
                        fullness === f.v
                          ? 'border-brand bg-white text-brand'
                          : 'border-line hover:border-ink/25',
                      )}
                    >
                      {f.l}
                      <span className="block text-[11px] text-muted">{f.v}×</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[13px] font-medium">Curtain type</p>
                <div className="space-y-1.5">
                  {[
                    { v: 1850, l: 'Sheer voile' },
                    { v: 3200, l: 'Lined blockout' },
                    { v: 4100, l: 'Velvet, lined' },
                  ].map((t) => (
                    <label
                      key={t.v}
                      className="flex cursor-pointer items-center gap-2.5 text-[14px]"
                    >
                      <input
                        type="radio"
                        checked={rate === t.v}
                        onChange={() => setRate(t.v)}
                        className="h-4 w-4 accent-[#a11c20]"
                      />
                      <span className="flex-1">{t.l}</span>
                      <span className="text-[12px] text-muted">{money(t.v)}/m</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <Row label="Track width needed" value={`${trackWidth} cm`} />
              <Row label="Fabric required" value={`${fabricMetres.toFixed(1)} m`} />
              <Row label="Finished drop" value={`${drop} cm`} />
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[12px] text-muted">Indicative, fitted</p>
                <p className="font-display text-3xl font-bold text-ink">~{money(estimate)}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Button
                full
                size="lg"
                variant="whatsapp"
                href={whatsappLink(
                  `Hello Kipekee, my window is ${width} cm wide with a ${drop} cm drop. I am looking at lined curtains. Can you quote?`,
                )}
              >
                <WhatsAppIcon />
                Send these numbers
              </Button>
              <Button full variant="outline" to="/shop?mode=quote">
                Browse fabrics
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-16 rounded-3xl bg-ink px-6 py-12 text-center text-white sm:px-12">
        <SectionHeading
          center
          eyebrow="Or skip all of this"
          title="We'll measure it for you, free"
        />
        <p className="mx-auto -mt-4 mb-8 max-w-xl text-[15px] leading-relaxed text-white/70">
          A fitter comes to you within 48 hours anywhere in Nairobi, with the fabric books, and
          measures every window in the house. There is no charge and no obligation.
        </p>
        <Button
          size="lg"
          href={whatsappLink('Hello Kipekee, I would like to book a free window measure.')}
        >
          Book a free measure
        </Button>
      </section>
    </Container>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="font-display text-sm font-semibold">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#a11c20]"
        aria-label={label}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
