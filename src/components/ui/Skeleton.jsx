import { clsx } from 'clsx'

/** Shimmering placeholder block. */
export const Skeleton = ({ className, style }) => (
  <div
    className={clsx('animate-pulse bg-subtle', !/\brounded/.test(className || '') && 'rounded-md', className)}
    style={style}
  />
)

/** Lines of text placeholder. */
export const SkeletonText = ({ lines = 3, className }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={clsx('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
)

/**
 * Table placeholder — Figma table rhythm (32px #F5F5F5 header, 60px rows, avatar circle).
 * For a table that is already rendered, prefer <Table.Loading /> inside <Table.Body>.
 */
export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div>
    <div className="flex h-8 items-center gap-6 bg-subtle px-6">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1 bg-line/70" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex h-[60px] items-center gap-6 px-6">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
        </div>
        {Array.from({ length: cols - 1 }).map((_, c) => (
          <Skeleton key={c} className="h-3.5 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

/** Stat-card placeholder grid — Figma stat-card anatomy (tile + pill, number, label). */
export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-start justify-between pb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
    ))}
  </div>
)

/** Chart-card placeholder (title, subtitle, chart area). */
export const SkeletonChart = ({ height = 200, className }) => (
  <div className={clsx('rounded-xl border border-line bg-surface p-[18px]', className)}>
    <Skeleton className="h-3.5 w-32" />
    <Skeleton className="mt-2 h-3 w-20" />
    <Skeleton className="mt-6 w-full" style={{ height }} />
  </div>
)
