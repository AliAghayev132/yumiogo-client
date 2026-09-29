// Status tabs of the Restaurants table (server counts keys; "trash" = soft-deleted, ?deleted=true).
// "closed" is a legacy status: its tab only shows while some restaurant still has it.
export const RESTAURANT_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed', legacy: true },
  { value: 'trash', label: 'Trash' },
]
export const RESTAURANT_TABS = RESTAURANT_STATUS_TABS.map((t) => t.value)

export const RESTAURANT_SORTS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviews' },
  { value: 'views', label: 'Most viewed' },
  { value: 'saves', label: 'Most saved' },
]

// Detail page tabs (?tab=).
export const DETAIL_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'general', label: 'General' },
  { value: 'hours', label: 'Hours' },
  { value: 'media', label: 'Media' },
  { value: 'menu', label: 'Menu' },
]

const num = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v))

/** Settings price bands are configured when at least one level has a maxPrice. */
export const priceBandsConfigured = (levels = []) => levels.some((l) => num(l?.maxPrice) !== null)

/**
 * Price level key for an average price with the admin bands (maxPrice = exclusive upper
 * bound) — mirrors server utils/pricing.derivePriceLevel. null when it can't be derived.
 */
export const derivePriceLevel = (avgPrice, levels = []) => {
  const avg = num(avgPrice)
  if (avg === null || !levels.length || !priceBandsConfigured(levels)) return null
  for (const level of levels) {
    const max = num(level.maxPrice)
    if (max === null || avg < max) return level.key
  }
  return levels[levels.length - 1].key
}

/** Card price text: "10 - 65₼" with a range, else "32₼" — mirrors server priceLabel. */
export const priceLabel = ({ priceMin, priceMax, avgPrice } = {}) => {
  const fmt = (v) => String(Math.round(v * 100) / 100)
  const min = num(priceMin)
  const max = num(priceMax)
  if (min !== null && max !== null) return min === max ? `${fmt(min)}₼` : `${fmt(min)} - ${fmt(max)}₼`
  const single = min ?? max ?? num(avgPrice)
  return single === null ? '' : `${fmt(single)}₼`
}

/** /admin/meta priceLevels are { key, label, hint, maxPrice }; tolerate the old string list. */
export const toPriceLevels = (levels = []) =>
  levels.map((level) => (typeof level === 'string' ? { key: level, label: level, hint: '', maxPrice: null } : level))

/** Active catalog city (it carries the centre coordinates) by name. */
export const findCity = (catalog, name) => catalog?.cities?.find((c) => c.name === name) || null
