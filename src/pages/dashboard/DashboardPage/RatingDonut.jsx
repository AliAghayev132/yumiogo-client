import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { chartColors, chartTooltipProps, formatNumber } from '@components'

/**
 * Figma "Reviews by rating" (Dashboard 1263:21808): 120px donut (5★ green, 4★ yellow,
 * 3★ orange, 1–2★ red) with the average score in the centre (DM Sans 700 16) and a legend of
 * dot + label (#757575 12) + bold share (#212121 12).
 * `buckets` = analytics.ratingDistribution [{ key, label, count, percent }], `average` = 4.62.
 */
export const RatingDonut = ({ buckets = [], average = 0 }) => {
  const data = buckets.map((b, i) => ({ ...b, fill: chartColors.rating[i % chartColors.rating.length] }))
  const total = data.reduce((sum, b) => sum + (b.count || 0), 0)

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="relative h-[120px] w-[120px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total ? data : [{ key: 'empty', label: 'No reviews', count: 1, fill: '#F5F5F5' }]}
              dataKey="count"
              nameKey="label"
              innerRadius={40}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {(total ? data : [{ fill: '#F5F5F5' }]).map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            {total > 0 && (
              <Tooltip
                {...chartTooltipProps}
                formatter={(value, name) => [`${formatNumber(value)} reviews`, name]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-base font-bold text-ink">
          {total ? Number(average || 0).toFixed(1) : '—'}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {data.map((b) => (
          <li key={b.key} className="flex items-center gap-2 text-xs leading-4">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.fill }} />
            <span className="w-16 text-ink-muted">{b.label}</span>
            <span className="font-bold text-ink" title={`${formatNumber(b.count)} reviews`}>
              {Math.round(b.percent || 0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
