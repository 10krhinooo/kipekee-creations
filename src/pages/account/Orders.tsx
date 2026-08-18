import { AccountPanel, EmptyNote } from './AccountLayout'
import { Button } from '../../components/ui'

/**
 * Order and quote history.
 *
 * Deliberately empty rather than populated with mock rows. Orders are not
 * persisted yet - checkout sends a confirmation email and nothing more - and
 * showing a customer invented history in their own account is the one place
 * placeholder data would be actively misleading rather than merely unfinished.
 */
export function AccountOrders() {
  return (
    <>
      <AccountPanel title="Orders" intro="Everything you have bought, with what it cost and when it arrived.">
        <EmptyNote>
          No orders on your account yet. Anything you order from now on will be listed here with its
          reference, so you can check it or reorder without digging through email.
          <br />
          <Button to="/shop" size="sm" className="mt-4">
            Browse the shop
          </Button>
        </EmptyNote>
      </AccountPanel>

      <AccountPanel title="Quotes" intro="Made-to-measure jobs, with the measurements we took.">
        <EmptyNote>
          No quotes yet. When you request one while signed in, it stays here with its measurements
          and its fixed price, so a repeat job starts from the last one.
          <br />
          <Button to="/quote" size="sm" className="mt-4">
            Request a quote
          </Button>
        </EmptyNote>
      </AccountPanel>
    </>
  )
}
