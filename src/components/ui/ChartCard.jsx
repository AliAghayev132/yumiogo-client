import { clsx } from 'clsx'
import { Tabs } from './Tabs'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

/**
 * ChartCard — Figma chart-card (1274:8054): white card, radius 12, #E0E0E0 border, 18px
 * padding; header = title (DM Sans 700 14/18 #212121) + subtitle (Inter 400 12/16 #757575)
 * with period tabs or actions on the right, 16px below the header.
 *
 *   <ChartCard title="New users" subtitle={`Last ${days} days`}
 *              periods={['7d', '30d', '90d']} period={period} onPeriodChange={setPeriod}>
 *     <ResponsiveContainer height={200}>…</ResponsiveContainer>
 *   </ChartCard>
 *
 * Props: title, subtitle, actions, periods / period / onPeriodChange (Tabs variant="period"),
 * divider (full-width divider under the header — "Recent activity" card), loading (skeleton
 * of `height`), empty (true or { title, description, icon } → EmptyState), height (skeleton /
 * empty-state height, 200), className, bodyClassName.
 */
export const ChartCard = ({
  title,
  subtitle,
  actions,
  periods,
  period,
  onPeriodChange,
  divider = false,
  loading = false,
  empty,
  height = 200,
  children,
  className,
  bodyClassName,
}) => {
  const emptyProps = empty && typeof empty === 'object' ? empty : {}
  return (
    <section className={clsx('flex flex-col rounded-xl border border-line bg-surface p-[18px]', className)}>
      {(title || subtitle || actions || periods) && (
        <div
          className={clsx(
            'flex items-start justify-between gap-4',
            divider ? '-mx-[18px] mb-4 border-b border-line px-[18px] pb-4' : 'pb-4'
          )}
        >
          <div className="min-w-0">
            {title && <h3 className="text-sm font-bold leading-[18px] text-ink">{title}</h3>}
            {subtitle && (
              <p className="font-chart text-xs leading-4 tracking-[-0.02em] text-ink-muted">{subtitle}</p>
            )}
          </div>
          {(periods || actions) && (
            <div className="flex shrink-0 items-center gap-2">
              {periods && (
                <Tabs variant="period" items={periods} value={period} onChange={onPeriodChange} aria-label="Period" />
              )}
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={clsx('min-h-0 flex-1', bodyClassName)}>
        {loading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : empty ? (
          <div className="flex items-center justify-center" style={{ minHeight: height }}>
            <EmptyState
              compact
              icon={emptyProps.icon}
              title={emptyProps.title || 'No data yet'}
              description={emptyProps.description}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
