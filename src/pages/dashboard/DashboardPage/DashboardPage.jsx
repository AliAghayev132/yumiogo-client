import { Users, Store, Star, Flag, Clock, UserPlus } from 'lucide-react'
import { StatCard, Card, SkeletonStats, Skeleton } from '@components'
import { useGetStatsQuery, useGetAnalyticsQuery } from '@store/api'

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export const DashboardPage = () => {
  const { data, isLoading } = useGetStatsQuery()
  const { data: analyticsData } = useGetAnalyticsQuery()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full mt-6" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-32 w-full mt-6" />
          </Card>
        </div>
      </div>
    )
  }

  const stats = data?.data?.stats || {}
  const activity = data?.data?.activity || []
  const usersByDay = analyticsData?.data?.usersByDay || []
  const sentiment = analyticsData?.data?.reviewsBySentiment || { liked: 0, fine: 0, disliked: 0 }

  const maxDay = Math.max(1, ...usersByDay.map((d) => d.count))
  const sentTotal = Math.max(1, sentiment.liked + sentiment.fine + sentiment.disliked)

  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers ?? 0,
      change: `${stats.usersChange >= 0 ? '+' : ''}${stats.usersChange ?? 0}% this week`,
      changeType: stats.usersChange >= 0 ? 'positive' : 'negative',
      icon: <Users className="w-5 h-5" />,
    },
    { title: 'Restaurants', value: stats.totalRestaurants ?? 0, icon: <Store className="w-5 h-5" /> },
    {
      title: 'Reviews',
      value: stats.totalReviews ?? 0,
      change: `${stats.reviewsChange >= 0 ? '+' : ''}${stats.reviewsChange ?? 0}% this week`,
      changeType: stats.reviewsChange >= 0 ? 'positive' : 'negative',
      icon: <Star className="w-5 h-5" />,
    },
    { title: 'Open Reports', value: stats.openReports ?? 0, icon: <Flag className="w-5 h-5" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.title} {...c} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">New users</h3>
            <p className="text-sm text-gray-400">Last 7 days</p>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {usersByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full max-w-9 bg-green-500 rounded-t-md transition-all"
                    style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 6 : 2 }}
                    title={`${d.count} users`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-1">Reviews by sentiment</h3>
          <p className="text-sm text-gray-400 mb-4">All time</p>
          {[
            { key: 'liked', label: '😊 Liked it', color: 'bg-green-500' },
            { key: 'fine', label: '🙂 It was fine', color: 'bg-yellow-400' },
            { key: 'disliked', label: '☹️ Didn’t like it', color: 'bg-red-500' },
          ].map((s) => (
            <div key={s.key} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{s.label}</span>
                <span className="text-gray-900 font-medium">{sentiment[s.key]}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.color} rounded-full`}
                  style={{ width: `${(sentiment[s.key] / sentTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">Recent activity</h3>
        <div className="space-y-3">
          {activity.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  a.type === 'user' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                }`}
              >
                {a.type === 'user' ? <UserPlus className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              </div>
              <p className="flex-1 min-w-0 text-sm text-gray-900">
                <span className="font-semibold">{a.title}</span> {a.detail}
              </p>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(a.at)}
              </span>
            </div>
          ))}
          {!activity.length && <p className="text-sm text-gray-400">No recent activity.</p>}
        </div>
      </Card>
    </div>
  )
}
