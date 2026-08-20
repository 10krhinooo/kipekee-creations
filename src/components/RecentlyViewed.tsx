import { Link } from 'react-router-dom'
import { useCatalogue } from '../store/catalogue'
import { money } from '../lib/format'
import { swatch } from '../lib/swatch'
import { useSaved } from '../store/saved'

/**
 * A strip of the products this visitor has already opened.
 *
 * Renders nothing until there are at least two, because a strip showing the one
 * product you are already looking at is noise.
 */
export function RecentlyViewed({ exclude, title = 'Recently viewed' }: { exclude?: string; title?: string }) {
  const { bySlug } = useCatalogue()
  const { recent } = useSaved()

  const items = recent
    .filter((slug) => slug !== exclude)
    .map((slug) => bySlug(slug))
    .filter((p) => p !== undefined)

  if (items.length < 2) return null

  return (
    <section className="mt-14">
      <h2 className="mb-4 text-[15px] font-semibold tracking-wide text-ink">{title}</h2>
      {/* Horizontal scroll rather than a wrapping grid: this is a footnote to
          the page, not another product grid competing with the real one. */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {items.map((p, i) => (
          <Link
            key={p.slug}
            to={`/product/${p.slug}`}
            className="w-36 shrink-0 rounded-xl border border-line bg-white p-2 transition-colors hover:border-brand"
          >
            <img
              src={swatch(p.pattern, p.colours[0].swatch || p.accent, i)}
              alt=""
              loading="lazy"
              className="aspect-4/5 w-full rounded-lg object-cover"
            />
            <span className="mt-2 block truncate text-[12px] font-medium text-ink">{p.name}</span>
            <span className="block text-[11px] text-muted">
              {p.mode === 'quote' ? 'from ' : ''}
              {money(p.price)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
