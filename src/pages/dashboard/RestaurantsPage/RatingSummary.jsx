import { Smile, Meh, Frown, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge, formatNumber } from '@components'
import { likedSummary } from './restaurantMeta'

// App design: green liked · orange fine · red disliked.
const PARTS = [
  { key: 'liked', label: 'Liked', icon: Smile, bar: 'bg-brand', text: 'text-brand-hover' },
  { key: 'fine', label: 'Fine', icon: Meh, bar: 'bg-primary', text: 'text-primary' },
  { key: 'disliked', label: 'Disliked', icon: Frown, bar: 'bg-danger', text: 'text-danger' },
]

const reviewsText = (n) => `${formatNumber(n)} ${n === 1 ? 'review' : 'reviews'}`

/** "😊 Liked 111 · 😐 Fine 12 · ☹ Disliked 5" with face icons. */
const Counts = ({ summary }) => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-secondary">
    {PARTS.map(({ key, label, icon: Icon, text }) => (
      <li key={key} className="inline-flex items-center gap-1.5">
        <Icon className={clsx('h-4 w-4', text)} strokeWidth={2.25} aria-hidden="true" />
        {label} <span className="font-semibold text-ink">{formatNumber(summary[key])}</span>
      </li>
    ))}
  </ul>
)

/**
 * RatingSummary — the app's liked-percentage block: big "87%" + "liked", "128 reviews" on the
 * right, a green / orange / red bar and the three counts. Under the minimum review count it
 * shows a "New" badge, the review count and the counts, without a percentage.
 */
export const RatingSummary = ({ summary, minReviews }) => {
  if (!summary?.total) {
    return <p className="text-sm text-ink-muted">No published reviews yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        {summary.isNew ? (
          <div className="flex items-center gap-2">
            <Badge tone="info" size="lg">
              New
            </Badge>
            <span className="text-xs text-ink-muted">
              The liked % shows from {formatNumber(minReviews)} reviews.
            </span>
          </div>
        ) : (
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[40px] font-semibold leading-none text-ink">{summary.likedPercent}%</span>
            <span className="text-sm font-medium text-ink-secondary">liked</span>
          </p>
        )}
        <span className="shrink-0 text-sm text-ink-muted">{reviewsText(summary.total)}</span>
      </div>

      {!summary.isNew && (
        <div
          className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-subtle"
          role="img"
          aria-label={`${summary.likedPercent}% liked`}
        >
          {PARTS.map(({ key, bar }) =>
            summary[key] > 0 ? (
              <span key={key} className={clsx('h-full', bar)} style={{ width: `${(summary[key] / summary.total) * 100}%` }} />
            ) : null
          )}
        </div>
      )}

      <Counts summary={summary} />
    </div>
  )
}

/**
 * LikedCell — compact table value: "87% liked" (green face) or a "New" badge, with the star
 * average underneath. Rows without reviewStats (older server) show the star rating only.
 */
export const LikedCell = ({ restaurant: r, minReviews }) => {
  const summary = likedSummary(r.reviewStats, minReviews)
  const stars = r.reviewCount ? Number(r.rating || 0).toFixed(1) : null
  const starLine = (
    <span className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-star text-star" />
      {stars || '—'}
    </span>
  )
  if (!summary) return starLine
  return (
    <div className="flex flex-col gap-0.5">
      {!summary.total ? (
        <span className="text-ink-disabled">—</span>
      ) : summary.isNew ? (
        <span title={`${reviewsText(summary.total)} — the liked % shows from ${minReviews}`}>
          <Badge tone="info" size="sm">
            New
          </Badge>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5" title={`${summary.liked} of ${summary.total} liked`}>
          <Smile className="h-4 w-4 text-brand-hover" strokeWidth={2.25} />
          <span className="font-semibold text-ink">{summary.likedPercent}%</span>
          <span className="text-xs text-ink-muted">liked</span>
        </span>
      )}
      {stars && <span className="text-[11px] text-ink-muted">{starLine}</span>}
    </div>
  )
}
