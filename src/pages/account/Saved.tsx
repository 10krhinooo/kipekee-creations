import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountPanel, EmptyNote } from './AccountLayout'
import { Notice } from '../../components/auth/AuthUI'
import { Button } from '../../components/ui'
import { api } from '../../lib/api'
import { bySlug } from '../../data/catalogue'
import { money } from '../../lib/format'
import { swatch } from '../../lib/swatch'

export function AccountSaved() {
  const [slugs, setSlugs] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    api.get<string[]>('/api/account/saved').then((r) => {
      if (r.ok) setSlugs(r.data)
      else {
        setSlugs([])
        setError(r.message)
      }
    })
  }, [])

  async function remove(slug: string) {
    // Removed locally first, then confirmed. A wishlist is low stakes and a
    // heart that waits on a round trip before responding feels broken.
    const previous = slugs ?? []
    setSlugs(previous.filter((s) => s !== slug))
    const result = await api.del(`/api/account/saved/${encodeURIComponent(slug)}`)
    if (!result.ok) {
      setSlugs(previous)
      setError(result.message)
    }
  }

  const products = (slugs ?? []).map((slug) => ({ slug, product: bySlug(slug) }))

  return (
    <AccountPanel
      title="Saved list"
      intro="Stored on your account, so it is the same list on every device you sign in on."
    >
      {error && (
        <div className="mb-4">
          <Notice onDismiss={clearError}>{error}</Notice>
        </div>
      )}

      {slugs === null ? (
        <EmptyNote>Loading your list…</EmptyNote>
      ) : products.length === 0 ? (
        <EmptyNote>
          Nothing saved yet. Tap the heart on any product to keep it here.
          <br />
          <Button to="/shop" size="sm" className="mt-4">
            Browse the shop
          </Button>
        </EmptyNote>
      ) : (
        <ul className="space-y-3">
          {products.map(({ slug, product }) => (
            <li
              key={slug}
              className="flex items-center gap-4 rounded-xl border border-line p-3"
            >
              {product ? (
                <>
                  <img
                    src={swatch(product.pattern, product.accent)}
                    alt=""
                    className="h-16 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="block truncate font-display text-[15px] font-semibold text-ink hover:text-brand"
                    >
                      {product.name}
                    </Link>
                    <p className="text-[13px] text-muted">
                      {product.mode === 'quote'
                        ? `Made to measure, from ${money(product.price)} ${product.unit}`
                        : `${money(product.price)} ${product.unit}`}
                    </p>
                  </div>
                </>
              ) : (
                // A slug that no longer resolves. The row stays rather than
                // vanishing silently, so somebody can see what happened and
                // clear it themselves.
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{slug}</p>
                  <p className="text-[13px] text-muted">No longer in the catalogue</p>
                </div>
              )}

              <button
                onClick={() => remove(slug)}
                title="Remove from your saved list"
                aria-label={`Remove ${product?.name ?? slug} from your saved list`}
                className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-sand hover:text-brand"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AccountPanel>
  )
}
