import { useCallback, useEffect, useState } from 'react'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { Notice } from '../../components/auth/AuthUI'
import {
  type AddressBody,
  AddressForm,
  type SavedAddress,
  blankAddress,
  fieldsOf,
} from '../../components/account/AddressForm'
import { Button, cx } from '../../components/ui'
import { countyName } from '../../data/kenya'
import { api } from '../../lib/api'

/**
 * Delivery addresses.
 *
 * More than one, with a label and a named recipient, because the customer this
 * is built for is the hotel that delivers to a front office, a laundry and a
 * site office at different times, and whoever signs for it is rarely the person
 * holding the account. A customer who only ever has one can enter it on the
 * details page instead and never come here.
 */
export function AccountAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
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

  async function save(body: AddressBody) {
    setNotice(null)
    setSaving(true)
    const result =
      editing === 'new'
        ? await api.post('/api/account/addresses', body)
        : await api.put(`/api/account/addresses/${editing}`, body)
    setSaving(false)

    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    setEditing(null)
    await load()
    setNotice({ tone: 'good', text: 'Address saved.' })
  }

  async function remove(id: number) {
    const result = await api.del(`/api/account/addresses/${id}`)
    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    await load()
  }

  async function makeDefault(address: SavedAddress) {
    // The route replaces the whole address, so everything it already had has
    // to go back with it. Sending only `isDefault` would blank the rest.
    const { id: _id, ...rest } = address
    const result = await api.put(`/api/account/addresses/${address.id}`, {
      ...rest,
      isDefault: true,
    })
    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    await load()
  }

  const beingEdited =
    typeof editing === 'number' ? addresses?.find((a) => a.id === editing) : undefined
  const current =
    editing === 'new'
      ? // The first address saved is the default, since there is nothing else
        // for checkout to choose and an account with no default fills in nothing.
        blankAddress(addresses?.length === 0)
      : beingEdited
        ? fieldsOf(beingEdited)
        : null

  return (
    <AccountPanel
      title="Delivery addresses"
      intro="The default is the one checkout fills in for you."
      action={
        editing === null ? (
          <Button size="sm" onClick={() => setEditing('new')}>
            Add an address
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

      {current && (
        <div className="mb-6">
          {/* Keyed on the row so switching which address is being edited
              reloads the fields rather than carrying the last one's over. */}
          <AddressForm
            key={String(editing)}
            initial={current}
            saving={saving}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {addresses === null ? (
        <EmptyNote>Loading your addresses…</EmptyNote>
      ) : addresses.length === 0 ? (
        editing === null && (
          <EmptyNote>
            No addresses saved. Add one and checkout will fill it in for you next time.
          </EmptyNote>
        )
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cx(
                'rounded-xl border p-4',
                address.isDefault ? 'border-brand bg-brand-50/40' : 'border-line',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-display text-[15px] font-semibold text-ink">
                    {address.label || address.recipient}
                    {address.isDefault && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {/* The heading already shows the recipient when there is no
                        label, and printing it twice reads as a mistake. */}
                    {address.label && (
                      <>
                        {address.recipient}
                        <br />
                      </>
                    )}
                    {address.line1}
                    {address.county && `, ${countyName(address.county)}`}
                    {address.phone && (
                      <>
                        <br />
                        {address.phone}
                      </>
                    )}
                    {address.notes && (
                      <>
                        <br />
                        <span className="italic">{address.notes}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  {!address.isDefault && (
                    <button
                      onClick={() => makeDefault(address)}
                      title="Use this address by default at checkout"
                      className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:bg-sand hover:text-brand"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(address.id)}
                    title="Edit this address"
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:bg-sand hover:text-brand"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(address.id)}
                    title="Delete this address"
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-sand hover:text-brand"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountPanel>
  )
}
