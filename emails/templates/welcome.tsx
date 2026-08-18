import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Panel } from '../components/Bits.tsx'
import { v } from '../qute.tsx'
import { text } from '../theme.ts'

/**
 * Data: recipientName, accountUrl, shopUrl
 * Sent by: AuthService, on registration.
 *
 * Leads with what the account is *for* rather than thanking somebody for
 * signing up. The people this matters to are the ones who reorder - a hotel
 * buying the same linen every quarter - and the reason to keep an account is
 * that it remembers the order and the address so they do not rebuild them.
 */
export default function Welcome() {
  return (
    <Shell
      preview="Your Kipekee account is ready"
      eyebrow="Welcome"
      footNote="You are getting this because an account was created with this address on kipekeecreations.co.ke."
    >
      <Text style={text.h1}>Your account is ready</Text>
      <Text style={text.body}>
        Welcome {v('recipientName')}. Your account keeps the things that are tedious to retype: past
        orders, the list you saved, and the addresses we deliver to.
      </Text>

      <Cta href={v('accountUrl')}>Open my account</Cta>

      <Panel heading="What it is good for">
        <Text style={{ ...text.small, margin: 0 }}>
          Reorder anything you have bought before in a couple of taps.
          <br />
          Your saved list follows you between your phone and a laptop.
          <br />
          Delivery addresses are remembered, including who signs for them.
          <br />
          Quotes and their measurements stay on file, so a repeat job starts from the last one.
        </Text>
      </Panel>

      <Text style={text.small}>
        You can still order as a guest whenever you prefer. Nothing about the shop requires signing
        in.{' '}
        <a href={v('shopUrl')} style={{ color: '#a11c20' }}>
          Browse the shop
        </a>
        .
      </Text>
    </Shell>
  )
}
