import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Highlight, Panel } from '../components/Bits.tsx'
import { v } from '../qute.tsx'
import { color, font, text } from '../theme.ts'

/**
 * Data: recipientName, invitedBy, email, tempPassword, signInUrl, role
 * Sent by: StaffAdminService
 *
 * Carries a live credential, which is weaker than an invite link that sets a
 * password without one ever being sent. It is deliberate and mitigated: the
 * account can do nothing but change this password, so it is useful exactly
 * once. The copy says so, because somebody who knows why they are being pushed
 * to change it actually changes it.
 */
export default function StaffInvite() {
  return (
    <Shell
      preview="Your Kipekee workshop account is ready, with a temporary password"
      eyebrow="Workshop console"
      footNote="You are getting this because a Kipekee admin created a workshop account for this address."
    >
      <Text style={text.h1}>Your workshop account is ready</Text>
      <Text style={text.body}>
        Hi {v('recipientName')}, {v('invitedBy')} has set you up on the Kipekee workshop console as{' '}
        {v('role')}. Sign in with the temporary password below.
      </Text>

      <Highlight label={`Sign in as ${v('email')}`} value={v('tempPassword')} />

      <Text style={{ ...text.small, margin: '-10px 0 20px' }}>
        Type it exactly. It avoids the characters people mix up, so there is no letter O or number
        one in it.
      </Text>

      <Cta href={v('signInUrl')}>Sign in and set your password</Cta>

      <Panel heading="You will have to change it straight away">
        <Text style={{ ...text.small, margin: 0 }}>
          This password only lets you do one thing: choose your own. Until you do, the rest of the
          console stays closed, so a temporary password cannot quietly become a permanent one.
        </Text>
      </Panel>

      <Panel heading="If you were not expecting this">
        <Text style={{ ...text.small, margin: 0 }}>
          Somebody may have used the wrong address. Tell{' '}
          <span style={{ color: color.inkSoft, fontFamily: font.body }}>{v('invitedBy')}</span> so
          the account can be removed, and do not sign in.
        </Text>
      </Panel>
    </Shell>
  )
}
