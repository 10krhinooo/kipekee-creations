import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Panel } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { color, text } from '../theme.ts'

/**
 * Data: recipientName, resetUrl, expiresInMinutes, requestedFrom
 * Sent by: PasswordResetService
 *
 * One template for both audiences. Staff and customers reset a password the
 * same way, and a second near-identical template would only be somewhere for
 * the wording to drift, so nothing here says which kind of account it is.
 */
export default function PasswordReset() {
  return (
    <Shell
      preview="Reset the password for your Kipekee account"
      eyebrow="Account security"
      footNote="You are getting this because someone asked to reset the password on a Kipekee account with this address."
    >
      <Text style={text.h1}>Set a new password</Text>
      <Text style={text.body}>
        Hi {v('recipientName')}, someone asked to reset the password for your Kipekee account. Use
        the button below and you will be back in within a minute.
      </Text>

      <Cta href={v('resetUrl')}>Choose a new password</Cta>

      <Text style={text.small}>
        This link works once and expires in {v('expiresInMinutes')} minutes. If the button does not
        work, paste this into your browser:
        <br />
        <span style={{ color: color.inkSoft, wordBreak: 'break-all' }}>{v('resetUrl')}</span>
      </Text>

      <Panel heading="If this was not you">
        <Text style={{ ...text.small, margin: 0 }}>
          Nothing has changed yet, and your current password still works, so you can ignore this
          message. If you keep getting it, tell us, because it means somebody knows your email
          address.
        </Text>
        <S t="#if requestedFrom" />
        <Text style={{ ...text.small, margin: '8px 0 0' }}>Requested from {v('requestedFrom')}.</Text>
        <S t="/if" />
      </Panel>
    </Shell>
  )
}
