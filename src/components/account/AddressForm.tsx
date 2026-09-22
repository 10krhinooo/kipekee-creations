import { useState, type FormEvent } from 'react'
import { AuthField } from '../auth/AuthUI'
import { Button } from '../ui'
import { KENYA_COUNTIES, countyName } from '../../data/kenya'
import { isValidKenyanPhone } from '../../lib/validate'

/**
 * The delivery address form, with no page chrome around it.
 *
 * Two screens need it: the address book, where a customer keeps several, and
 * the details page, where most people only ever want the one and should not
 * have to find a second screen to enter it. Keeping the fields here means the
 * validation and the wording cannot drift between the two.
 *
 * State is internal, so switching which address is being edited is a remount:
 * give it a `key` that changes with the row.
 */

export interface AddressFields {
  label: string
  recipient: string
  phone: string
  line1: string
  county: string
  notes: string
  isDefault: boolean
}

/** What the API is sent. Empty optional fields go as null, not as "". */
export interface AddressBody extends Omit<AddressFields, 'phone' | 'notes'> {
  phone: string | null
  notes: string | null
}

export const blankAddress = (isDefault = false): AddressFields => ({
  label: '',
  recipient: '',
  phone: '',
  line1: '',
  county: 'Nairobi',
  notes: '',
  isDefault,
})

/** An address as the API returns it, narrowed to what the form needs. */
export interface SavedAddress {
  id: number
  label: string | null
  recipient: string
  phone: string | null
  line1: string
  county: string | null
  notes: string | null
  isDefault: boolean
}

export const fieldsOf = (a: SavedAddress): AddressFields => ({
  label: a.label ?? '',
  recipient: a.recipient,
  phone: a.phone ?? '',
  line1: a.line1,
  // Normalised, or the select has no option matching the stored value
  // and silently shows the wrong county.
  county: countyName(a.county) || 'Nairobi',
  notes: a.notes ?? '',
  isDefault: a.isDefault,
})

export function AddressForm({
  initial,
  saving = false,
  submitLabel = 'Save address',
  /** Hidden where there is only ever one address on the screen to default to. */
  showDefaultToggle = true,
  onSubmit,
  onCancel,
}: {
  initial: AddressFields
  saving?: boolean
  submitLabel?: string
  showDefaultToggle?: boolean
  onSubmit: (body: AddressBody) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState(initial)
  const [touched, setTouched] = useState(false)

  const recipientProblem = form.recipient.trim() ? undefined : 'Who should we ask for on arrival?'
  const line1Problem = form.line1.trim() ? undefined : 'Enter the street, estate or building'
  const phoneProblem =
    form.phone.trim() && !isValidKenyanPhone(form.phone)
      ? 'Enter a Kenyan number, e.g. 07XX XXX XXX'
      : undefined
  const canSave = !recipientProblem && !line1Problem && !phoneProblem

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSave || saving) return
    onSubmit({
      ...form,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    })
  }

  const set = <K extends keyof AddressFields>(key: K, value: AddressFields[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-4 rounded-xl border border-line bg-shell p-4 sm:grid-cols-2 sm:p-5"
    >
      <AuthField
        label="Label"
        hint="Optional"
        disabled={saving}
        value={form.label}
        onChange={(e) => set('label', e.target.value)}
        placeholder="Home, Lodge main gate, Laundry"
      />
      <AuthField
        label="Who signs for it"
        required
        disabled={saving}
        value={form.recipient}
        onChange={(e) => set('recipient', e.target.value)}
        error={touched ? recipientProblem : undefined}
        placeholder="Front office"
      />
      <div className="sm:col-span-2">
        <AuthField
          label="Street, estate or building"
          required
          disabled={saving}
          value={form.line1}
          onChange={(e) => set('line1', e.target.value)}
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
        onChange={(e) => set('phone', e.target.value)}
        error={touched ? phoneProblem : undefined}
        placeholder="07XX XXX XXX"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink-soft">County</span>
        <select
          value={form.county}
          disabled={saving}
          onChange={(e) => set('county', e.target.value)}
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
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Ask for the duty manager, gate closes at 6pm"
        />
      </div>

      {showDefaultToggle && (
        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isDefault}
            disabled={saving}
            onChange={(e) => set('isDefault', e.target.checked)}
            className="h-4 w-4 accent-[#a11c20]"
          />
          <span className="text-[13px] text-ink-soft">Use this one by default at checkout</span>
        </label>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
