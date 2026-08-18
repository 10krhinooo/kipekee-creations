import { bySlug } from '../data/catalogue'
import { useSaved } from '../store/saved'
import { ProductCard } from '../components/ProductCard'
import { Button, Container, SectionHeading } from '../components/ui'
import { RecentlyViewed } from '../components/RecentlyViewed'

/**
 * Saved products, in the order they were saved, newest first.
 *
 * Reuses `ProductCard` rather than inventing a saved-item row, so the heart,
 * the compare control and quick-add all behave exactly as they do in the shop.
 */
export function Wishlist() {
  const { saved } = useSaved()
  const items = saved.map((slug) => bySlug(slug)).filter((p) => p !== undefined)

  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="Saved"
        title="Your saved products"
        intro={
          items.length
            ? 'Kept on this device. Add them to a cart or a quote list whenever you are ready.'
            : undefined
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-shell px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-ink">Nothing saved yet</p>
          <p className="mx-auto mt-2 mb-6 max-w-md text-[14px] leading-relaxed text-muted">
            Tap the heart on any product to keep it here while you decide. Saved products stay on
            this device, so there is nothing to sign up for.
          </p>
          <Button to="/shop">Browse the shop</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      )}

      <RecentlyViewed />
    </Container>
  )
}
