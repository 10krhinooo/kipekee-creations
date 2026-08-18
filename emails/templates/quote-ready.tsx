import { Section, Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Highlight, Line, Panel, Total } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { text } from '../theme.ts'

/**
 * Data: customerName, reference, validUntil, subtotal, fitting, total,
 *       approveUrl, notes, lines[{ description, detail, amount }]
 * Sent by: QuoteResource, from the admin console once a quote is priced.
 */
export default function QuoteReady() {
  return (
    <Shell
      preview="Your written quote from Kipekee Creations is ready"
      eyebrow="Your written quote"
      footNote="You are getting this because you asked Kipekee Creations to quote for work."
    >
      <Text style={text.h1}>Your quote is ready</Text>
      <Text style={text.body}>
        Hi {v('customerName')}, here is the itemised quote for the work we measured. It is a fixed
        price, and nothing is charged until you approve it.
      </Text>

      <Highlight
        label={`Quote ${v('reference')} · valid until ${v('validUntil')}`}
        value={v('total')}
        note="Fitting across Nairobi is included in this price."
      />

      <Text style={text.h2}>What is included</Text>
      <S t="#for line in lines" />
      <Line title={v('line.description')} detail={v('line.detail')} amount={v('line.amount')} />
      <S t="/for" />

      <Section style={{ borderTop: `2px solid #17181a`, paddingTop: '14px', margin: '4px 0 22px' }}>
        <Total label="Subtotal" value={v('subtotal')} />
        <Total label="Fitting" value={v('fitting')} />
        <Total label="Total" value={v('total')} strong />
      </Section>

      <Cta href={v('approveUrl')}>Approve this quote</Cta>

      <S t="#if notes" />
      <Panel heading="A note from the workshop">
        <Text style={{ ...text.small, margin: 0 }}>{v('notes')}</Text>
      </Panel>
      <S t="/if" />

      <Panel heading="How payment works">
        <Text style={{ ...text.small, margin: 0 }}>
          Half on approval, half on fitting. If we measured it wrong, we remake it free. Prefer to
          talk it through first? Reply to this email or message us on WhatsApp with reference{' '}
          {v('reference')}.
        </Text>
      </Panel>
    </Shell>
  )
}
