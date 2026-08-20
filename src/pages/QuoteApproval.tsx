import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthProvider'
import { money } from '../lib/format'
import { Badge, Button, Container, SectionHeading, WHATSAPP, whatsappLink } from '../components/ui'

interface QuoteLineView {
  product: string
  colour: string | null
  room: string | null
  widthCm: number | null
  dropCm: number | null
  windows: number
  amount: number | null
}

interface CustomerQuoteView {
  reference: string
  customer: string
  phone: string
  email: string | null
  area: string | null
  status: string
  sentAt: string | null
  validUntil: string | null
  lines: QuoteLineView[]
  subtotal: number
  fitting: number
  discountPercent: number
  total: number
  depositDue: number
  depositPaid: boolean
  balancePaid: boolean
  approvedAt: string | null
}

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * The page behind the link in the "quote ready" email.
 *
 * Unauthenticated on purpose, matching `QuoteApprovalResource` on the backend:
 * the token in the query string is the credential, so there is no sign-in
 * here and nothing is cached beyond this render. A wrong or expired link is
 * told apart from "we cannot find that quote at all" because one has a next
 * step (ask for a fresh one) and the other does not.
 */
export function QuoteApproval() {
  const { reference = '' } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { user } = useAuth()

  const [quote, setQuote] = useState<CustomerQuoteView | null>(null)
  const [checked, setChecked] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  /**
   * Two ways to arrive here, and the difference is only what proves identity.
   *
   * From the emailed link, the token in the query string is the credential and
   * there is no session. From the account area there is no token, and the
   * session is. The backend has an endpoint for each, returning the same
   * projection, so the page is the same either way.
   */
  const load = useCallback(() => {
    if (!reference) {
      setChecked(true)
      setProblem('That link is missing something. Check it was copied in full from the email.')
      return
    }
    if (!token && !user) {
      setChecked(true)
      setProblem('That link is missing something. Check it was copied in full from the email.')
      return
    }
    setChecked(false)
    const path = token
      ? `/api/quote/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`
      : `/api/account/quotes/${encodeURIComponent(reference)}`

    api.get<CustomerQuoteView>(path).then((result) => {
      if (result.ok) {
        setQuote(result.data)
        setProblem(null)
      } else {
        setQuote(null)
        setProblem(result.message)
      }
      setChecked(true)
    })
  }, [reference, token, user])

  useEffect(() => {
    load()
  }, [load])

  const approve = async () => {
    setApproving(true)
    const result = await api.post<CustomerQuoteView>(
      `/api/quote/${encodeURIComponent(reference)}/approve?token=${encodeURIComponent(token)}`,
    )
    setApproving(false)
    if (result.ok) setQuote(result.data)
    else setProblem(result.message)
  }

  if (!checked) {
    return (
      <Container className="py-16 text-center text-[14px] text-muted">Loading your quote…</Container>
    )
  }

  if (!quote) {
    return (
      <Container className="max-w-lg py-16 text-center">
        <SectionHeading center eyebrow="Quote" title="We could not open that" />
        <p className="text-[14px] leading-relaxed text-muted">{problem}</p>
        <Button href={whatsappLink('Hi, I am trying to reach a quote you sent me but the link is not working.')} className="mt-6">
          Message us on WhatsApp
        </Button>
      </Container>
    )
  }

  const approved = quote.approvedAt !== null
  // Approving needs the token: that link is the customer's signature on the
  // figures, and the backend has no session-based approve. Read from the
  // account instead, the quote shows but the button does not.
  const canApprove = quote.status === 'sent' && !approved && Boolean(token)

  return (
    <Container className="max-w-2xl py-10 sm:py-14">
      <SectionHeading
        eyebrow={`Quote ${quote.reference}`}
        title={`For ${quote.customer}`}
        intro={
          quote.validUntil
            ? `Valid until ${dateFmt(quote.validUntil)}. Prices are held until then.`
            : undefined
        }
        action={
          approved ? (
            <Badge tone="quote">Approved</Badge>
          ) : quote.status === 'lost' ? (
            <Badge tone="neutral">Not proceeding</Badge>
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-shell text-[12px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Windows</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {quote.lines.map((line, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{line.product}</p>
                  <p className="text-[13px] text-muted">
                    {[line.room, line.colour, line.widthCm && line.dropCm ? `${line.widthCm}×${line.dropCm}cm` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted">{line.windows}</td>
                <td className="px-4 py-3 text-right">{line.amount !== null ? money(line.amount) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1.5 border-t border-line bg-shell px-4 py-4 text-[14px]">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{money(quote.subtotal)}</span>
          </div>
          {quote.fitting > 0 && (
            <div className="flex justify-between text-muted">
              <span>Fitting</span>
              <span>{money(quote.fitting)}</span>
            </div>
          )}
          {quote.discountPercent > 0 && (
            <div className="flex justify-between text-muted">
              <span>Discount</span>
              <span>-{quote.discountPercent}%</span>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
            <span>Total</span>
            <span>{money(quote.total)}</span>
          </div>
          {quote.depositDue > 0 && (
            <div className="flex justify-between text-muted">
              <span>Deposit due{quote.depositPaid ? ' (paid)' : ''}</span>
              <span>{money(quote.depositDue)}</span>
            </div>
          )}
        </div>
      </div>

      {problem && <p className="mt-4 text-[13px] text-brand">{problem}</p>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {canApprove && (
          <Button size="lg" onClick={approve} disabled={approving}>
            {approving ? 'Approving…' : 'Approve this quote'}
          </Button>
        )}
        {quote.status === 'sent' && !approved && !token && (
          <p className="text-[14px] text-muted">
            To approve this quote, open the link in the email we sent you.
          </p>
        )}
        {approved && (
          <p className="text-[14px] text-muted">
            Approved on {quote.approvedAt ? dateFmt(quote.approvedAt) : ''}. We will be in touch to book
            the fitting.
          </p>
        )}
        <Button
          variant="outline"
          href={whatsappLink(`Hi, about quote ${quote.reference} - `)}
        >
          Questions? Message us
        </Button>
      </div>

      <p className="mt-6 text-[12px] text-muted">
        Sent to {quote.phone}
        {quote.email ? ` and ${quote.email}` : ''}. Call or WhatsApp {WHATSAPP} if anything looks off.
      </p>
    </Container>
  )
}
