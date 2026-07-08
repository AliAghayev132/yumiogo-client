import { format, formatDistanceToNow, isValid } from 'date-fns'

/**
 * Format a date as `DD.MM.YYYY`.
 * Accepts a Date, an ISO string, or a timestamp.
 *
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatDate = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) return ''
  return format(date, 'dd.MM.yyyy')
}

/**
 * Format a date with time as `DD.MM.YYYY HH:mm`.
 *
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatDateTime = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) return ''
  return format(date, 'dd.MM.yyyy HH:mm')
}

/**
 * Human friendly relative time, e.g. "3 hours ago".
 *
 * @param {Date|string|number} value
 * @returns {string}
 */
export const formatRelative = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}
