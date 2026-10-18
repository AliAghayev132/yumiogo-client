import { useState } from 'react'
import { Link } from 'react-router'
import { Users, MessageSquareMore, Star, Bookmark, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  StatCard,
  ChartCard,
  ProgressList,
  Banner,
  EmptyState,
  chartAxisProps,
  chartGridProps,
  chartTooltipProps,
  chartColors,
  formatNumber,
} from '@components'
import { useGetAnalyticsQuery } from '@store/api'
import { RatingDonut } from '../DashboardPage/RatingDonut'

const RANGES = ['7d', '30d', '90d', '6m', '12m']
const SERIES = [
  { key: 'users', label: 'New users', color: chartColors.users },
  { key: 'reviews', label: 'Reviews', color: chartColors.reviews },
  { key: 'saves', label: 'Saves', color: chartColors.series[2] },
]
// Restaurants by status rows, in the Restaurants tab order ("closed" is legacy: shown when used).
const STATUS_ORDER = ['active', 'pending', 'suspended', 'rejected', 'closed']
const STATUS_LABELS = { active: 'Active', pending: 'Pending', suspended: 'Suspended', rejected: 'Rejected', closed: 'Closed' }
const STATUS_COLORS = {
  active: chartColors.series[0],
  pending: chartColors.series[2],
  suspended: chartColors.series[3],
  rejected: chartColors.series[1],
  closed: chartColors.series[4],
}
// Figma "Top cuisines" bar colours: green, purple, orange, pink; "Other" grey.
const CUISINE_COLORS = [chartColors.series[0], chartColors.series[1], chartColors.series[2], chartColors.series[3]]
const OTHER_COLOR = chartColors.series[4]

const Legend = ({ items }) => (
  <div className="flex items-center gap-3">
    {items.map((s) => (
      <span key={s.key} className="inline-flex items-center gap-1.5 font-chart text-xs text-ink-muted">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
        {s.label}
      </span>
    ))}
  </div>
)

/**
 * Analytics (Figma 1278:457): this-month stat cards with change vs the same part of last
 * month, Platform growth (users vs reviews, last 6 months), Top cuisines by review count —
 * plus the activity series for a chosen range, the review rating / sentiment splits, the most
 * reviewed restaurants and the restaurants per moderation status.
 */
export const AnalyticsPage = () => {
  const [range, setRange] = useState('30d')
  const { data, isLoading, isFetching, isError, refetch } = useGetAnalyticsQuery(
    { range },
    { refetchOnMountOrArgChange: 60 }
  )
  const a = data?.data || {}
  const summary = a.summary || {}
  const loading = isLoading

  const cards = [
    { key: 'users', icon: Users, tone: 'blue', label: 'New users this month', stat: summary.newUsersThisMonth },
    { key: 'reviews', icon: MessageSquareMore, tone: 'purple', label: 'Reviews this month', stat: summary.reviewsThisMonth },
    { key: 'rating', icon: Star, tone: 'orange', label: 'Avg platform rating', stat: summary.avgRating, decimals: 2 },
    { key: 'saves', icon: Bookmark, tone: 'pink', label: 'Saves this month', stat: summary.savesThisMonth },
  ]

  const cuisines = (a.topCuisines || []).map((c, i) => ({
    key: c.name,
    label: c.name,
    value: c.percent,
    color: c.name === 'Other' && !c.slug ? OTHER_COLOR : CUISINE_COLORS[i % CUISINE_COLORS.length],
  }))
  const sentiment = (a.sentiment || []).map((s) => ({
    key: s.key,
    label: `${s.emoji ? `${s.emoji} ` : ''}${s.label}`,
    value: s.percent,
    color: s.color || undefined,
  }))
  const statusRows = Object.fromEntries((a.statusBreakdown || []).map((r) => [r._id, r.count]))
  const statusTotal = Object.values(statusRows).reduce((sum, n) => sum + n, 0)
  const statuses = [...STATUS_ORDER, ...Object.keys(statusRows).filter((k) => !STATUS_ORDER.includes(k))]
    .filter((key) => statusRows[key] || STATUS_ORDER.slice(0, 4).includes(key))
    .map((key) => ({
      key,
      label: STATUS_LABELS[key] || key,
      value: statusRows[key] || 0,
      color: STATUS_COLORS[key],
    }))
  const topRestaurants = a.topRestaurants || []

  return (
    <div className="flex flex-col gap-6">
      {isError && (
        <Banner tone="error" action={{ label: 'Retry', onClick: refetch }}>
          Could not load analytics.
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, stat, ...card }) => (
          <StatCard key={key} {...card} value={stat?.value ?? 0} trend={stat?.change ?? 0} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,684fr)_minmax(0,448fr)]">
        <ChartCard
          title="Platform growth"
          subtitle="Users vs Reviews — last 6 months"
          actions={<Legend items={[{ ...SERIES[0], label: 'Users' }, SERIES[1]]} />}
          loading={loading}
          empty={isError && { title: 'Could not load the chart' }}
        >
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.platformGrowth || []} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={4}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="label" {...chartAxisProps} />
                <YAxis hide allowDecimals={false} />
                <Tooltip {...chartTooltipProps} formatter={(v, name) => [formatNumber(v), name]} />
                <Bar dataKey="users" name="Users" fill={chartColors.users} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="reviews" name="Reviews" fill={chartColors.reviews} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Top cuisines"
          subtitle="By review count"
          loading={loading}
          empty={!loading && !cuisines.length && { title: 'No reviews yet' }}
        >
          <ProgressList items={cuisines} />
        </ChartCard>
      </div>

      <ChartCard
        title="Activity"
        subtitle={`${a.range?.label || 'Last 30 days'} — new users, reviews and saves`}
        periods={RANGES}
        period={range}
        onPeriodChange={setRange}
        actions={<Legend items={SERIES} />}
        loading={loading}
        empty={isError && { title: 'Could not load the chart' }}
      >
        <div className={`h-[240px] transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={a.series || []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="label" {...chartAxisProps} interval="preserveStartEnd" minTickGap={16} />
              <YAxis hide allowDecimals={false} />
              <Tooltip {...chartTooltipProps} cursor={{ stroke: '#E0E0E0' }} formatter={(v, name) => [formatNumber(v), name]} />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Reviews by rating"
          subtitle={`All time · ${formatNumber(a.totalReviews || 0)} reviews`}
          loading={loading}
          empty={!loading && !a.totalReviews && { title: 'No reviews yet' }}
          bodyClassName="flex items-center"
        >
          <RatingDonut buckets={a.ratingDistribution} average={a.averageScore} />
        </ChartCard>
        <ChartCard
          title="Review sentiment"
          subtitle="All time"
          loading={loading}
          empty={!loading && !a.totalReviews && { title: 'No reviews yet' }}
        >
          <ProgressList items={sentiment} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Top restaurants"
          subtitle="Live restaurants with the most reviews"
          divider
          loading={loading}
          className="pb-2"
          bodyClassName="-mx-[18px]"
        >
          {topRestaurants.length ? (
            <ol className="flex flex-col">
              {topRestaurants.map((r, i) => (
                <li key={r._id}>
                  <Link
                    to={`/dashboard/restaurants/${r._id}`}
                    className="flex items-center gap-3 px-[18px] py-2.5 transition-colors hover:bg-canvas"
                  >
                    <span className="w-5 shrink-0 font-display text-sm font-semibold text-ink-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{r.name}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm text-ink">
                      <Star className="h-3.5 w-3.5 fill-star text-star" />
                      {r.reviewCount ? Number(r.rating || 0).toFixed(1) : '—'}
                    </span>
                    <span className="w-24 shrink-0 text-right text-xs text-ink-muted">
                      {formatNumber(r.reviewCount || 0)} reviews
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState compact title="No live restaurants yet" className="py-6" />
          )}
        </ChartCard>
        <ChartCard
          title="Restaurants by status"
          subtitle={`${formatNumber(statusTotal)} listings (Trash not counted)`}
          loading={loading}
          empty={!loading && !statusTotal && { title: 'No restaurants yet' }}
        >
          <ProgressList items={statuses} total={statusTotal} format={(v, pct) => `${formatNumber(v)} · ${pct}%`} />
        </ChartCard>
      </div>
    </div>
  )
}
