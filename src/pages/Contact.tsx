import { Button, Container, MAP_URL, WhatsAppIcon, whatsappLink } from '../components/ui'

export function Contact() {
  return (
    <Container className="py-8 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Get in touch</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          WhatsApp is the fastest way to reach us. We usually reply within the hour during working
          hours. Or come to the showroom on Katani Road, off Mombasa Road, and handle the fabrics yourself.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line p-5">
            <h2 className="mb-4 font-display text-base font-semibold">Talk to us</h2>
            <ul className="space-y-4 text-sm">
              <li>
                <span className="block text-[12px] tracking-wide text-muted uppercase">WhatsApp</span>
                <a
                  href={whatsappLink('Hello Kipekee,')}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand hover:underline"
                >
                  0721 527 797
                </a>
              </li>
              <li>
                <span className="block text-[12px] tracking-wide text-muted uppercase">Phone</span>
                <a href="tel:+254721527797" className="block font-medium hover:text-brand">
                  0721 527 797
                </a>
                <a href="tel:+254722771321" className="block font-medium hover:text-brand">
                  0722 771 321
                </a>
              </li>
              <li>
                <span className="block text-[12px] tracking-wide text-muted uppercase">Email</span>
                <a
                  href="mailto:info@kipekeecreations.co.ke"
                  className="font-medium break-all hover:text-brand"
                >
                  info@kipekeecreations.co.ke
                </a>
              </li>
              <li>
                <span className="block text-[12px] tracking-wide text-muted uppercase">Showroom</span>
                <p className="font-medium">Katani Road, off Mombasa Road, Nairobi</p>
                <p className="mt-1 text-muted">Mon–Fri 8.30am–5.30pm</p>
                <p className="text-muted">Sat 9am–3pm · Sun closed</p>
              </li>
            </ul>
            <Button
              full
              variant="whatsapp"
              className="mt-5"
              href={whatsappLink('Hello Kipekee, I have a question.')}
            >
              <WhatsAppIcon />
              Start a WhatsApp chat
            </Button>
          </div>

          <div className="rounded-2xl bg-shell p-5">
            <h2 className="mb-2 font-display text-base font-semibold">Delivery &amp; returns</h2>
            <ul className="space-y-2 text-[14px] leading-relaxed text-muted">
              <li>Next-day delivery across Nairobi, free over KSh 10,000.</li>
              <li>2–4 working days to the rest of Kenya by courier.</li>
              <li>14-day returns on unused ready-made stock.</li>
              <li>Made-to-measure work is remade free if we measured it wrong.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line p-6 sm:p-8">
            <h2 className="mb-5 font-display text-lg font-semibold">Send us a message</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Your name" placeholder="Jane Wanjiru" />
              <Input label="Phone" type="tel" placeholder="07XX XXX XXX" />
              <Input label="Email" type="email" placeholder="jane@example.com" className="sm:col-span-2" />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">What's this about?</span>
                <select className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand">
                  <option>Book a free window measure</option>
                  <option>Quote for made-to-measure curtains</option>
                  <option>Question about an order</option>
                  <option>Trade or hotel pricing</option>
                  <option>Visit the showroom</option>
                  <option>Something else</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">Message</span>
                <textarea
                  rows={5}
                  placeholder="Tell us about the room, the window, or what you're looking for."
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
            </div>
            <Button full size="lg" className="mt-5">
              Send message
            </Button>
            <p className="mt-3 text-center text-[12px] text-muted">
              We reply within one working day. Prototype form. Nothing is sent.
            </p>
          </div>

          {/* The address is a link, so a visitor gets directions in one tap. */}
          <a
            href={MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="flex aspect-21/9 items-center justify-center rounded-2xl border border-line bg-sand transition-colors hover:border-brand"
          >
            <div className="text-center">
              <svg
                viewBox="0 0 24 24"
                className="mx-auto mb-2 h-8 w-8 text-brand"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <p className="text-sm font-medium">Katani Road, off Mombasa Road, Nairobi</p>
              <p className="text-[13px] text-brand underline">Open in Google Maps</p>
            </div>
          </a>
        </div>
      </div>
    </Container>
  )
}

function Input({
  label,
  placeholder,
  type = 'text',
  className = '',
}: {
  label: string
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}
