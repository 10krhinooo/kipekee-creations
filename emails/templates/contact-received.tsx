import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Panel } from '../components/Bits.tsx'
import { v } from '../qute.tsx'
import { color, text } from '../theme.ts'

/**
 * Data: customerName, topic, message
 * Sent by: ContactResource, to the person who filled the form.
 */
export default function ContactReceived() {
  return (
    <Shell
      preview="We have your message and will reply within one working day"
      eyebrow="Message received"
      footNote="You are getting this because you sent a message through the contact form on kipekeecreations.co.ke."
    >
      <Text style={text.h1}>We have your message</Text>
      <Text style={text.body}>
        Thanks {v('customerName')}. Someone will reply within one working day. If it is urgent,
        WhatsApp is faster than email and we usually answer within the hour during working hours.
      </Text>

      <Panel heading={`About: ${v('topic')}`}>
        <Text
          style={{
            ...text.small,
            margin: 0,
            color: color.inkSoft,
            whiteSpace: 'pre-wrap',
          }}
        >
          {v('message')}
        </Text>
      </Panel>

      <Text style={text.small}>
        This is a copy of what you sent us, so you have it for your own records. You do not need to
        do anything.
      </Text>
    </Shell>
  )
}
