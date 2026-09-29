/**
 * Reports page helpers — filter options and how a report's target is named / linked.
 */

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Open & in review' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]
export const STATUS_VALUES = STATUS_OPTIONS.map((o) => o.value)

export const TYPE_OPTIONS = [
  { value: 'review', label: 'Review' },
  { value: 'user', label: 'User' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'list', label: 'List' },
]
export const TYPE_VALUES = TYPE_OPTIONS.map((o) => o.value)

// Type pill tones (Figma: Review blue, User amber, Restaurant grey); lists get purple.
export const TYPE_TONES = { list: 'purple' }

export const ACTION_LABELS = {
  none: 'No action on the item',
  hide_review: 'Review hidden',
  delete_review: 'Review deleted',
  remove_list: 'List removed',
}

/** "Leyla H." — or "System" for reports without a reporter (Figma Reports). */
export const shortName = (user) =>
  user ? `${user.firstName || ''}${user.lastName ? ` ${user.lastName[0]}.` : ''}`.trim() || 'Unknown' : 'System'

export const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown'

/** Target column text: "Review #4821", a user / restaurant / list name. */
export const targetText = (report) => {
  const t = report.target
  if (report.targetType === 'review') return t?.number ? `Review #${t.number}` : report.targetLabel || 'Review'
  return t?.name || report.targetLabel || '—'
}

/** Admin page of the reported item (lists have none). */
export const targetLink = (report) => {
  const id = report.targetId
  switch (report.targetType) {
    case 'review':
      return `/dashboard/reviews?review=${id}`
    case 'user':
      return `/dashboard/users/${id}`
    case 'restaurant':
      return `/dashboard/restaurants/${id}`
    case 'list':
      return `/dashboard/lists?list=${id}`
    default:
      return null
  }
}

export const isClosed = (report) => report.status === 'resolved' || report.status === 'dismissed'
