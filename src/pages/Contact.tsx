import { useState } from 'react'
import { Button, Container, MAP_URL, WhatsAppIcon, cx, whatsappLink } from '../components/ui'
import { isValidEmail, isValidKenyanPhone } from '../lib/validate'
import { post } from '../lib/api'

export function Contact() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('Book a free window measure')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState({ name: false, phone: false, email: false, message: false })
  const touch = (field: keyof typeof touched) => setTouched((t) => ({ ...t, [field]: true }))
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const nameError = touched.name && !name.trim() ? 'Enter your name' : undefined
  const phoneError =
    touched.phone && !isValidKenyanPhone(phone)
      ? phone.trim()
        ? 'Enter a valid Kenyan phone number, e.g. 07XX XXX XXX'
        : 'Enter your phone number'
      : undefined
  const emailError =
    touched.email && !isValidEmail(email)
      ? email.trim()
        ? 'Enter a valid email address'
        : 'Enter your email address so we can reply'
      : undefined
  const messageError = touched.message && !message.trim() ? 'Tell us what you need' : undefined
  const canSend = name.trim() !== '' && isValidEmail(email) && message.trim() !== ''

  const sendMessage = async () => {
    setTouched({ name: true, phone: true, email: true, message: true })
    if (!canSend || sending) return

    setSendError(null)
    setSending(true)
    const result = await post('/api/contact', {
      name,
      email,
      phone: phone.trim() || null,
      topic,
      message,
    })
    setSending(false)

    if (result.ok) setSent(true)
    else setSendError(result.message)
  }

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
              <Input
                label="Your name"
                placeholder="Jane Wanjiru"
                value={name}
                onChange={setName}
                onBlur={() => touch('name')}
                error={nameError}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={setPhone}
                onBlur={() => touch('phone')}
                error={phoneError}
              />
              <Input
                label="Email"
                type="email"
                placeholder="jane@example.com"
                className="sm:col-span-2"
                value={email}
                onChange={setEmail}
                onBlur={() => touch('email')}
                error={emailError}
              />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">What's this about?</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
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
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onBlur={() => touch('message')}
                  aria-invalid={!!messageError}
                  placeholder="Tell us about the room, the window, or what you're looking for."
                  className={cx(
                    'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-brand',
                    messageError ? 'border-red-400' : 'border-line',
                  )}
                />
                {messageError && (
                  <span className="mt-1 block text-[12px] text-red-600">{messageError}</span>
                )}
              </label>
            </div>
            {sent ? (
              <div className="mt-5 rounded-xl bg-[#e8f5ec] px-4 py-4 text-center">
                <p className="font-display text-[15px] font-semibold text-[#1a6b39]">
                  Message sent
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  We have emailed you a copy and will reply within one working day.
                </p>
              </div>
            ) : (
              <>
                <Button full size="lg" className="mt-5" disabled={sending} onClick={sendMessage}>
                  {sending ? 'Sending…' : 'Send message'}
                </Button>
                {sendError && (
                  <p role="alert" className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-center text-[12.5px] leading-relaxed text-brand-700">
                    {sendError}
                  </p>
                )}
                <p className="mt-3 text-center text-[12px] text-muted">
                  We reply within one working day.
                </p>
              </>
            )}
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
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string
  placeholder?: string
  type?: string
  className?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  error?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        className={cx(
          'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-brand',
          error ? 'border-red-400' : 'border-line',
        )}
      />
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  )
}
