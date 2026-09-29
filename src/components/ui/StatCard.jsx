import { clsx } from 'clsx'
import { CountUp } from './CountUp'
import { IconTile } from './IconTile'
import { Skeleton } from './Skeleton'

const PILL = {
  good: 'bg-success-soft text-success',
  bad: 'bg-error-soft text-error',
  neutral: 'bg-subtle text-ink-muted',
}

/**
 * TrendPill — Figma stat-card trend badge ("+12%", DM Sans 500 10/12, rounded-full,
 * #009951 on #EBFFEE when good, #B3261E on 10% red when bad).
 * value: number (12 → "+12%") or string ("-3%"); `invert` = an increase is bad (reports).
 */
export const TrendPill = ({ value, invert = false, tone, className }) => {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.+-]/g, ''))
  const label = typeof value === 'number' ? `${value > 0 ? '+' : ''}${value}%` : String(value)
  const direction = Number.isFinite(num) ? Math.sign(num) : 0
  const mood = tone || (direction === 0 ? 'neutral' : (direction > 0) !== invert ? 'good' : 'bad')
  return (
    <span
      className={clsx(
        'inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium leading-3 whitespace-nowrap',
        PILL[mood] || PILL.neutral,
        className
      )}
    >
      {label}
    </span>
  )
}

/**
 * StatCard — Figma stat-card (1270:22018): 271x138 incl. the 1px #E0E0E0 border, 16px padding, radius 12.
 * Row 1: 40px tinted icon tile ← → trend pill. Row 2: number (Plus Jakarta Sans 700 24/32).
 * Row 3: label (DM Sans 400 12/16 #757575).
 *
 * Props: label (alias: title), value (numbers count up; strings shown as-is), decimals,
 * icon (lucide), tone (green | blue | orange | purple | red | amber | pink — Figma: users blue,
 * restaurants orange, reviews purple, reports red, rating orange, saves pink), trend (12 |
 * "+12%"), invertTrend (increase is bad), loading, onClick, className.
 * Legacy: change ("+4% this week") + changeType (positive | negative | neutral).
 */
export const StatCard = ({
  label,
  title,
  value,
  decimals = 0,
  icon,
  tone = 'green',
  trend,
  invertTrend = false,
  change,
  changeType,
  loading = false,
  onClick,
  className,
}) => {
  const text = label ?? title
  const legacyTone = changeType === 'positive' ? 'good' : changeType === 'negative' ? 'bad' : changeType ? 'neutral' : undefined
  const pill = trend ?? change
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'flex w-full flex-col rounded-xl border border-line bg-surface p-4 text-left',
        onClick && 'transition-colors hover:border-ink-disabled',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-4">
        {icon ? <IconTile icon={icon} tone={tone} /> : <span className="h-10" />}
        {loading ? (
          <Skeleton className="h-4 w-10 rounded-full" />
        ) : (
          <TrendPill value={pill} invert={invertTrend} tone={trend === undefined ? legacyTone : undefined} />
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-20" />
        </>
      ) : (
        <>
          <p className="font-display text-2xl font-bold leading-8 text-ink">
            {typeof value === 'number' ? <CountUp value={value} decimals={decimals} /> : (value ?? '—')}
          </p>
          <p className="text-xs leading-4 text-ink-muted">{text}</p>
        </>
      )}
    </Tag>
  )
}
