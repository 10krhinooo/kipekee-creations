import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Stars, cx } from '../../components/ui'
import { Card, EmptyState, PageHeader, Segmented } from '../components/AdminUI'
import { setReviewPublished, useReviews, type ReviewRow } from '../data/api'

type Filter = 'all' | 'live' | 'hidden'

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * The review queue, across the whole catalogue.
 *
 * Reviews publish the moment they are written, so this is the only thing
 * standing between the shop and whatever somebody types into it. Hidden ones
 * stay listed rather than disappearing, because the alternative is a hide
 * nobody can undo.
 */
export function Reviews() {
  const { data, loading, error, reload } = useReviews()
  const [filter, setFilter] = useState<Filter>('all')
  const [saving, setSaving] = useState<number | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const reviews = data ?? []
  const rows = reviews.filter((r) =>
    filter === 'live' ? r.isPublished : filter === 'hidden' ? !r.isPublished : true,
  )

  const options: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: reviews.length },
    { id: 'live', label: 'On the shop', count: reviews.filter((r) => r.isPublished).length },
    { id: 'hidden', label: 'Hidden', count: reviews.filter((r) => !r.isPublished).length },
  ]

  const toggle = async (review: ReviewRow) => {
    setSaving(review.id)
    const result = await setReviewPublished(review.productSlug, review.id, !review.isPublished)
    setSaving(null)
    if (result.ok) {
      setProblem(null)
      reload()
    } else {
      setProblem(result.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        intro="Everything customers have written, newest first. Hiding one takes it off the shop and corrects the product's score with it."
      />

      {loading && <p className="mb-5 text-sm text-muted">Loading reviews…</p>}
      {(error || problem) && <p className="mb-5 text-sm text-brand">{error ?? problem}</p>}

      <div className="mb-5">
        <Segmented options={options} value={filter} onChange={setFilter} />
      </div>

      {rows.length === 0 && !loading ? (
        <EmptyState
          title="Nothing here"
          body={
            filter === 'hidden'
              ? 'No reviews have been hidden.'
              : 'No reviews have been written yet.'
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((review) => (
            <Card key={review.id} className={cx(!review.isPublished && 'bg-shell')}>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <Stars rating={review.rating} />
                <span className="text-[13px] font-semibold text-ink">{review.author}</span>
                {review.authorEmail && (
                  <span className="text-[12px] text-muted">{review.authorEmail}</span>
                )}
                <span className="text-[12px] text-muted">
                  {[review.location, dateFmt(review.createdAt)].filter(Boolean).join(' · ')}
                </span>
                {!review.isPublished && (
                  <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-muted">
                    Hidden
                  </span>
                )}
                <Link
                  to={`/product/${review.productSlug}`}
                  className="ml-auto text-[12.5px] text-brand hover:underline"
                >
                  {review.productName}
                </Link>
              </div>

              <p className="text-[14px] leading-relaxed text-ink-soft">{review.body}</p>

              <div className="mt-3">
                <button
                  onClick={() => void toggle(review)}
                  disabled={saving === review.id}
                  className="text-[12.5px] font-medium text-brand hover:underline disabled:opacity-45"
                >
                  {saving === review.id
                    ? 'Saving…'
                    : review.isPublished
                      ? 'Hide from the shop'
                      : 'Put back on the shop'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
