import { Link } from 'react-router-dom'
import { LegalPage } from './LegalLayout'

export function Returns() {
  return (
    <LegalPage
      title="Delivery and returns"
      intro="What we charge to deliver, how long it takes, and what you can send back."
      updated="22 September 2026"
    >
      <h2>Delivery</h2>
      <p>
        Delivery is a flat <strong>KSh 450</strong> anywhere in Kenya, and <strong>free</strong> on
        orders over KSh 10,000. The fee is the same to every county; we do not price Nairobi
        differently from anywhere else.
      </p>
      <p>
        Ready-made stock leaves the workshop within two working days. Made-to-measure work is made
        to your window, so it takes longer, and the lead time is quoted per job before you commit.
      </p>
      <p>
        We measure free of charge anywhere in Nairobi. Outside Nairobi we will agree a measure with
        you before travelling.
      </p>

      <h2>Returns on ready-made stock</h2>
      <p>
        Anything ready-made can come back within <strong>14 days</strong> for a full refund, as long
        as it is unused and in its original packaging. That covers cushion covers, towels, table
        linen, ceramics, hardware and fabric sold by the metre that has not been cut.
      </p>
      <p>
        Tell us by phone or WhatsApp first so we can arrange collection or agree that you will bring
        it to Katani Road. Refunds go back the way the money came, within five working days of the
        goods reaching us.
      </p>

      <h2>Made-to-measure work</h2>
      <p>
        Curtains, blinds, canopies and anything cut or sewn to your measurements{' '}
        <strong>cannot be returned because you changed your mind</strong>. They are made for one
        window and have no resale value to us. This is the trade-off for work made to fit, and it is
        why we measure ourselves and confirm every dimension in writing before cutting.
      </p>
      <p>
        That does not limit your rights where something is <strong>faulty, not as described, or
        not what was agreed in the quote</strong>. In those cases we remake it. There is no supply
        chain for us to blame: the same team that sewed it puts it right.
      </p>

      <h2>Fabric cuttings</h2>
      <p>
        We post 15 × 15 cm cuttings anywhere in Kenya for KSh 200, refunded against your order if
        you go ahead. Cuttings themselves are not returnable.
      </p>

      <h2>Faults and damage</h2>
      <p>
        Check your delivery when it arrives and tell us the same day if anything is damaged or
        missing. Photographs help. For faults that appear later, get in touch and we will look at
        it; we make this work ourselves, so we would rather see it than argue about it.
      </p>

      <p>
        See also our <Link to="/terms">terms of sale</Link> and{' '}
        <Link to="/privacy">privacy notice</Link>.
      </p>
    </LegalPage>
  )
}
