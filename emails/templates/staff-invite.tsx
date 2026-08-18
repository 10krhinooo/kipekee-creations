import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Panel } from '../components/Bits.tsx'
import { v } from '../qute.tsx'
import { color, font, text } from '../theme.ts'

/**
 * Data: recipientName, invitedBy, email, acceptUrl, role, expiresInDays
 * Sent by: PasswordLinkService, for StaffAdminService
 *
 * Carries a one-time link and no password. That is the point of the flow: the
 * account has nothing to sign in with until this link is followed, so an email
 * sitting in a mailbox somebody else can read is a link that can be revoked,
 * not a credential that already works.
 */
export default function StaffInvite() {
  return (
    <Shell
      preview="Set a password and your Kipekee workshop account is ready"
      eyebrow="Workshop console"
      footNote="You are getting this because a Kipekee admin created a workshop account for this address."
    >
      <Text style={text.h1}>Set up your workshop account</Text>
      <Text style={text.body}>
        Hi {v('recipientName')}, {v('invitedBy')} has set you up on the Kipekee workshop console as{' '}
        {v('role')}. Choose a password and you are in - there is no temporary one to type.
      </Text>

      <Cta href={v('acceptUrl')}>Choose your password</Cta>

      <Text style={text.small}>
        This link works once and expires in {v('expiresInDays')} days. If the button does not work,
        paste this into your browser:
        <br />
        <span style={{ color: color.inkSoft, wordBreak: 'break-all' }}>{v('acceptUrl')}</span>
      </Text>

      <Panel heading={`The account is for ${v('email')}`}>
        <Text style={{ ...text.small, margin: 0 }}>
          That is the address you will sign in with. If it is wrong, or this should have gone to a
          colleague, say so before you set a password rather than after.
        </Text>
      </Panel>

      <Panel heading="If you were not expecting this">
        <Text style={{ ...text.small, margin: 0 }}>
          Nothing has been set up that works yet - the account cannot be signed into until somebody
          follows this link. Tell{' '}
          <span style={{ color: color.inkSoft, fontFamily: font.body }}>{v('invitedBy')}</span> so it
          can be removed, and do not use the link.
        </Text>
      </Panel>
    </Shell>
  )
}
