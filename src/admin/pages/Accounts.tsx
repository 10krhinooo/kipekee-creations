import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AuthField, Notice } from '../../components/auth/AuthUI'
import { Button, cx } from '../../components/ui'
import { useAuth, type Role } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { isValidEmail } from '../../lib/validate'

interface StaffAccount {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  isActive: boolean
  invitePending: boolean
  invitedBy: string | null
  invitedAt: string | null
  createdAt: string
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CUSTOMER: 'Customer',
}

/**
 * Who works here.
 *
 * ADMIN only, both here and on every endpoint it calls. The refusals the
 * backend sends - you cannot demote yourself, this is the last admin - are
 * written to be shown to the person as they are, so this screen surfaces them
 * verbatim rather than reimplementing the same rules and risking a different
 * answer.
 */
export function Accounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<StaffAccount[] | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'good'; text: string } | null>(null)
  const [inviting, setInviting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [form, setForm] = useState({ name: '', email: '', role: 'STAFF' as Role })
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)

  const clearNotice = useCallback(() => setNotice(null), [])

  const load = useCallback(async () => {
    const result = await api.get<StaffAccount[]>('/api/admin/accounts')
    if (result.ok) setAccounts(result.data)
    else {
      setAccounts([])
      setNotice({ tone: 'error', text: result.message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nameProblem = form.name.trim() ? undefined : 'Enter their name'
  const emailProblem = !form.email.trim()
    ? 'Enter their work email'
    : !isValidEmail(form.email)
      ? 'That does not look like an email address'
      : undefined
  const canInvite = !nameProblem && !emailProblem

  async function invite(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canInvite || sending) return

    setNotice(null)
    setSending(true)
    const result = await api.post<StaffAccount>('/api/admin/accounts', form)
    setSending(false)

    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message })
      return
    }
    setForm({ name: '', email: '', role: 'STAFF' })
    setTouched(false)
    setInviting(false)
    await load()
    setNotice({
      tone: 'good',
      text: `${result.data.name} has been emailed an invite link. Their account has no password on it until they follow it and choose one.`,
    })
  }

  async function act(id: number, run: () => Promise<{ ok: boolean; message?: string }>, good: string) {
    setNotice(null)
    setBusyId(id)
    const result = await run()
    setBusyId(null)
    if (!result.ok) {
      setNotice({ tone: 'error', text: result.message ?? 'That did not work.' })
      return
    }
    await load()
    setNotice({ tone: 'good', text: good })
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Workshop accounts</h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
            Who can sign in to the console, and what they can do once they are in.
          </p>
        </div>
        {!inviting && <Button onClick={() => setInviting(true)}>Add someone</Button>}
      </header>

      {notice && (
        <div className="mb-5">
          <Notice tone={notice.tone} onDismiss={clearNotice}>
            {notice.text}
          </Notice>
        </div>
      )}

      {inviting && (
        <form
          onSubmit={invite}
          noValidate
          className="mb-6 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2"
        >
          <AuthField
            label="Name"
            required
            autoFocus
            disabled={sending}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={touched ? nameProblem : undefined}
            placeholder="Amina Hassan"
          />
          <AuthField
            label="Work email"
            type="email"
            required
            disabled={sending}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={touched ? emailProblem : undefined}
            placeholder="amina@kipekeecreations.co.ke"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-soft">Role</span>
            <select
              value={form.role}
              disabled={sending}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="rounded-xl border border-line bg-shell px-4 py-3 text-sm outline-none focus:border-brand"
            >
              <option value="STAFF">Staff, works the queues</option>
              <option value="ADMIN">Admin, can also manage accounts</option>
            </select>
          </label>

          <p className="self-end text-[12.5px] leading-relaxed text-muted sm:pb-3">
            They get a link that lets them choose their own password. The account cannot be signed
            into until they do, and the link stops working after a week.
          </p>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending the invite…' : 'Send invite'}
            </Button>
            <Button variant="ghost" onClick={() => setInviting(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {accounts === null ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-[13.5px] text-muted">
          Loading accounts…
        </p>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account) => {
            const isSelf = account.email === user?.email
            const busy = busyId === account.id

            return (
              <li
                key={account.id}
                className={cx(
                  'rounded-2xl border bg-white p-4 sm:p-5',
                  account.isActive ? 'border-line' : 'border-line bg-shell opacity-75',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-display text-[15px] font-semibold text-ink">
                      {account.name}
                      {isSelf && <span className="text-[12px] font-normal text-muted">(you)</span>}
                      <span
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                          account.role === 'ADMIN' ? 'bg-brand text-white' : 'bg-sand text-ink-soft',
                        )}
                      >
                        {ROLE_LABEL[account.role]}
                      </span>
                      {!account.isActive && (
                        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted uppercase">
                          Suspended
                        </span>
                      )}
                      {account.invitePending && (
                        <span className="rounded-full bg-[#fdf1dc] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#8a6512] uppercase">
                          Invite pending
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[13px] text-muted">
                      {account.email}
                      {account.invitedBy && ` · added by ${account.invitedBy}`}
                    </p>
                  </div>

                  {/* Nothing destructive is offered against your own account.
                      The backend refuses it too; hiding it here means nobody
                      has to discover the rule by tripping over it. */}
                  {!isSelf && (
                    <div className="flex flex-wrap gap-1">
                      <select
                        value={account.role}
                        disabled={busy}
                        onChange={(e) =>
                          act(
                            account.id,
                            () =>
                              api.put(`/api/admin/accounts/${account.id}/role`, {
                                role: e.target.value,
                              }),
                            `${account.name} is now ${ROLE_LABEL[e.target.value].toLowerCase()}.`,
                          )
                        }
                        title="Change what this person can do"
                        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] outline-none focus:border-brand"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>

                      <button
                        disabled={busy}
                        onClick={() =>
                          act(
                            account.id,
                            () =>
                              api.put(`/api/admin/accounts/${account.id}/active`, {
                                isActive: !account.isActive,
                              }),
                            account.isActive
                              ? `${account.name} has been suspended and signed out.`
                              : `${account.name} can sign in again.`,
                          )
                        }
                        title={
                          account.isActive
                            ? 'Suspend this account and end their sessions'
                            : 'Let this person sign in again'
                        }
                        className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:bg-sand hover:text-brand"
                      >
                        {account.isActive ? 'Suspend' : 'Reactivate'}
                      </button>

                      {/* Only while the invite is unspent. Once somebody has a
                          password, the way to get them a new one is the reset
                          link on the sign-in screen, which does not sign them
                          out of work in progress. The backend refuses it too. */}
                      {account.invitePending && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(
                              account.id,
                              () => api.post(`/api/admin/accounts/${account.id}/resend-invite`),
                              `A fresh invite link is on its way to ${account.email}. The old one has stopped working.`,
                            )
                          }
                          title="Email a fresh invite link, and retire the old one"
                          className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:bg-sand hover:text-brand"
                        >
                          Resend invite
                        </button>
                      )}

                      <button
                        disabled={busy}
                        onClick={() =>
                          act(
                            account.id,
                            () => api.del(`/api/admin/accounts/${account.id}`),
                            `${account.name} has been removed.`,
                          )
                        }
                        title="Remove this account permanently"
                        className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-brand-50 hover:text-brand"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
        Suspending is usually the right answer when somebody leaves. Their name stays attached to
        the quotes and fittings they worked on, which deleting the account would take with it.
      </p>
    </div>
  )
}
