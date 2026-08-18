import type { ReactNode } from 'react'
import { Body, Container, Font, Head, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import { color, font, text } from '../theme.ts'

/**
 * The frame every Kipekee email sits in.
 *
 * The site's own chrome, reduced to what email clients can actually be trusted
 * with: a dark ink band with the wordmark, a white sheet for the message, and a
 * footer carrying the details a Kenyan customer reaches for first. There is no
 * logo file yet, so the wordmark is type, exactly as it is in the site header.
 */

export const WHATSAPP = '254721527797'
const SHOWROOM = 'Katani Road, off Mombasa Road, Nairobi'

export function Shell({
  preview,
  eyebrow,
  children,
  footNote,
}: {
  /** The inbox preview line. Worth writing: it is the third thing read, after sender and subject. */
  preview: string
  eyebrow: string
  children: ReactNode
  /** Why this person is receiving this, which differs per template. */
  footNote: ReactNode
}) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Poppins"
          fallbackFontFamily="Verdana"
          webFont={{ url: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2', format: 'woff2' }}
          fontWeight={600}
          fontStyle="normal"
        />
        <Font
          fontFamily="Open Sans"
          fallbackFontFamily="Arial"
          webFont={{ url: 'https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-muw.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: color.shell, margin: 0, padding: '24px 0', fontFamily: font.body }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>
          <Section
            style={{
              backgroundColor: color.ink,
              borderRadius: '16px 16px 0 0',
              padding: '26px 28px 22px',
            }}
          >
            <Text
              style={{
                fontFamily: font.display,
                fontSize: '24px',
                lineHeight: '28px',
                fontWeight: 700,
                color: color.white,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Kipekee
            </Text>
            <Text
              style={{
                fontFamily: font.body,
                fontSize: '10px',
                lineHeight: '16px',
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: color.brand200,
                margin: '4px 0 0',
              }}
            >
              {eyebrow}
            </Text>
          </Section>

          {/* The one bit of brand red above the fold, doing the job the site's
              red rule does: telling you whose email this is at a glance. */}
          <Section style={{ backgroundColor: color.brand, fontSize: 0, lineHeight: '4px', height: '4px' }}>
            <Text style={{ margin: 0, fontSize: 0, lineHeight: '4px' }}>&nbsp;</Text>
          </Section>

          <Section
            style={{
              backgroundColor: color.white,
              borderRadius: '0 0 16px 16px',
              padding: '30px 28px 32px',
            }}
          >
            {children}
          </Section>

          <Section style={{ padding: '22px 28px 8px' }}>
            <Text style={{ ...text.small, margin: '0 0 10px' }}>{footNote}</Text>
            <Hr style={{ border: 'none', borderTop: `1px solid ${color.line}`, margin: '0 0 14px' }} />
            <Text style={{ ...text.small, margin: '0 0 4px', color: color.inkSoft, fontWeight: 600 }}>
              Kipekee Creations
            </Text>
            <Text style={{ ...text.small, margin: 0 }}>
              {SHOWROOM}
              <br />
              Mon–Fri 8.30am–5.30pm · Sat 9am–3pm
              <br />
              <Link href={`https://wa.me/${WHATSAPP}`} style={{ color: color.brand, textDecoration: 'none' }}>
                WhatsApp 0721 527 797
              </Link>
              {' · '}
              <Link href="tel:+254721527797" style={{ color: color.brand, textDecoration: 'none' }}>
                Call us
              </Link>
              {' · '}
              <Link
                href="mailto:info@kipekeecreations.co.ke"
                style={{ color: color.brand, textDecoration: 'none' }}
              >
                info@kipekeecreations.co.ke
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
