import { cx } from '../ui'
import { useRenderTier } from './TierProvider'

/**
 * Lets a visitor overrule the capability probe, in both directions.
 *
 * Labelled by consequence rather than by technology: "uses less data" is the
 * thing a shopper on a metered Kenyan bundle is actually deciding about, and
 * "3D" versus "WebGL" is not a choice most people can make. The flat option is
 * never presented as degraded, because for a lot of this audience it is simply
 * the better one.
 *
 * The 3D option is offered even on a device the probe scored as 2D. The probe
 * reads headroom, not intent, and it can be wrong; a visitor who wants to try
 * should be allowed to.
 */
export function TierToggle({ className }: { className?: string }) {
  const { tier, setTier } = useRenderTier()

  // Nothing to choose between until the probe has settled.
  if (tier === 'probing') return null

  const options = [
    { id: '3d' as const, label: '3D view' },
    { id: '2d' as const, label: 'Flat view' },
  ]

  return (
    <div className={cx('flex items-center gap-2', className)}>
      <div className="flex gap-1 rounded-full bg-shell p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTier(option.id)}
            aria-pressed={tier === option.id}
            className={cx(
              'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              tier === option.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {tier === '2d' && <span className="text-[12px] text-muted">Uses less data</span>}
    </div>
  )
}
