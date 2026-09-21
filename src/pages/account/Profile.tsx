import { AccountPanel } from './AccountLayout'
import { DetailsForm } from '../../components/account/DetailsForm'
import { Button } from '../../components/ui'

/**
 * The customer's copy of "your details", inside the storefront account area.
 *
 * Staff edit the same fields at `/admin/profile` without leaving the console.
 * Only the chrome differs; the form itself is shared.
 */
export function AccountProfile() {
  return (
    <>
      <AccountPanel title="Your details" intro="What we put on a delivery note and use to reach you.">
        <DetailsForm />
      </AccountPanel>

      <AccountPanel title="Password" intro="Changing it signs you out everywhere, including here.">
        <Button to="/change-password" variant="outline">
          Change my password
        </Button>
      </AccountPanel>
    </>
  )
}
