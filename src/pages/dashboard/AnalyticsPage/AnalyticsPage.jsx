import { useState } from 'react'
import { Users, MessageSquareMore, Star, Bookmark } from 'lucide-react'
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
 * plus the activity series for a chosen range and the review rating / sentiment splits.
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
    </div>
  )
}
