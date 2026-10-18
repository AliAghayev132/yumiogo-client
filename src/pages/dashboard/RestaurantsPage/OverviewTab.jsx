import { useState } from 'react'
import { Link } from 'react-router'
import {
  Star,
  MessageSquareMore,
  Bookmark,
  Eye,
  ListChecks,
  UtensilsCrossed,
  Flag,
  ChevronRight,
  Clock,
  Bell,
  BadgeCheck,
} from 'lucide-react'
import {
  StatCard,
  ChartCard,
  EmptyState,
  StatusPill,
  TrendPill,
  UserCell,
  Banner,
  Button,
  Pagination,
  Skeleton,
  formatNumber,
  timeAgo,
} from '@components'
import { useGetRestaurantFollowersQuery } from '@store/api'
import { useRatingDisplay } from '@store/hooks'
import { formatDateTime } from '@utils'
import { RatingSummary } from './RatingSummary'
import { likedSummary } from './restaurantMeta'

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()
const FOLLOWERS_PAGE = 5

const ListCard = ({ title, subtitle, empty, count, actions, children }) => (
  <ChartCard title={title} subtitle={subtitle} actions={actions} divider className="pb-2" bodyClassName="-mx-[18px]">
    {count ? <div className="flex flex-col">{children}</div> : <EmptyState compact title={empty} className="py-6" />}
  </ChartCard>
)

const rowLink = 'flex items-center gap-3 px-[18px] py-3 transition-colors hover:bg-canvas'

const ViewAll = ({ to }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline">
    View all <ChevronRight className="h-3 w-3" />
  </Link>
)

// % change of this week vs last week (null when there is nothing to compare).
const weekTrend = (now = 0, before = 0) => (before ? Math.round(((now - before) / before) * 100) : now ? 100 : null)

/**
 * Rolling activity windows (restaurant.stats, refreshed by the server's RestaurantStatsService):
 * views / saves / reviews for 7 days, the 7 days before and 30 days, the 30-day rating and the
 * scores behind "Top this week", trending and "On the rise".
 */
const ActivityCard = ({ stats = {} }) => {
  const rows = [
    { key: 'views', label: 'Views', now: stats.views7d, before: stats.viewsPrev7d, month: stats.views30d },
    { key: 'saves', label: 'Saves', now: stats.saves7d, before: stats.savesPrev7d, month: stats.saves30d },
    { key: 'reviews', label: 'Reviews', now: stats.reviews7d, before: stats.reviewsPrev7d, month: stats.reviews30d },
  ]
  const scores = [
    { label: 'Rating (30 days)', value: stats.rating30d ? Number(stats.rating30d).toFixed(1) : '—' },
    { label: 'Popularity (7 days)', value: formatNumber(stats.popularity7d || 0) },
    { label: 'Trending score (30 days)', value: formatNumber(stats.trending30d || 0) },
    { label: 'Rise vs last week', value: `${stats.rise > 0 ? '+' : ''}${formatNumber(stats.rise || 0)}` },
  ]
  return (
    <ChartCard
      title="Activity"
      subtitle={stats.updatedAt ? `Rolling windows · updated ${timeAgo(stats.updatedAt)}` : 'Rolling windows · not computed yet'}
      divider
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-muted">
            <th className="pb-2 font-medium" />
            <th className="pb-2 text-right font-medium">7 days</th>
            <th className="pb-2 text-right font-medium">Previous 7</th>
            <th className="pb-2 text-right font-medium">30 days</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <td className="py-2 text-ink-muted">{r.label}</td>
              <td className="py-2 text-right font-semibold text-ink">
                <span className="inline-flex items-center gap-2">
                  {weekTrend(r.now, r.before) !== null && <TrendPill value={weekTrend(r.now, r.before)} />}
                  {formatNumber(r.now || 0)}
                </span>
              </td>
              <td className="py-2 text-right text-ink-secondary">{formatNumber(r.before || 0)}</td>
              <td className="py-2 text-right text-ink-secondary">{formatNumber(r.month || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {scores.map((s) => (
          <div key={s.label} className="rounded-lg bg-subtle px-3 py-2">
            <dt className="text-xs text-ink-muted">{s.label}</dt>
            <dd className="font-display text-base font-semibold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
    </ChartCard>
  )
}

/** People following the restaurant (GET /admin/restaurants/:id/followers), paged. */
const FollowersCard = ({ restaurantId, count }) => {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, refetch } = useGetRestaurantFollowersQuery({
    id: restaurantId,
    page,
    limit: FOLLOWERS_PAGE,
  })
  const followers = data?.data?.followers || []
  const total = data?.data?.pagination?.total ?? count ?? 0

  return (
    <ChartCard
      title="Followers"
      subtitle={`${formatNumber(total)} following · notified about discounts and new dishes`}
      divider
      className="pb-2"
      bodyClassName="-mx-[18px]"
    >
      {isLoading ? (
        <div className="flex flex-col gap-3 px-[18px] pb-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          compact
          title="Could not load the followers"
          className="py-6"
          action={
            <Button size="sm" variant="outline" onClick={refetch}>
              Retry
            </Button>
          }
        />
      ) : followers.length ? (
        <>
          <div className={`flex flex-col ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
            {followers.map((f, i) =>
              f._id && !f.isDeleted ? (
                <Link key={f._id} to={`/dashboard/users/${f._id}`} className={rowLink}>
                  <UserCell user={f} subtitle={f.email} className="min-w-0 flex-1" />
                  {f.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" aria-label="Verified" />}
                  {f.status !== 'active' && <StatusPill status={f.status} entity="user" />}
                  <span className="shrink-0 text-xs text-ink-disabled">{timeAgo(f.followedAt)}</span>
                </Link>
              ) : (
                <div key={f._id || `deleted-${i}`} className="flex items-center gap-3 px-[18px] py-3">
                  <UserCell name="Deleted user" className="min-w-0 flex-1" />
                  <span className="shrink-0 text-xs text-ink-disabled">{timeAgo(f.followedAt)}</span>
                </div>
              )
            )}
          </div>
          {total > FOLLOWERS_PAGE && (
            <Pagination page={page} total={total} limit={FOLLOWERS_PAGE} onPageChange={setPage} itemLabel="followers" />
          )}
        </>
      ) : (
        <EmptyState compact title="No followers yet" className="py-6" />
      )}
    </ChartCard>
  )
}

/**
 * Restaurant detail — live numbers (rating, reviews, saves, views, lists, followers, menu items,
 * open reports), rolling 7 / 30-day activity, the liked % summary (restaurant.reviewStats, or
 * "New" under Settings.ratingDisplay.minReviewsForPercent), the moderation queue for this
 * restaurant, latest reviews (every status), reports and followers.
 */
export const OverviewTab = ({ restaurant: r, stats = {}, recentReviews = [], reports = [] }) => {
  const { minReviewsForPercent } = useRatingDisplay()
  const liked = likedSummary(r.reviewStats, minReviewsForPercent, stats.sentiment)
  const followers = stats.followers ?? r.followerCount ?? 0

  const cards = [
    { key: 'rating', icon: Star, tone: 'orange', label: 'Rating', value: r.reviewCount ? Number(r.rating || 0) : '—', decimals: 1 },
    { key: 'reviews', icon: MessageSquareMore, tone: 'purple', label: 'Published reviews', value: stats.reviews ?? 0 },
    { key: 'saves', icon: Bookmark, tone: 'pink', label: 'Saves', value: stats.saves ?? 0 },
    { key: 'views', icon: Eye, tone: 'blue', label: 'Views', value: stats.views ?? 0 },
    { key: 'lists', icon: ListChecks, tone: 'green', label: 'In lists', value: stats.lists ?? 0 },
    { key: 'followers', icon: Bell, tone: 'amber', label: 'Followers', value: followers },
    { key: 'menu', icon: UtensilsCrossed, tone: 'orange', label: 'Menu items', value: stats.menuItems ?? 0 },
    { key: 'reports', icon: Flag, tone: 'red', label: 'Open reports', value: stats.openReports ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-6">
      {(stats.pendingReviews > 0 || stats.openReports > 0) && (
        <Banner tone="warning">
          {[
            stats.pendingReviews > 0 &&
              `${formatNumber(stats.pendingReviews)} ${stats.pendingReviews === 1 ? 'review is' : 'reviews are'} waiting for moderation`,
            stats.openReports > 0 && `${formatNumber(stats.openReports)} open ${stats.openReports === 1 ? 'report' : 'reports'}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityCard stats={r.stats} />

        <ChartCard
          title="Ratings"
          subtitle={`Published reviews · the app shows the liked % from ${formatNumber(minReviewsForPercent)} reviews`}
          divider
          empty={!liked?.total && { title: 'No reviews yet' }}
          height={120}
        >
          <RatingSummary summary={liked} minReviews={minReviewsForPercent} />
        </ChartCard>

        <ChartCard title="Listing" subtitle="Moderation and history" divider>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink-muted">Status</dt>
            <dd>
              <StatusPill status={r.isDeleted ? 'deleted' : r.status} entity="restaurant" label={r.isDeleted ? 'In trash' : undefined} />
            </dd>
            {r.statusReason && (
              <>
                <dt className="text-ink-muted">Reason</dt>
                <dd className="text-ink">{r.statusReason}</dd>
              </>
            )}
            {r.moderatedAt && (
              <>
                <dt className="text-ink-muted">Last moderated</dt>
                <dd className="text-ink">
                  {formatDateTime(r.moderatedAt)}
                  {r.moderatedBy ? ` by ${fullName(r.moderatedBy)}` : ''}
                </dd>
              </>
            )}
            <dt className="text-ink-muted">Added</dt>
            <dd className="text-ink">
              {formatDateTime(r.createdAt)}
              {r.createdBy ? ` by ${fullName(r.createdBy)}` : ''}
            </dd>
            {r.publishedAt && (
              <>
                <dt className="text-ink-muted">Published</dt>
                <dd className="text-ink">{formatDateTime(r.publishedAt)}</dd>
              </>
            )}
            <dt className="text-ink-muted">Last updated</dt>
            <dd className="text-ink">{timeAgo(r.updatedAt)}</dd>
            <dt className="text-ink-muted">Slug</dt>
            <dd className="truncate font-mono text-xs text-ink-secondary">{r.slug}</dd>
          </dl>
        </ChartCard>

        <ListCard
          title="Latest reviews"
          subtitle={`Every status · ${formatNumber(r.reviewCount || 0)} published${
            stats.pendingReviews ? ` · ${formatNumber(stats.pendingReviews)} waiting` : ''
          }`}
          empty="No reviews yet"
          count={recentReviews.length}
          actions={recentReviews.length > 0 && <ViewAll to={`/dashboard/reviews?restaurant=${r._id}`} />}
        >
          {recentReviews.map((rv) => (
            <Link key={rv._id} to={`/dashboard/reviews?review=${rv._id}`} className={rowLink}>
              <UserCell user={rv.user} short className="w-36 shrink-0" />
              <p className="min-w-0 flex-1 truncate text-sm text-ink-secondary">{rv.comment || 'No comment'}</p>
              <StatusPill status={rv.status || 'approved'} entity="review" />
              <span className="shrink-0 text-xs text-ink-disabled">{timeAgo(rv.createdAt)}</span>
            </Link>
          ))}
        </ListCard>

        <ListCard title="Reports" subtitle={`${formatNumber(stats.openReports || 0)} open`} empty="No reports" count={reports.length}>
          {reports.map((rep) => (
            <Link key={rep._id} to={`/dashboard/reports?report=${rep._id}`} className={rowLink}>
              <Flag className="h-5 w-5 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {rep.number ? `#${rep.number} · ` : ''}
                  {rep.reason}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
                  <Clock className="h-3 w-3" /> {timeAgo(rep.createdAt)}
                  {rep.reporter ? ` · by ${fullName(rep.reporter)}` : ' · System'}
                </p>
              </div>
              <StatusPill status={rep.status} entity="report" />
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
            </Link>
          ))}
        </ListCard>

        <FollowersCard restaurantId={r._id} count={followers} />
      </div>
    </div>
  )
}
