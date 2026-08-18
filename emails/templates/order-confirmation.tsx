import { Section, Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Highlight, Line, Panel, Total } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { text } from '../theme.ts'

/**
 * Data: customerName, reference, placedOn, subtotal, delivery, total,
 *       paymentMethod, deliveryName, deliveryAddress, county, deliveryEstimate,
 *       lines[{ productName, detail, qty, amount }]
 * Sent by: OrderEmailResource, to the customer at checkout.
 */
export default function OrderConfirmation() {
  return (
    <Shell
      preview="We have your order. Here is what is coming and when."
      eyebrow="Order confirmed"
      footNote="You are getting this because you placed an order on kipekeecreations.co.ke."
    >
      <Text style={text.h1}>Thank you, your order is in</Text>
      <Text style={text.body}>
        Hi {v('customerName')}, we have your order and we are packing it now. Here is everything on
        it, so you can check it before it leaves us.
      </Text>

      <Highlight
        label={`Order ${v('reference')} · placed ${v('placedOn')}`}
        value={v('deliveryEstimate')}
        tone="good"
        note={`Paying by ${v('paymentMethod')}.`}
      />

      <Text style={text.h2}>What you ordered</Text>
      <S t="#for line in lines" />
      <Line title={v('line.productName')} detail={v('line.detail')} amount={v('line.amount')} />
      <S t="/for" />

      <Section style={{ borderTop: `2px solid #17181a`, paddingTop: '14px', margin: '4px 0 22px' }}>
        <Total label="Subtotal" value={v('subtotal')} />
        <Total label="Delivery" value={v('delivery')} />
        <Total label="Total" value={v('total')} strong />
      </Section>

      <Panel heading="Delivering to">
        <Text style={{ ...text.small, margin: 0 }}>
          {v('deliveryName')}
          <br />
          {v('deliveryAddress')}
          <br />
          {v('county')}
        </Text>
      </Panel>

      <Panel heading="Something not right?">
        <Text style={{ ...text.small, margin: 0 }}>
          Reply to this email or message us on WhatsApp with reference {v('reference')} and we will
          fix it before it ships. Ready-made stock can be returned unused within 14 days.
        </Text>
      </Panel>
    </Shell>
  )
}
