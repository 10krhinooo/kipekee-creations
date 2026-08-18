import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { AuthField, Notice } from '../../components/auth/AuthUI'
import { Button, cx } from '../../components/ui'
import { api } from '../../lib/api'
import { KENYA_COUNTIES } from '../../data/kenya'
import { isValidKenyanPhone } from '../../lib/validate'

interface Address {
  id: number
  label: string | null
  recipient: string
  phone: string | null
  line1: string
  county: string | null
  notes: string | null
  isDefault: boolean
}

const blank = {
  label: '',
  recipient: '',
  phone: '',
  line1: '',
  county: 'Nairobi',
  notes: '',
  isDefault: false,
}

/**
 * Delivery addresses.
 *
 * More than one, with a label and a named recipient, because the customer this
 * is built for is the hotel that delivers to a front office, a laundry and a
 * site office at different times, and whoever signs for it is rarely the person
 * holding the account.
 */
export function AccountAddresses() {
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'error' | 'good'; text: string } | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])

  const load = useCallback(async () => {
    const result = await api.get<Address[]>('/api/account/addresses')
    if (result.ok) setAddresses(result.data)
    else {
      setAddresses([])
      setNotice({ tone: 'error', text: result.message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const recipientProblem = form.recipient.trim() ? undefined : 'Who should we ask for on arrival?'
  const line1Problem = form.line1.trim() ? undefined : 'Enter the street, estate or building'
  const phoneProblem =
    form.phone.trim() && !isValidKenyanPhone(form.phone)
      ? 'Enter a Kenyan number, e.g. 07XX XXX XXX'
      : undefined
  const canSave = !recipientProblem && !line1Problem && !phoneProblem

  function startNew() {
    setForm(blank)
    setTouched(false)
    setEditing('new')
  }

  function startEdit(address: Address) {
    setForm({
      label: address.label ?? '',
      recipient: address.recipient,
      phone: address.phone ?? '',
      line1: address.line1,
      county: address.county ?? 'Nairobi',
      notes: address.notes ?? '',
      isDefault: address.isDefault,
    })
    setTouched(false)
    setEditing(address.id)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSave || saving) return

    setNotice(null)
    setSaving(true)
    const body = { ...form, phone: form.phone.trim() || null, notes: form.notes.trim() || null }
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

  async function makeDefault(address: Address) {
    const result = await api.put(`/api/account/addresses/${address.id}`, {
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      line1: address.line1,
      county: address.county,
      notes: address.notes,
      isDefault: true,
    })
    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    await load()
  }

  return (
    <AccountPanel
      title="Delivery addresses"
      intro="The default is the one checkout fills in for you."
      action={
        editing === null ? (
          <Button size="sm" onClick={startNew}>
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

      {editing !== null && (
        <form
          onSubmit={save}
          noValidate
          className="mb-6 grid gap-4 rounded-xl border border-line bg-shell p-4 sm:grid-cols-2 sm:p-5"
        >
          <AuthField
            label="Label"
            hint="Optional"
            disabled={saving}
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Home, Lodge main gate, Laundry"
          />
          <AuthField
            label="Who signs for it"
            required
            disabled={saving}
            value={form.recipient}
            onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
            error={touched ? recipientProblem : undefined}
            placeholder="Front office"
          />
          <div className="sm:col-span-2">
            <AuthField
              label="Street, estate or building"
              required
              disabled={saving}
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              error={touched ? line1Problem : undefined}
              placeholder="12 Riverside Drive, Apt 4B"
            />
          </div>
          <AuthField
            label="Phone on arrival"
            hint="Optional"
            type="tel"
            disabled={saving}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={touched ? phoneProblem : undefined}
            placeholder="07XX XXX XXX"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-soft">County</span>
            <select
              value={form.county}
              disabled={saving}
              onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand"
            >
              {KENYA_COUNTIES.map((county) => (
                <option key={county.id} value={county.name}>
                  {county.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <AuthField
              label="Notes for the rider"
              hint="Optional"
              disabled={saving}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ask for the duty manager, gate closes at 6pm"
            />
          </div>

          <label className="flex items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              disabled={saving}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 accent-[#a11c20]"
            />
            <span className="text-[13px] text-ink-soft">Use this one by default at checkout</span>
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save address'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
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
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {address.recipient}
                    <br />
                    {address.line1}
                    {address.county && `, ${address.county}`}
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
                    onClick={() => startEdit(address)}
                    title="Edit this address"
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:bg-sand hover:text-brand"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(address.id)}
                    title="Delete this address"
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-sand hover:text-brand"
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
