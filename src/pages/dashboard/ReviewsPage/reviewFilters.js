/**
 * Reviews page filters — status tabs, the Filter menu groups and their
 * mapping to GET /admin/reviews query params.
 */

// Tabs above the table (server counts: { all, pending, approved, flagged, rejected }).
export const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]
export const STATUS_VALUES = STATUS_TABS.map((t) => t.value)

export const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating_high', label: 'Highest rating' },
  { value: 'rating_low', label: 'Lowest rating' },
  { value: 'popular', label: 'Most liked' },
]

// Date presets → `from` (start of the local day N days ago).
export const DATE_OPTIONS = [
  { value: 'today', label: 'Today', days: 0 },
  { value: '7d', label: 'Last 7 days', days: 6 },
  { value: '30d', label: 'Last 30 days', days: 29 },
  { value: '90d', label: 'Last 90 days', days: 89 },
  { value: '365d', label: 'Last 12 months', days: 364 },
]

const startOfDayAgo = (days) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Filter-menu value → date range params. */
export const dateParams = (value) => {
  const preset = DATE_OPTIONS.find((o) => o.value === value)
  return preset ? { from: startOfDayAgo(preset.days) } : {}
}

/** Page state → GET /admin/reviews params (empty values dropped). */
export const reviewQueryParams = ({ status, search, filters, restaurant }) => {
  const params = {
    status: status && status !== 'all' ? status : undefined,
    search: search || undefined,
    sentiment: filters.sentiment || undefined,
    sort: filters.sort || undefined,
    restaurant: restaurant?._id || undefined,
    ...dateParams(filters.date),
  }
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
}
