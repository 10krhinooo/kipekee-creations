import { Card, CardHeader, PageHeader } from '../components/AdminUI'
import { DetailsForm } from '../../components/account/DetailsForm'
import { Button } from '../../components/ui'
import { useAuth } from '../../auth/AuthProvider'

/**
 * Staff editing their own details, without leaving the console.
 *
 * This used to send them to `/account/profile`, which meant clicking "your
 * details" in the sidebar dropped them into the storefront shell - header,
 * search, basket and all - halfway through a shift. Same form, same endpoint,
 * console chrome.
 *
 * Deliberately only their own details and their password. What an account may
 * *do* is somebody else's decision and lives in Workshop accounts, so there is
 * nothing role-related to change here and nothing to imply there might be.
 */
export function MyDetails() {
  const { user, isAdmin } = useAuth()

  return (
    <>
      <PageHeader
        title="Your details"
        intro="What the workshop and your colleagues see, and how we reach you."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,480px)_minmax(0,320px)] lg:items-start">
        <Card>
          <CardHeader
            title={user?.name ?? 'Your details'}
            hint={isAdmin ? 'Admin' : 'Staff'}
          />
          <DetailsForm />
        </Card>

        <Card>
          <CardHeader
            title="Password"
            hint="Changing it signs you out everywhere, including here."
          />
          <Button to="/change-password" variant="outline">
            Change my password
          </Button>
        </Card>
      </div>
    </>
  )
}
