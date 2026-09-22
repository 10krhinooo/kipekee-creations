import { useCallback, useState, type FormEvent } from 'react'
import { AuthField, Notice } from '../auth/AuthUI'
import { Button } from '../ui'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { isValidKenyanPhone } from '../../lib/validate'

/**
 * The "your details" form itself, with no panel or page chrome around it.
 *
 * Both audiences edit the same three fields against the same endpoint, but
 * they do it in different shells: a customer inside the storefront account
 * area, staff inside the workshop console. Keeping the form here and the
 * chrome in the two pages means the validation, the endpoint and the wording
 * cannot drift apart between them, which is exactly what two copies would do
 * the first time one of them was fixed.
 */
export function DetailsForm({ intro }: { intro?: string }) {
  const { user, refresh } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [touched, setTouched] = useState({ name: false, phone: false })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'error' | 'good'; text: string } | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])

  const nameProblem = name.trim() ? undefined : 'Enter your name'
  const phoneProblem =
    phone.trim() && !isValidKenyanPhone(phone)
      ? 'Enter a Kenyan number, e.g. 07XX XXX XXX'
      : undefined
  const canSave = !nameProblem && !phoneProblem

  async function save(e: FormEvent) {
    e.preventDefault()
    setTouched({ name: true, phone: true })
    if (!canSave || saving) return

    setNotice(null)
    setSaving(true)
    const result = await api.patch('/api/account/profile', { name, phone: phone.trim() || null })
    setSaving(false)

    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    // Re-reads the session so the header and the account heading show the new
    // name straight away rather than until the next reload.
    await refresh()
    setNotice({ tone: 'good', text: 'Saved.' })
  }

  return (
    <form onSubmit={save} noValidate className="flex max-w-md flex-col gap-4">
      {intro && <p className="text-[13px] leading-relaxed text-muted">{intro}</p>}

      <AuthField
        label="Full name"
        required
        autoComplete="name"
        disabled={saving}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
        error={touched.name ? nameProblem : undefined}
      />

      <AuthField
        label="Phone"
        hint="Optional"
        type="tel"
        autoComplete="tel"
        disabled={saving}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
        error={touched.phone ? phoneProblem : undefined}
        placeholder="07XX XXX XXX"
      />

      {/* Not editable here on purpose: changing the address you sign in
          with needs the new one proved before the old one stops working,
          and folding that into "edit profile" is how accounts get lost. */}
      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Email</span>
        <p className="rounded-xl border border-line bg-shell px-4 py-3 text-sm text-muted">
          {user?.email}
        </p>
        <p className="mt-1.5 text-[12px] text-muted">
          This is what you sign in with. Message us on WhatsApp to change it.
        </p>
      </div>

      {notice && (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      )}

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
