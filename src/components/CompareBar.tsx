import { useCatalogue } from '../store/catalogue'
import { swatch } from '../lib/swatch'
import { useSaved } from '../store/saved'
import { Button, Container } from './ui'

/**
 * The sticky bar that appears once two products are selected for comparison.
 *
 * Bottom-left with right padding rather than centred: the WhatsApp button is
 * fixed bottom-right at z-30, and on a phone a centred bar puts its call to
 * action directly underneath it.
 */
export function CompareBar() {
  const { bySlug } = useCatalogue()
  const { compare, toggleCompare, clearCompare } = useSaved()

  const items = compare.map((slug) => bySlug(slug)).filter((p) => p !== undefined)
  if (items.length < 2) return null

  const href = `/compare?slugs=${items.map((p) => p.slug).join(',')}`

  return (
    <>
      {/* A spacer of the bar's own height, in normal flow. Without it the fixed
          bar covers the last rows of whatever is underneath, which on the
          compare page is the row of buttons the bar exists to lead to. */}
      <div aria-hidden className="h-[76px]" />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <Container wide className="flex items-center gap-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {items.map((p, i) => (
              <button
                key={p.slug}
                onClick={() => toggleCompare(p.slug)}
                aria-label={`Remove ${p.name} from compare`}
                className="group relative shrink-0"
              >
                <img
                  src={swatch(p.pattern, p.colours[0].swatch || p.accent, i)}
                  alt=""
                  className="h-12 w-10 rounded-lg object-cover"
                />
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] leading-none text-white">
                  &times;
                </span>
              </button>
            ))}
            <button
              onClick={clearCompare}
              className="shrink-0 px-2 text-[12px] text-muted underline hover:text-brand"
            >
              Clear
            </button>
          </div>

          <Button size="sm" to={href} className="shrink-0">
            Compare ({items.length})
          </Button>

          {/* Clears the WhatsApp button, which is fixed at this same corner and
              grows a label at sm. A padding utility on the Container loses to
              its own `lg:px-10` on breakpoint order, so this is a spacer. */}
          <div aria-hidden className="w-12 shrink-0 sm:w-40" />
        </Container>
      </div>
    </>
  )
}
