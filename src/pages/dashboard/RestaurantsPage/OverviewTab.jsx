import { Link } from 'react-router'
import { Star, MessageSquareMore, Bookmark, Eye, ListChecks, UtensilsCrossed, Flag, ChevronRight, Clock } from 'lucide-react'
import { StatCard, ChartCard, ProgressList, EmptyState, StatusPill, UserCell, Banner, formatNumber, timeAgo } from '@components'
import { useSentiments } from '@store/hooks'
import { formatDateTime } from '@utils'

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()

const ListCard = ({ title, subtitle, empty, count, children }) => (
  <ChartCard title={title} subtitle={subtitle} divider className="pb-2" bodyClassName="-mx-[18px]">
    {count ? <div className="flex flex-col">{children}</div> : <EmptyState compact title={empty} className="py-6" />}
  </ChartCard>
)

const rowLink = 'flex items-center gap-3 px-[18px] py-3 transition-colors hover:bg-canvas'

/**
 * Restaurant detail — live numbers (rating, reviews, saves, views, lists, menu items),
 * review sentiment, the moderation queue for this restaurant, latest reviews and reports.
 */
export const OverviewTab = ({ restaurant: r, stats = {}, recentReviews = [], reports = [] }) => {
  const sentiments = useSentiments()
  const sentimentRows = sentiments.map((s) => ({
    key: s.key,
    label: `${s.emoji ? `${s.emoji} ` : ''}${s.label}`,
    value: stats.sentiment?.[s.key] || 0,
    color: s.color,
  }))

  const cards = [
    { key: 'rating', icon: Star, tone: 'orange', label: 'Rating', value: r.reviewCount ? Number(r.rating || 0) : '—', decimals: 1 },
    { key: 'reviews', icon: MessageSquareMore, tone: 'purple', label: 'Published reviews', value: stats.reviews ?? 0 },
    { key: 'saves', icon: Bookmark, tone: 'pink', label: 'Saves', value: stats.saves ?? 0 },
    { key: 'views', icon: Eye, tone: 'blue', label: 'Views', value: stats.views ?? 0 },
    { key: 'lists', icon: ListChecks, tone: 'green', label: 'In lists', value: stats.lists ?? 0 },
    { key: 'menu', icon: UtensilsCrossed, tone: 'amber', label: 'Menu items', value: stats.menuItems ?? 0 },
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Review sentiment" subtitle="Published reviews" empty={!stats.reviews && { title: 'No reviews yet' }} height={120}>
          <ProgressList items={sentimentRows} total={stats.reviews || 0} format={(v, pct) => `${formatNumber(v)} · ${pct}%`} />
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

        <ListCard title="Latest reviews" subtitle={`${formatNumber(r.reviewCount || 0)} published`} empty="No reviews yet" count={recentReviews.length}>
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
                  {rep.reporter ? ` · by ${fullName(rep.reporter)}` : ''}
                </p>
              </div>
              <StatusPill status={rep.status} entity="report" />
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
            </Link>
          ))}
        </ListCard>
      </div>
    </div>
  )
}
