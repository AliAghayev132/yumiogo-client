import { clsx } from 'clsx'

/** Shimmering placeholder block. */
export const Skeleton = ({ className }) => (
  <div className={clsx('animate-pulse rounded-md bg-gray-200/80', className)} />
)

/** Table placeholder — matches the admin table rhythm. */
export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div className="p-4 space-y-3">
    <div className="flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 py-2">
        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        {Array.from({ length: cols - 1 }).map((_, c) => (
          <Skeleton key={c} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

/** Stat-card placeholder grid. */
export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-16 mt-3" />
        <Skeleton className="h-3 w-20 mt-3" />
      </div>
    ))}
  </div>
)
