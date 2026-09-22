import type { ReactNode } from 'react'
import { Container } from '../../components/ui'

/**
 * The shell the three policy pages share.
 *
 * A reading measure rather than the full container: legal copy is read in
 * sequence rather than scanned, and a 1600px line of it is punishing.
 */
export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string
  intro: string
  /** The date the wording last changed, which a policy has to carry. */
  updated: string
  children: ReactNode
}) {
  return (
    <Container narrow className="section">
      <p className="eyebrow mb-4 text-brand">Kipekee Creations</p>
      <h1 className="font-display text-display font-semibold text-ink">{title}</h1>
      <p className="mt-4 text-lede text-muted-foreground">{intro}</p>
      <p className="mt-3 text-[13px] text-muted-foreground">Last updated {updated}</p>

      <div className="legal mt-10">{children}</div>

      <p className="mt-12 border-t border-line pt-6 text-[13px] leading-relaxed text-muted-foreground">
        Questions about any of this: <strong className="text-ink">0722 771 321</strong> or{' '}
        <a href="mailto:info@kipekeecreations.co.ke" className="text-brand hover:underline">
          info@kipekeecreations.co.ke
        </a>
        . We are on Katani Road, off Mombasa Road, Nairobi.
      </p>
    </Container>
  )
}
