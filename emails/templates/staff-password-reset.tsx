import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Panel } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { color, text } from '../theme.ts'

/**
 * Data: staffName, resetUrl, expiresInMinutes, requestedFrom
 * Sent by: AdminPasswordResetService
 */
export default function StaffPasswordReset() {
  return (
    <Shell
      preview="Reset the password for your Kipekee workshop login"
      eyebrow="Workshop console"
      footNote="You are getting this because someone asked to reset the password on a Kipekee staff account."
    >
      <Text style={text.h1}>Set a new password</Text>
      <Text style={text.body}>
        Hi {v('staffName')}, someone asked to reset the password for your Kipekee workshop login.
        Use the button below and you will be back in within a minute.
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
          Nothing has changed yet, and your current password still works. You can ignore this
          message. If you keep getting it, tell whoever manages the console, because it means
          somebody knows your email address.
        </Text>
        <S t="#if requestedFrom" />
        <Text style={{ ...text.small, margin: '8px 0 0' }}>
          Requested from {v('requestedFrom')}.
        </Text>
        <S t="/if" />
      </Panel>
    </Shell>
  )
}
