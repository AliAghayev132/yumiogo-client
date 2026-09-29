/**
 * Weekly opening hours: admin form state <-> Restaurant.hours.
 *
 * Restaurant.hours = { mon: { open: "HH:mm", close: "HH:mm", closed }, ... }
 * (server contract). A close time earlier than the open time means the slot
 * runs past midnight; equal times mean open around the clock. Days left
 * empty are not sent.
 */

export const WEEK_DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

// "9:00" → "09:00" (<input type="time"> only accepts two-digit hours).
const toTimeValue = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim())
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

/** Restaurant.hours (plain object, any days missing) → form state for all 7 days. */
export const toHoursState = (hours) =>
  Object.fromEntries(
    WEEK_DAYS.map(({ key }) => {
      const entry = hours?.[key]
      return [
        key,
        { open: toTimeValue(entry?.open), close: toTimeValue(entry?.close), closed: !!entry?.closed },
      ]
    })
  )

const isDaySet = ({ open, close, closed }) => closed || (!!open && !!close)

export const hasAnyHours = (state) => WEEK_DAYS.some(({ key }) => isDaySet(state[key]))

export const isMondaySet = (state) => isDaySet(state.mon)

/** Copy Monday's row to every other day. */
export const copyMondayToAll = (state) =>
  Object.fromEntries(WEEK_DAYS.map(({ key }) => [key, { ...state.mon }]))

/** Form state → { hours } for the API, or { error } when a day has only one time. */
export const toHoursPayload = (state) => {
  const hours = {}
  for (const { key, label } of WEEK_DAYS) {
    const { open, close, closed } = state[key]
    if (closed) {
      hours[key] = { open, close, closed: true }
      continue
    }
    if (!open && !close) continue
    if (!open || !close) return { error: `Set both the opening and closing time for ${label}` }
    hours[key] = { open, close, closed: false }
  }
  return { hours }
}

/** Short note shown next to a day row. */
export const describeDay = ({ open, close, closed }) => {
  if (closed) return 'Closed all day'
  if (!open && !close) return 'Not set'
  if (!open || !close) return 'Needs both times'
  if (open === close) return 'Open 24 hours'
  if (close < open) return 'Closes after midnight'
  return ''
}
