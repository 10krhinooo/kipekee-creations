import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { Button } from '../../components/ui'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { useCatalogue } from '../../store/catalogue'
import { useBasket } from '../../store/basket'
import { useSaved } from '../../store/saved'
import { money } from '../../lib/format'
import type { Product } from '../../data/types'

interface OrderSummary {
  id: string
  placedAt: string
}

interface OrderLine {
  name: string
  variant: string | null
  slug: string | null
  qty: number
}

interface OrderDetail {
  id: string
  lines: OrderLine[]
}

/** Matches a stored variant label like "Wine, 45 x 45 cm" back to colour/size ids. */
function resolveVariant(product: Product | undefined, variant: string | null) {
  if (!product || !variant) return { colour: undefined, size: undefined }
  const parts = variant.split(', ').map((p) => p.trim())
  const colour = product.colours.find((c) => parts.includes(c.label))?.id
  const size = product.sizes?.find((s) => parts.includes(s.label))?.id
  return { colour, size }
}

/**
 * The landing page of the account area.
 *
 * Leads with reordering rather than with a profile, because the customer this
 * exists for is the hotel buying the same linen every quarter. A profile page
 * is what they need once a year; the last order is what they need today.
 */
export function AccountOverview() {
  const { bySlug } = useCatalogue()
  const { addToCart, openDrawer } = useBasket()
  const { user } = useAuth()
  const { saved } = useSaved()

  const [lastOrder, setLastOrder] = useState<OrderDetail | null | undefined>(undefined)
  const [reordered, setReordered] = useState(false)

  useEffect(() => {
    api.get<OrderSummary[]>('/api/account/orders').then((result) => {
      const latest = result.ok ? result.data[0] : undefined
      if (!latest) {
        setLastOrder(null)
        return
      }
      api.get<OrderDetail>(`/api/account/orders/${encodeURIComponent(latest.id)}`).then((detail) => {
        setLastOrder(detail.ok ? detail.data : null)
      })
    })
  }, [])

  const reorder = () => {
    if (!lastOrder) return
    for (const line of lastOrder.lines) {
      if (!line.slug) continue
      const product = bySlug(line.slug)
      if (!product || product.mode !== 'buy') continue
      const { colour, size } = resolveVariant(product, line.variant)
      addToCart({ slug: line.slug, qty: line.qty, colour: colour ?? product.colours[0]?.id ?? '', size })
    }
    setReordered(true)
    openDrawer('cart')
  }

  const savedProducts = saved.map(bySlug).filter((p): p is Product => p !== undefined)

  return (
    <>
      <AccountPanel
        title="Reorder"
        intro="Anything you have bought before, ready to go back in the basket."
      >
        {lastOrder === undefined ? (
          <EmptyNote>Loading your last order…</EmptyNote>
        ) : lastOrder === null ? (
          <EmptyNote>
            Nothing to reorder yet. Orders placed from now on will appear here, so a repeat job starts
            from the last one instead of from scratch.
            <br />
            <Link to="/shop" className="mt-2 inline-block text-brand underline underline-offset-2">
              Browse the shop
            </Link>
          </EmptyNote>
        ) : (
          <div className="rounded-xl border border-line p-4">
            <p className="font-display text-[14px] font-semibold text-ink">{lastOrder.id}</p>
            <ul className="mt-2 space-y-1 text-[13px] text-muted">
              {lastOrder.lines.map((line, i) => (
                <li key={i}>
                  {line.qty}× {line.name}
                  {line.variant ? `, ${line.variant}` : ''}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-4" onClick={reorder}>
              {reordered ? 'Added again' : 'Reorder these items'}
            </Button>
          </div>
        )}
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
        {savedProducts.length === 0 ? (
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
