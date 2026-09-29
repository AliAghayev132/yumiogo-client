/*
 * Status → pill tone + display label, per the Figma tables.
 *   users:        Active (green), Suspended (amber), Banned (red)
 *   restaurants:  Active (green), Pending (amber), Suspended (red; the server's `closed`)
 *   reviews:      Approved (green), Pending (amber), Flagged (red)
 *   reports:      Open (red), In review (amber), Resolved (green), Dismissed (grey)
 *   reportType:   Review (blue), User (amber), Restaurant (grey)
 */
const BASE = {
  active: ['success', 'Active'],
  approved: ['success', 'Approved'],
  resolved: ['success', 'Resolved'],
  published: ['success', 'Published'],
  verified: ['success', 'Verified'],
  enabled: ['success', 'Enabled'],
  pending: ['warning', 'Pending'],
  in_review: ['warning', 'In review'],
  suspended: ['warning', 'Suspended'],
  warned: ['warning', 'Warned'],
  draft: ['neutral', 'Draft'],
  inactive: ['neutral', 'Inactive'],
  hidden: ['neutral', 'Hidden'],
  disabled: ['neutral', 'Disabled'],
  dismissed: ['neutral', 'Dismissed'],
  archived: ['neutral', 'Archived'],
  banned: ['error', 'Banned'],
  flagged: ['error', 'Flagged'],
  open: ['error', 'Open'],
  rejected: ['error', 'Rejected'],
  closed: ['error', 'Closed'],
  deleted: ['error', 'Deleted'],
  admin: ['purple', 'Admin'],
  user: ['neutral', 'User'],
}

const BY_ENTITY = {
  restaurant: { closed: ['error', 'Suspended'], suspended: ['error', 'Suspended'] },
  reportType: { review: ['info', 'Review'], user: ['warning', 'User'], restaurant: ['neutral', 'Restaurant'] },
}

const humanise = (s) => {
  const text = String(s ?? '').replace(/[_-]+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

/**
 * statusMeta('closed', 'restaurant') → { tone: 'error', label: 'Suspended' }
 * Unknown values fall back to a neutral pill with a capitalised label.
 */
export const statusMeta = (status, entity) => {
  const key = String(status ?? '').toLowerCase().replace(/[\s-]+/g, '_')
  const hit = BY_ENTITY[entity]?.[key] || BASE[key]
  return hit ? { tone: hit[0], label: hit[1] } : { tone: 'neutral', label: humanise(status) }
}
