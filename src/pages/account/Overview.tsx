import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { Button } from '../../components/ui'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { useCatalogue } from '../../store/catalogue'
import { money } from '../../lib/format'

/**
 * The landing page of the account area.
 *
 * Leads with reordering rather than with a profile, because the customer this
 * exists for is the hotel buying the same linen every quarter. A profile page
 * is what they need once a year; the last order is what they need today.
 */
export function AccountOverview() {
  const { bySlug } = useCatalogue()
  const { user } = useAuth()
  const [saved, setSaved] = useState<string[] | null>(null)

  useEffect(() => {
    api.get<string[]>('/api/account/saved').then((r) => setSaved(r.ok ? r.data : []))
  }, [])

  const savedProducts = (saved ?? []).map(bySlug).filter((p) => p !== undefined)

  return (
    <>
      <AccountPanel
        title="Reorder"
        intro="Anything you have bought before, ready to go back in the basket."
      >
        {/* Honest about the state of things rather than showing a fake list.
            Orders are not persisted yet, so there is nothing to reorder from. */}
        <EmptyNote>
          Nothing to reorder yet. Orders placed from now on will appear here, so a repeat job starts
          from the last one instead of from scratch.
          <br />
          <Link to="/shop" className="mt-2 inline-block text-brand underline underline-offset-2">
            Browse the shop
          </Link>
        </EmptyNote>
      </AccountPanel>

      <AccountPanel
        title="Your saved list"
        intro="Kept on your account, so it follows you between your phone and a laptop."
        action={
          savedProducts.length > 0 ? (
            <Button to="/account/saved" variant="outline" size="sm">
              See all
            </Button>
          ) : undefined
        }
      >
        {saved === null ? (
          <EmptyNote>Loading your list…</EmptyNote>
        ) : savedProducts.length === 0 ? (
          <EmptyNote>
            Nothing saved yet. Tap the heart on any product and it will be here next time you sign
            in, on any device.
          </EmptyNote>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {savedProducts.slice(0, 4).map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/product/${p.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-brand"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{p.name}</span>
                    <span className="block text-[12.5px] text-muted">
                      {p.mode === 'quote' ? `from ${money(p.price)}` : money(p.price)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AccountPanel>

      <AccountPanel title="Getting a price for a whole room?" intro="Made to measure is quoted, not bought off the shelf.">
        <p className="mb-4 text-[13.5px] leading-relaxed text-ink-soft">
          Send us the room and we measure it free anywhere in Nairobi, then give you a fixed written
          price valid 30 days. Quotes you request while signed in stay on your account with their
          measurements, so a repeat job starts from the last one.
        </p>
        <Button to="/quote">Request a quote</Button>
      </AccountPanel>

      {user?.role !== 'CUSTOMER' && (
        <AccountPanel title="Workshop console" intro="Your account also has staff access.">
          <Button to="/admin" variant="dark">
            Open the console
          </Button>
        </AccountPanel>
      )}
    </>
  )
}
