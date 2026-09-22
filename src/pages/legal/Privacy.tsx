import { Link } from 'react-router-dom'
import { LegalPage } from './LegalLayout'

export function Privacy() {
  return (
    <LegalPage
      title="Privacy notice"
      intro="What we collect, why we collect it, and what you can ask us to do with it."
      updated="22 September 2026"
    >
      <p>
        This notice covers kipekeecreations.co.ke and the orders and quotes that come through it. We
        handle personal data under Kenya&rsquo;s <strong>Data Protection Act 2019</strong>. Kipekee
        Creations is the data controller.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>To fulfil an order:</strong> your name, phone number, email address and delivery
          address.
        </li>
        <li>
          <strong>To quote made-to-measure work:</strong> the room, window measurements and any
          notes you give us, plus the area you are in so we can send a fitter.
        </li>
        <li>
          <strong>If you open an account:</strong> your name, email, phone and saved addresses.
          Passwords are stored hashed and are never visible to us.
        </li>
        <li>
          <strong>If you join our promotional list:</strong> your email address, and nothing else.
        </li>
      </ul>
      <p>
        We do not collect payment card details on this site and we never see your M-Pesa PIN.
      </p>

      <h2>What stays in your browser</h2>
      <p>
        Your basket, quote list, saved items, recently viewed products and sign-in session are kept
        in your own browser&rsquo;s storage, not on our servers, until you place an order or send a
        request. Clearing your browser data clears them.
      </p>
      <p>
        We do not use advertising or tracking cookies, and we do not sell or share your data with
        advertisers.
      </p>

      <h2>Why we are allowed to hold it</h2>
      <ul>
        <li>
          <strong>To perform a contract:</strong> order and quote details, because we cannot deliver
          or price the work without them.
        </li>
        <li>
          <strong>Legitimate interest:</strong> keeping records of jobs so we can honour a remake
          years later.
        </li>
        <li>
          <strong>Consent:</strong> promotional email, which you opt into and can leave at any time.
        </li>
      </ul>

      <h2>Who else sees it</h2>
      <p>
        Only the people who need it to do the job: our workshop and fitting team, and the courier
        delivering to you. We do not sell personal data. Where a supplier processes data on our
        behalf, they are bound to use it only for that purpose.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order and quote records are kept for seven years, which is what tax and accounting rules
        require. Account details are kept until you ask us to close the account. Promotional list
        entries are removed as soon as you unsubscribe.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the Data Protection Act 2019 you can ask us for a copy of what we hold about you, ask
        us to correct it, ask us to delete it where we are not required to keep it, object to how we
        are using it, and withdraw consent to marketing at any time. Write to{' '}
        <a href="mailto:info@kipekeecreations.co.ke">info@kipekeecreations.co.ke</a> and we will
        respond within the statutory period.
      </p>
      <p>
        If you are not satisfied with how we have handled a request, you can complain to the{' '}
        <a href="https://www.odpc.go.ke" target="_blank" rel="noreferrer">
          Office of the Data Protection Commissioner
        </a>
        .
      </p>

      <p>
        See also our <Link to="/terms">terms of sale</Link> and{' '}
        <Link to="/returns">delivery and returns</Link>.
      </p>
    </LegalPage>
  )
}
