import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Users, Store, MessageSquareMore, CircleAlert, Bookmark, Activity, Star, Hourglass, UserCheck } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import {
  StatCard,
  ChartCard,
  IconTile,
  Banner,
  Skeleton,
  chartAxisProps,
  chartGridProps,
  chartTooltipProps,
  chartColors,
  timeAgo,
  formatNumber,
} from '@components'
import { useGetStatsQuery, useGetAnalyticsQuery } from '@store/api'
import { RatingDonut } from './RatingDonut'

const PERIODS = ['7d', '30d', '90d']

// Recent-activity row icon per item type (Figma: green people_alt for users, purple reviews).
const ACTIVITY_ICONS = {
  user: { icon: Users, tone: 'green' },
  review: { icon: MessageSquareMore, tone: 'purple' },
  report: { icon: CircleAlert, tone: 'red' },
  restaurant: { icon: Store, tone: 'orange' },
  list: { icon: Bookmark, tone: 'pink' },
}

const ActivityRow = ({ item }) => {
  const meta = ACTIVITY_ICONS[item.type] || { icon: Activity, tone: 'neutral' }
  const content = (
    <>
      <IconTile icon={meta.icon} tone={meta.tone} />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-[18px]">
        <span className="text-ink">{item.title}</span> <span className="text-ink-muted">{item.detail}</span>
      </p>
      <span className="shrink-0 text-sm leading-[18px] text-ink-disabled">{timeAgo(item.at)}</span>
    </>
  )
  const row = 'flex items-center gap-3 rounded-lg px-6 py-2.5'
  return item.link ? (
    <Link to={item.link} className={`${row} transition-colors hover:bg-canvas`}>
      {content}
    </Link>
  ) : (
    <div className={row}>{content}</div>
  )
}

// "Total users · 12 new in 7 days" — the period's additions under each total.
const newIn = (label, count, days) => (count ? `${label} · ${formatNumber(count)} new in ${days} days` : label)

/**
 * Dashboard (Figma 1263:21808): 4 stat cards with trends (period = the chart tabs) and the
 * period's new items, a "waiting for you" row (average rating, pending reviews / restaurants /
 * users with links to the filtered tables), New users chart with 7d / 30d / 90d tabs, Reviews
 * by rating donut, Recent activity with links to the moderation pages.
 */
export const DashboardPage = () => {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('7d')
  const days = parseInt(period, 10)

  // The sidebar polls the default (7 days) entry — share it.
  const stats = useGetStatsQuery(days === 7 ? undefined : { days })
  const analytics = useGetAnalyticsQuery({ range: period }, { refetchOnMountOrArgChange: 60 })

  const s = stats.data?.data?.stats || {}
  const activity = stats.data?.data?.activity || []
  const a = analytics.data?.data || {}
  const series = a.series || []
  const statsLoading = stats.isLoading || (stats.isFetching && !stats.data)

  // Trends: new users / restaurants / reviews vs the previous period; pending reports = open now
  // vs open when the period started (openReportsChange — reportsChange compares new reports filed).
  const cards = [
    { key: 'users', icon: Users, tone: 'blue', value: s.totalUsers, label: newIn('Total users', s.newUsers, days), trend: s.usersChange, to: '/dashboard/users' },
    { key: 'restaurants', icon: Store, tone: 'orange', value: s.totalRestaurants, label: newIn('Restaurants', s.newRestaurants, days), trend: s.restaurantsChange, to: '/dashboard/restaurants' },
    { key: 'reviews', icon: MessageSquareMore, tone: 'purple', value: s.totalReviews, label: newIn('Total reviews', s.newReviews, days), trend: s.reviewsChange, to: '/dashboard/reviews' },
    {
      key: 'reports',
      icon: CircleAlert,
      tone: 'red',
      value: s.openReports,
      label: newIn('Pending reports', s.newReports, days),
      trend: s.openReportsChange,
      invertTrend: true,
      to: '/dashboard/reports?status=active',
    },
  ]
  const queue = [
    { key: 'rating', icon: Star, tone: 'orange', value: s.avgRating || 0, decimals: 2, label: 'Average review score', to: '/dashboard/analytics' },
    { key: 'pendingReviews', icon: MessageSquareMore, tone: 'purple', value: s.pendingReviews, label: 'Reviews waiting (pending + flagged)', to: '/dashboard/reviews?status=pending' },
    { key: 'pendingRestaurants', icon: Hourglass, tone: 'amber', value: s.pendingRestaurants, label: 'Restaurants awaiting approval', to: '/dashboard/restaurants?status=pending' },
    { key: 'pendingUsers', icon: UserCheck, tone: 'green', value: s.pendingUsers, label: 'Users awaiting approval', to: '/dashboard/users?status=pending' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {stats.isError && (
        <Banner tone="error" action={{ label: 'Retry', onClick: stats.refetch }}>
          Could not load the dashboard numbers.
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, to, ...card }) => (
          <StatCard key={key} {...card} value={card.value ?? 0} loading={statsLoading} onClick={() => navigate(to)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {queue.map(({ key, to, ...card }) => (
          <StatCard key={key} {...card} value={card.value ?? 0} loading={statsLoading} onClick={() => navigate(to)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,684fr)_minmax(0,448fr)]">
        <ChartCard
          title="New users"
          subtitle={a.range?.label || `Last ${days} days`}
          periods={PERIODS}
          period={period}
          onPeriodChange={setPeriod}
          loading={analytics.isLoading}
          empty={analytics.isError && { title: 'Could not load the chart', description: 'Try again in a moment.' }}
        >
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="label" {...chartAxisProps} interval="preserveStartEnd" minTickGap={12} />
                <YAxis hide allowDecimals={false} />
                <Tooltip {...chartTooltipProps} formatter={(v) => [formatNumber(v), 'New users']} />
                <Bar dataKey="users" name="New users" fill={chartColors.users} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Reviews by rating"
          subtitle="All time"
          loading={analytics.isLoading}
          empty={
            analytics.isError
              ? { title: 'Could not load the chart' }
              : !analytics.isLoading && !a.totalReviews && { title: 'No reviews yet' }
          }
          bodyClassName="flex items-center"
        >
          <RatingDonut buckets={a.ratingDistribution} average={a.averageScore} />
        </ChartCard>
      </div>

      <ChartCard
        title="Recent activity"
        divider
        className="pb-4"
        bodyClassName="-mx-[18px] px-2"
        empty={!statsLoading && !stats.isError && !activity.length && { title: 'No activity yet' }}
        height={120}
      >
        {statsLoading ? (
          <div className="flex flex-col gap-3 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {activity.map((item) => (
              <ActivityRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  )
}
