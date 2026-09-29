// Taxonomy types managed under Catalog (mirrors server TAXONOMY_TYPES).
// Drives the /dashboard/catalog/:type routes, the sidebar and TaxonomyPage copy.
// "dining" = dining options (Breakfast, Brunch…) on restaurants; "reviewLabel" = the
// review "Labels & dishes" chips, grouped under headings ("Good for", "What was wrong?").
// `plural` (default: label) names the list in the table-card title ("All dietary options").
export const TAXONOMY_TYPES = {
  cuisine: { label: 'Cuisines', singular: 'Cuisine' },
  feature: { label: 'Features', singular: 'Feature' },
  tag: { label: 'Tags', singular: 'Tag' },
  dietary: { label: 'Dietary', singular: 'Dietary option', plural: 'Dietary options' },
  dining: { label: 'Dining options', singular: 'Dining option' },
  mood: { label: 'Moods', singular: 'Mood' },
  reportReason: { label: 'Report reasons', singular: 'Report reason' },
  reviewLabel: { label: 'Review labels', singular: 'Review label' },
}

export const isTaxonomyType = (type) => Object.hasOwn(TAXONOMY_TYPES, type ?? '')
