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

// Date presets → `from` (start of the local day N days ago); "custom" = the From / To fields.
export const DATE_OPTIONS = [
  { value: 'today', label: 'Today', days: 0 },
  { value: '7d', label: 'Last 7 days', days: 6 },
  { value: '30d', label: 'Last 30 days', days: 29 },
  { value: '90d', label: 'Last 90 days', days: 89 },
  { value: '365d', label: 'Last 12 months', days: 364 },
  { value: 'custom', label: 'Custom range' },
]

const startOfDayAgo = (days) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// "2026-10-01" (date input) → local start / end of that day as ISO, or undefined.
const dayEdge = (day, end = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return undefined
  const [y, m, d] = day.split('-').map(Number)
  const date = end ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/** Filter-menu value (+ the custom { from, to } days) → date range params. */
export const dateParams = (value, range = {}) => {
  if (value === 'custom') return { from: dayEdge(range.from), to: dayEdge(range.to, true) }
  const preset = DATE_OPTIONS.find((o) => o.value === value)
  return preset ? { from: startOfDayAgo(preset.days) } : {}
}

/** Page state → GET /admin/reviews params (empty values dropped). */
export const reviewQueryParams = ({ status, search, filters, restaurant, user, range }) => {
  const params = {
    status: status && status !== 'all' ? status : undefined,
    search: search || undefined,
    sentiment: filters.sentiment || undefined,
    sort: filters.sort || undefined,
    restaurant: restaurant?._id || undefined,
    user: user || undefined,
    ...dateParams(filters.date, range),
  }
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
}
