import type { ReactNode } from 'react'
import { Button, Column, Row, Section, Text } from '@react-email/components'
import { color, font, text } from '../theme.ts'

/** The single primary action of a message. At most one per email. */
export function Cta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: '4px 0 22px' }}>
      <Button
        href={href}
        style={{
          backgroundColor: color.brand,
          borderRadius: '10px',
          color: color.white,
          fontFamily: font.body,
          fontSize: '15px',
          fontWeight: 600,
          padding: '14px 26px',
          textDecoration: 'none',
        }}
      >
        {children}
      </Button>
    </Section>
  )
}

/**
 * A tinted block for the one fact the reader is looking for - a reference, a
 * total, a date. Everything else in a message is prose; this is not.
 */
export function Highlight({
  label,
  value,
  note,
  tone = 'sand',
}: {
  label: string
  value: string
  note?: string
  tone?: 'sand' | 'good'
}) {
  const bg = tone === 'good' ? color.goodBg : color.sand
  return (
    <Section
      style={{
        backgroundColor: bg,
        borderRadius: '12px',
        padding: '16px 18px',
        margin: '0 0 22px',
      }}
    >
      <Text style={{ ...text.label, margin: '0 0 3px' }}>{label}</Text>
      <Text
        style={{
          fontFamily: font.display,
          fontSize: '20px',
          lineHeight: '28px',
          fontWeight: 600,
          color: tone === 'good' ? color.goodInk : color.ink,
          margin: 0,
        }}
      >
        {value}
      </Text>
      {note && <Text style={{ ...text.small, margin: '4px 0 0' }}>{note}</Text>}
    </Section>
  )
}

/**
 * One repeated item, as a self-contained block rather than a row of a shared
 * table. That is what lets a Qute `{#for}` sit legally either side of it - see
 * the note in `qute.tsx`.
 */
export function Line({
  title,
  detail,
  amount,
  note,
}: {
  title: string
  detail?: string
  amount?: string
  note?: string
}) {
  return (
    <Section style={{ borderTop: `1px solid ${color.line}`, padding: '13px 0 0', margin: '0 0 13px' }}>
      <Row>
        <Column style={{ verticalAlign: 'top' }}>
          <Text style={{ ...text.body, margin: 0, color: color.ink, fontWeight: 600, fontSize: '14px' }}>
            {title}
          </Text>
          {detail && <Text style={{ ...text.small, margin: '3px 0 0' }}>{detail}</Text>}
          {note && (
            <Text style={{ ...text.small, margin: '5px 0 0', fontStyle: 'italic', color: color.inkSoft }}>
              {note}
            </Text>
          )}
        </Column>
        {amount && (
          <Column style={{ verticalAlign: 'top', textAlign: 'right', width: '110px' }}>
            <Text
              style={{
                ...text.body,
                margin: 0,
                color: color.ink,
                fontWeight: 600,
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              {amount}
            </Text>
          </Column>
        )}
      </Row>
    </Section>
  )
}

/** A label/value pair in a totals block. `strong` marks the payable line. */
export function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Row style={{ marginBottom: '6px' }}>
      <Column>
        <Text
          style={{
            ...text.body,
            margin: 0,
            fontSize: strong ? '15px' : '14px',
            color: strong ? color.ink : color.muted,
            fontWeight: strong ? 700 : 400,
          }}
        >
          {label}
        </Text>
      </Column>
      <Column style={{ textAlign: 'right', width: '130px' }}>
        <Text
          style={{
            ...text.body,
            margin: 0,
            fontSize: strong ? '17px' : '14px',
            fontFamily: strong ? font.display : font.body,
            color: strong ? color.ink : color.inkSoft,
            fontWeight: strong ? 700 : 600,
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  )
}

/** A boxed aside: delivery details, what happens next, a warning. */
export function Panel({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Section
      style={{
        border: `1px solid ${color.line}`,
        borderRadius: '12px',
        padding: '16px 18px',
        margin: '0 0 20px',
      }}
    >
      <Text style={{ ...text.label, margin: '0 0 7px' }}>{heading}</Text>
      {children}
    </Section>
  )
}
