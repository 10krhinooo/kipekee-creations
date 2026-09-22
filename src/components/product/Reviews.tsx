import { useCallback, useEffect, useState } from 'react'
import type { Product } from '../../data/types'
import { api, post } from '../../lib/api'
import { useAuth } from '../../auth/AuthProvider'
import { Badge, Button, Stars, cx } from '../ui'

/**
 * Product reviews: the summary, the list, and the form.
 *
 * Two things here are deliberate corrections of what the prototype did.
 *
 * The rating distribution used to be the literal numbers 78/16/4/1/1 on every
 * product regardless of its reviews. It is computed now. A shopper who counts
 * four reviews under a bar chart claiming seventy-eight percent of something
 * has learnt that the numbers on this site are decoration, and that is an
 * expensive thing to teach them on a product page.
 *
 * "Verified purchase" used to print on every review. It is earned now: the
 * stand-in checks the reviewer's account against the orders it has recorded,
 * and the badge appears only when it finds the product on one of them.
 */

interface ApiReview {
  id: number
  author: string
  rating: number
  title: string
  body: string
  createdAt: string
  verified: boolean
}

/** One shape for the list, whichever source a review came from. */
interface Entry {
  key: string
  author: string
  rating: number
  title?: string
  body: string
  when: string
  verified: boolean
}

const STARS = [5, 4, 3, 2, 1]

const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * Customer-submitted reviews for a product.
 *
 * Lifted out of the panel because the page header and the tab label have to
 * agree with the list. They used to read `product.reviewCount`, a catalogue
 * figure between 17 and 62 on products carrying two or three sample reviews,
 * so the tab said "Reviews (34)" above a list of three.
 */
export function useProductReviews(slug: string) {
  const [submitted, setSubmitted] = useState<ApiReview[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const result = await api.get<ApiReview[]>(`/api/products/${slug}/reviews`)
    if (result.ok) setSubmitted(result.data)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    setLoading(true)
    void reload()
  }, [reload])

  return { submitted, loading, reload }
}

/** Count and average over the sample set plus anything customers have added. */
export function reviewSummary(product: Product, submitted: ApiReview[]) {
  const ratings = [...submitted.map((r) => r.rating), ...product.reviews.map((r) => r.rating)]
  const count = ratings.length
  return {
    count,
    average: count
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / count) * 10) / 10
      : 0,
  }
}

export function Reviews({
  product,
  submitted,
  loading,
  reload,
}: {
  product: Product
  submitted: ApiReview[]
  loading: boolean
  reload: () => Promise<void>
}) {
  const { user } = useAuth()
  const load = reload

  /*
   * Catalogue reviews first, then anything customers have written. The
   * catalogue set is sample content and carries no purchase to verify against,
   * so it never claims one.
   */
  const entries: Entry[] = [
    ...submitted.map<Entry>((r) => ({
      key: `api-${r.id}`,
      author: r.author,
      rating: r.rating,
      title: r.title || undefined,
      body: r.body,
      when: dayOf(r.createdAt),
      verified: r.verified,
    })),
    ...product.reviews.map<Entry>((r) => ({
      key: `cat-${r.author}-${r.date}`,
      author: r.author,
      rating: r.rating,
      body: r.body,
      when: `${r.location} · ${r.date}`,
      verified: false,
    })),
  ]

  const { count: total, average } = reviewSummary(product, submitted)
  const counts = STARS.map((star) => entries.filter((e) => Math.round(e.rating) === star).length)

  const mine = user ? submitted.some((r) => r.author === user.name) : false

  return (
    <div className="max-w-3xl">
      {total === 0 ? (
        <p className="rounded-panel bg-shell p-6 text-[15px] text-muted-foreground">
          No reviews yet. {user ? 'Be the first.' : 'Sign in to be the first.'}
        </p>
      ) : (
        <div className="mb-8 flex flex-wrap items-center gap-6 rounded-panel bg-shell p-6">
          <div className="text-center">
            <p className="font-display text-4xl font-bold text-ink">{average}</p>
            <Stars rating={average} />
            <p className="mt-1 text-[12px] text-muted-foreground">
              {total} {total === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Computed from the list beside it, so the bars and the reviews
              below can never disagree. */}
          <div className="min-w-48 flex-1 space-y-1.5">
            {STARS.map((star, i) => {
              const share = total ? Math.round((counts[i] / total) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 text-muted-foreground">{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-star" style={{ width: `${share}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{share}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ReviewForm product={product} alreadyReviewed={mine} onDone={load} />

      {loading ? (
        <p className="py-6 text-[14px] text-muted-foreground">Loading reviews…</p>
      ) : (
        <ul className="divide-y divide-line">
          {entries.map((e) => (
            <li key={e.key} className="py-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <Stars rating={e.rating} />
                <span className="text-sm font-semibold">{e.author}</span>
                <span className="text-[12px] text-muted-foreground">{e.when}</span>
                {e.verified && <Badge tone="stock">Verified purchase</Badge>}
              </div>
              {e.title && <p className="mb-1 font-display text-[15px] font-semibold">{e.title}</p>}
              <p className="text-[15px] leading-relaxed text-ink-soft">{e.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReviewForm({
  product,
  alreadyReviewed,
  onDone,
}: {
  product: Product
  alreadyReviewed: boolean
  onDone: () => Promise<void>
}) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <div className="mb-8 rounded-panel border border-line p-5">
        <p className="text-[15px] font-medium text-ink">Bought this? Tell other shoppers.</p>
        <p className="mt-1 mb-3 text-[13px] leading-relaxed text-muted-foreground">
          Reviews come from signed-in customers, which is what lets us show a real verified badge
          rather than putting one on everything.
        </p>
        <Button size="sm" variant="outline" to={`/login?next=/product/${product.slug}`}>
          Sign in to review
        </Button>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <p className="mb-8 rounded-panel border border-line bg-shell p-5 text-[14px] text-muted-foreground">
        Thanks, you have already reviewed this product. Get in touch on WhatsApp if you would like
        to change it.
      </p>
    )
  }

  if (!open) {
    return (
      <div className="mb-8">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Write a review
        </Button>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return

    if (rating === 0) {
      setError('Choose a rating from one to five stars.')
      return
    }
    if (body.trim().length < 20) {
      setError('Tell us a little more, at least twenty characters.')
      return
    }

    setError(null)
    setSending(true)
    const result = await post(`/api/products/${product.slug}/reviews`, {
      rating,
      title: title.trim(),
      body: body.trim(),
    })
    setSending(false)

    if (!result.ok) {
      setError(result.message)
      return
    }
    setOpen(false)
    setRating(0)
    setTitle('')
    setBody('')
    await onDone()
  }

  return (
    <form onSubmit={submit} className="mb-8 rounded-panel border border-line p-5">
      <h3 className="mb-4 font-display text-[17px] font-semibold text-ink">
        Review {product.name}
      </h3>

      <fieldset className="mb-4">
        <legend className="mb-2 text-[13px] font-medium text-ink">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRating(star)
                if (error) setError(null)
              }}
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
              aria-pressed={rating === star}
              className={cx(
                'rounded-full p-1 transition-colors',
                star <= rating ? 'text-star' : 'text-star-empty hover:text-star',
              )}
            >
              <svg viewBox="0 0 20 20" className="h-7 w-7" fill="currentColor">
                <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="review-title">
        Headline <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <input
        id="review-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        placeholder="Hangs beautifully"
        className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />

      <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="review-body">
        Your review
      </label>
      <textarea
        id="review-body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          if (error) setError(null)
        }}
        rows={4}
        maxLength={1200}
        placeholder="What arrived, how it fitted, how it has held up."
        aria-describedby="review-count"
        className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
      <p id="review-count" className="mt-1 text-[12px] text-muted-foreground">
        {body.trim().length < 20
          ? `${20 - body.trim().length} more characters`
          : `${body.length} of 1200`}
      </p>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-brand">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button type="submit" size="sm" disabled={sending} loading={sending}>
          {sending ? 'Posting' : 'Post review'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        Published under {user.name}. We show a verified badge only where our records show you
        ordered this product.
      </p>
    </form>
  )
}
