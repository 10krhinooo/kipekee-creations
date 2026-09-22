import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { DetailsForm } from '../../components/account/DetailsForm'
import {
  type AddressBody,
  AddressForm,
  type SavedAddress,
  blankAddress,
  fieldsOf,
} from '../../components/account/AddressForm'
import { Notice } from '../../components/auth/AuthUI'
import { Button } from '../../components/ui'
import { countyName } from '../../data/kenya'
import { api } from '../../lib/api'

/**
 * The customer's copy of "your details", inside the storefront account area.
 *
 * Staff edit the same name and phone at `/admin/profile` without leaving the
 * console. Only the chrome differs; that form is shared.
 *
 * The delivery address is here too, which it was not. It lived on its own
 * screen built for the hotel keeping four of them, and a customer who came to
 * "your details" to put their address in found a page that would not take one.
 * Most people have exactly one address and should be able to fill it in, notes
 * for the rider included, where they went looking for it. The address book is
 * still there, one link away, for anyone who needs a second.
 */
export function AccountProfile() {
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'error' | 'good'; text: string } | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])

  const load = useCallback(async () => {
    const result = await api.get<SavedAddress[]>('/api/account/addresses')
    if (result.ok) setAddresses(result.data)
    else {
      setAddresses([])
      setNotice({ tone: 'error', text: result.message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // The one checkout fills in. Falling back to the first means an account whose
  // only address was never marked default still shows something here.
  const primary = addresses?.find((a) => a.isDefault) ?? addresses?.[0] ?? null

  async function save(body: AddressBody) {
    setNotice(null)
    setSaving(true)
    const result = primary
      ? await api.put(`/api/account/addresses/${primary.id}`, body)
      : await api.post('/api/account/addresses', body)
    setSaving(false)

    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    setEditing(false)
    await load()
    setNotice({ tone: 'good', text: 'Address saved.' })
  }

  const others = addresses ? addresses.length - (primary ? 1 : 0) : 0

  return (
    <>
      <AccountPanel title="Your details" intro="What we put on a delivery note and use to reach you.">
        <DetailsForm />
      </AccountPanel>

      <AccountPanel
        title="Delivery address"
        intro="Where orders go, and anything the rider needs to know to find you."
        action={
          !editing && primary ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Change
            </Button>
          ) : undefined
        }
      >
        {notice && (
          <div className="mb-4">
            <Notice tone={notice.tone} onDismiss={clearNotice}>
              {notice.text}
            </Notice>
          </div>
        )}

        {addresses === null ? (
          <EmptyNote>Loading your address…</EmptyNote>
        ) : editing || !primary ? (
          <>
            {!primary && !editing && (
              <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
                You have not saved an address yet. Fill this in and checkout will do it for you
                next time.
              </p>
            )}
            <AddressForm
              key={primary?.id ?? 'new'}
              initial={primary ? fieldsOf(primary) : blankAddress(true)}
              saving={saving}
              submitLabel={primary ? 'Save address' : 'Save my address'}
              // There is one address on this screen. Offering to make it the
              // default would be asking about a choice that has no alternative.
              showDefaultToggle={false}
              onSubmit={save}
              onCancel={primary ? () => setEditing(false) : undefined}
            />
          </>
        ) : (
          <div className="rounded-xl border border-line p-4">
            <p className="font-display text-[15px] font-semibold text-ink">
              {primary.label || primary.recipient}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {/* Only when it adds something. An unlabelled address headed by
                  the recipient printed their name twice, one line apart. */}
              {primary.label && (
                <>
                  {primary.recipient}
                  <br />
                </>
              )}
              {primary.line1}
              {primary.county && `, ${countyName(primary.county)}`}
              {primary.phone && (
                <>
                  <br />
                  {primary.phone}
                </>
              )}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed">
              <span className="block text-[12px] font-medium text-ink-soft">Notes for the rider</span>
              {primary.notes ? (
                <span className="text-muted-foreground italic">{primary.notes}</span>
              ) : (
                <span className="text-muted-foreground">
                  None yet. Add a landmark or a gate time if we would struggle to find you.
                </span>
              )}
            </p>
          </div>
        )}

        <p className="mt-4 text-[13px] text-muted-foreground">
          {others > 0
            ? `You have ${others} other ${others === 1 ? 'address' : 'addresses'} saved. `
            : 'Deliver somewhere else sometimes? '}
          <Link to="/account/addresses" className="text-brand underline">
            Manage your address book
          </Link>
        </p>
      </AccountPanel>

      <AccountPanel title="Password" intro="Changing it signs you out everywhere, including here.">
        <Button to="/change-password" variant="outline">
          Change my password
        </Button>
      </AccountPanel>
    </>
  )
}
