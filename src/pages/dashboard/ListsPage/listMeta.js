// Favourite list privacy (server favoritePrivacy) → label + badge tone.
export const PRIVACY = {
  public: { label: 'Public', tone: 'success' },
  collaborative: { label: 'Collaborative', tone: 'purple' },
  private: { label: 'Private', tone: 'neutral' },
}

// Tabs over GET /admin/lists counts: every live list, one per privacy, and the removed ones.
export const LIST_TABS = [
  { value: 'all', label: 'All', count: 'all' },
  { value: 'public', label: 'Public', count: 'public' },
  { value: 'collaborative', label: 'Collaborative', count: 'collaborative' },
  { value: 'private', label: 'Private', count: 'private' },
  { value: 'removed', label: 'Removed', count: 'deleted' },
]
export const TAB_VALUES = LIST_TABS.map((t) => t.value)

/** Tab → GET /admin/lists params. */
export const tabParams = (tab) =>
  tab === 'removed' ? { deleted: 'true' } : tab && tab !== 'all' ? { privacy: tab } : {}

export const ownerName = (owner) =>
  owner ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email || 'Unknown' : 'Deleted user'

/** Public share page of a list (the website's /list/:slug landing). */
export const shareUrl = (list) =>
  list?.shareSlug && typeof window !== 'undefined' ? `${window.location.origin}/list/${list.shareSlug}` : null
