import { differenceInCalendarDays, format, isValid } from 'date-fns'

const toDate = (value) => {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return isValid(d) ? d : null
}

/**
 * timeAgo — Figma activity style: "just now", "2m ago", "5h ago", "3d ago", then "Jan 5"
 * (with the year when it differs).
 */
export const timeAgo = (value, now = Date.now()) => {
  const d = toDate(value)
  if (!d) return ''
  const s = Math.max(0, (now - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`
  return format(d, new Date(now).getFullYear() === d.getFullYear() ? 'MMM d' : 'MMM d, yyyy')
}

/** relativeDay — Figma Reports "Date" column: "Today", "Yesterday", "2d ago" … "Mar 4". */
export const relativeDay = (value, now = new Date()) => {
  const d = toDate(value)
  if (!d) return ''
  const days = differenceInCalendarDays(now, d)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return format(d, now.getFullYear() === d.getFullYear() ? 'MMM d' : 'MMM d, yyyy')
}

/** monthYear — Figma Users "Joined" column: "Jan 2025". */
export const monthYear = (value) => {
  const d = toDate(value)
  return d ? format(d, 'MMM yyyy') : ''
}

/** formatNumber — en-US grouping used across the Figma ("24,831", "1,240"). */
export const formatNumber = (n, opts) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-US', opts) : '—')
