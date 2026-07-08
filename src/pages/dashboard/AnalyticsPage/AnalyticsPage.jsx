import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, PageLoader } from '@components'
import { useGetAnalyticsQuery } from '@store/api'

const SENT_COLORS = { liked: '#22C55E', fine: '#FACC15', disliked: '#EF4444' }

export const AnalyticsPage = () => {
  const { data, isLoading } = useGetAnalyticsQuery()
  if (isLoading) return <PageLoader />

  const d = data?.data || {}
  const usersByDay = (d.usersByDay || []).map((x) => ({
    day: new Date(x.date).toLocaleDateString(undefined, { weekday: 'short' }),
    users: x.count,
  }))
  const sentiment = d.reviewsBySentiment || { liked: 0, fine: 0, disliked: 0 }
  const sentimentData = [
    { name: 'Liked it', key: 'liked', value: sentiment.liked },
    { name: 'It was fine', key: 'fine', value: sentiment.fine },
    { name: 'Didn’t like it', key: 'disliked', value: sentiment.disliked },
  ]
  const topRestaurants = (d.topRestaurants || []).map((r) => ({
    name: r.name.length > 14 ? `${r.name.slice(0, 14)}…` : r.name,
    reviews: r.reviewCount,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New users */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">New users — last 7 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={usersByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="users" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sentiment pie */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Reviews by sentiment</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {sentimentData.map((s) => (
                  <Cell key={s.key} fill={SENT_COLORS[s.key]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top restaurants */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">Top restaurants by reviews</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topRestaurants} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEE" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />
            <Bar dataKey="reviews" fill="#F97316" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
