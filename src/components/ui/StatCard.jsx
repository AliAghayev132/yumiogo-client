import { clsx } from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  className,
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div
              className={clsx(
                'flex items-center gap-1 mt-2 text-sm',
                changeColors[changeType]
              )}
            >
              {changeType === 'positive' && <TrendingUp className="w-4 h-4" />}
              {changeType === 'negative' && <TrendingDown className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && <div className="p-3 bg-green-50 rounded-lg text-green-600">{icon}</div>}
      </div>
    </div>
  )
}
