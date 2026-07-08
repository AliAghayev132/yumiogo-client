// Generic option lists shared across the app. Keep these in sync with the
// server enums (server/constants/shared/enums.js).

// Post status (matches server postStatus enum).
export const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

// User roles (matches server userRoles enum).
export const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
]

// Map a status value to a Badge variant for consistent coloring.
export const statusBadgeVariant = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
}
