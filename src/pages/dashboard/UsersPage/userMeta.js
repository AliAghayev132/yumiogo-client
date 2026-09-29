/** "Leyla Həsənova" (falls back to the e-mail). */
export const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || 'User'

// Status tabs above the table (server counts keys).
export const USER_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
]
export const USER_STATUSES = USER_STATUS_TABS.map((t) => t.value)

// Text colour of the Status value in the quick-profile modal (Figma: green "Active").
export const STATUS_TEXT = {
  active: 'text-success',
  pending: 'text-warning',
  suspended: 'text-warning',
  banned: 'text-error',
}

// "Suspend" dialog lengths (days; '' = until restored by an admin).
export const SUSPEND_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '', label: 'Until restored' },
]
