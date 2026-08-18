import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Highlight, Line, Panel } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { text } from '../theme.ts'

/**
 * Data: customerName, reference, indicativeTotal, area,
 *       lines[{ productName, colour, room, size, windows, notes }]
 * Sent by: QuoteRequestResource, to the customer.
 */
export default function QuoteRequestReceived() {
  return (
    <Shell
      preview="We have your measurements. A fitter will call within one working day."
      eyebrow="Made to measure"
      footNote="You are getting this because you requested a quote on kipekeecreations.co.ke."
    >
      <Text style={text.h1}>Your quote request is in</Text>
      <Text style={text.body}>
        Thank you {v('customerName')}. One of our fitters will call you within one working day to
        confirm the details and book your free measure. Nothing is charged until you approve the
        written quote.
      </Text>

      <Highlight
        label="Your reference"
        value={v('reference')}
        note="Quote this on WhatsApp or on the phone and we will find you straight away."
      />

      <Text style={text.h2}>What you asked us to price</Text>
      <S t="#for line in lines" />
      <Line
        title={v('line.productName')}
        detail={v('line.detail')}
        amount={v('line.windows')}
        note={v('line.notes')}
      />
      <S t="/for" />

      <Panel heading="Indicative total">
        <Text style={{ ...text.body, margin: 0, fontWeight: 600 }}>{v('indicativeTotal')}</Text>
        <Text style={{ ...text.small, margin: '6px 0 0' }}>
          A rough figure from the sizes you entered, not a quote. The written quote is the real
          number, and it will never be higher than what you approve.
        </Text>
      </Panel>

      <Panel heading="What happens next">
        <Text style={{ ...text.small, margin: 0 }}>
          1. We call to confirm the job and agree a time.
          <br />
          2. A fitter measures on site, free, anywhere in Nairobi.
          <br />
          3. You get an itemised written quote, valid 30 days.
          <br />
          4. Pay half on approval, half on fitting.
        </Text>
        <S t="#if area" />
        <Text style={{ ...text.small, margin: '8px 0 0' }}>
          We have you down as being in {v('area')}.
        </Text>
        <S t="/if" />
      </Panel>
    </Shell>
  )
}
