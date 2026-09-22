import { Link } from 'react-router-dom'
import { LegalPage } from './LegalLayout'

export function Terms() {
  return (
    <LegalPage
      title="Terms of sale"
      intro="The basis on which we quote, sell, make and deliver."
      updated="22 September 2026"
    >
      <p>
        These terms apply to everything bought from Kipekee Creations through this site, by phone,
        on WhatsApp or at the Katani Road showroom. Placing an order means accepting them.
      </p>

      <h2>Orders</h2>
      <p>
        An order placed here is an <strong>offer to buy</strong>, not a concluded contract. We
        confirm every order by phone before we make or dispatch anything, and the contract forms at
        that point. If we cannot fulfil an order, or something is priced wrongly, we will tell you
        and take nothing.
      </p>

      <h2>Quotes for made-to-measure work</h2>
      <p>
        A quote request costs nothing and commits you to nothing. We measure, then send a fixed,
        itemised written quotation. That quotation is <strong>valid for 30 days</strong> and is the
        price you pay; we do not add to it afterwards unless you change the job.
      </p>
      <p>
        Work starts once you accept the quotation. Because made-to-measure items are cut to your
        window, an accepted job cannot be cancelled once cutting has begun.
      </p>

      <h2>Prices and payment</h2>
      <p>
        Prices are in Kenya Shillings and include VAT. Made-to-measure prices shown on product pages
        are indicative &ldquo;from&rdquo; prices per metre or per unit; the quotation is the binding
        figure.
      </p>
      <p>
        We confirm the order before taking payment. M-Pesa payments go to our Pochi la Biashara
        number, 0722 771 321, using Send Money; card payments are taken through a secure link we
        send you.
        The documents you download from this site are payment invoices and records of what was
        ordered. <strong>They are not tax invoices.</strong> A tax invoice is issued separately once
        payment clears.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery terms, charges and timings are set out in{' '}
        <Link to="/returns">delivery and returns</Link>. Delivery dates are our best estimate.
        Where a delay is ours we will tell you as soon as we know.
      </p>

      <h2>Returns and faults</h2>
      <p>
        Ready-made stock can be returned unused within 14 days. Made-to-measure work cannot be
        returned for a change of mind, but we remake anything faulty, not as described, or not as
        agreed in the quotation. The detail is in{' '}
        <Link to="/returns">delivery and returns</Link>, and nothing there limits your rights under
        Kenyan consumer law.
      </p>

      <h2>Fabric and colour</h2>
      <p>
        Screens differ, and so do dye lots. Colours on this site are a guide rather than a match. If
        colour matters to your job, order a cutting or come and see the roll before you commit; we
        cannot treat a shade difference as a fault where you have not.
      </p>

      <h2>Our liability</h2>
      <p>
        We are responsible for loss you suffer as a foreseeable result of us breaking these terms or
        failing to use reasonable care. We are not responsible for loss that was not foreseeable, or
        for business losses. Nothing here excludes liability that cannot lawfully be excluded,
        including for death or personal injury caused by our negligence.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction.
      </p>

      <p>
        See also our <Link to="/privacy">privacy notice</Link>.
      </p>
    </LegalPage>
  )
}
