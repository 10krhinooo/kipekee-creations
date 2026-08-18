import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Highlight, Line, Panel } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { text } from '../theme.ts'

/**
 * Data: reference, customerName, phone, email, area, preferredTime,
 *       indicativeTotal, adminUrl, lines[{ productName, detail, windows, notes }]
 * Sent by: QuoteRequestResource, to the workshop inbox.
 *
 * Internal, so it leads with the phone number rather than a greeting: whoever
 * opens this is about to ring the customer, and that is the only thing they
 * need off the screen.
 */
export default function StaffNewQuote() {
  return (
    <Shell
      preview="New quote request to call back within one working day"
      eyebrow="New quote request"
      footNote="Internal notification from the Kipekee storefront. Nobody outside the workshop receives this."
    >
      <Text style={text.h1}>New quote request</Text>

      <Highlight
        label={`${v('customerName')} · ${v('area')}`}
        value={v('phone')}
        note={`${v('email')} · prefers ${v('preferredTime')}`}
      />

      <Text style={text.h2}>Reference {v('reference')}</Text>
      <S t="#for line in lines" />
      <Line
        title={v('line.productName')}
        detail={v('line.detail')}
        amount={v('line.windows')}
        note={v('line.notes')}
      />
      <S t="/for" />

      <Panel heading="Indicative total from the site">
        <Text style={{ ...text.small, margin: 0 }}>
          {v('indicativeTotal')}, calculated from whatever sizes the customer entered. Treat it as a
          hint about job size, not a price.
        </Text>
      </Panel>

      <Cta href={v('adminUrl')}>Open in the workshop console</Cta>
    </Shell>
  )
}
