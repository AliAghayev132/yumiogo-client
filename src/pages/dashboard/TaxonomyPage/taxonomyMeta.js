/**
 * Per-type copy for the Catalog pages: what each list drives in the app and what its
 * usage count counts.
 */

export const HELP = {
  cuisine:
    'Cuisines restaurants are tagged with. They drive the Home cuisine rail, search filters and suggestions. Items switched on under Onboarding are offered as food preferences when someone first opens the app (all active cuisines while none is switched on).',
  feature: "Amenities listed on a restaurant's More tab (Wi-Fi, parking, delivery…), each with its icon.",
  tag: 'Short label chips shown on restaurant cards (Local dishes, Trendy, Halal…).',
  dietary:
    'Dietary options restaurants can offer. Users filter by them and pick them as food preferences; items switched on under Onboarding are offered when someone first opens the app (all active items while none is switched on).',
  dining:
    'Dining options restaurants offer (Breakfast, Brunch, Lunch, Catering…). Shown on the restaurant profile and used by the dining filter in search.',
  mood: 'The "Perfect for…" moods on Search. Tapping one lists the restaurants tagged with it.',
  reportReason:
    'Reasons offered when a review, restaurant, user or list is reported. Renaming one also updates existing reports.',
  reviewLabel:
    'Chips people add to a review in "Labels & dishes", grouped under headings such as "Good for" and "What was wrong?". Renaming one updates existing reviews.',
}

// What usageCount counts per type.
export const USAGE_NOUN = { reportReason: 'report', reviewLabel: 'review' }
export const usageNoun = (type) => USAGE_NOUN[type] || 'restaurant'

// Types whose names are also stored in user food preferences.
export const PREFERENCE_TYPES = ['cuisine', 'dietary']

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`
