/**
 * App config form helpers — Settings document ⇄ editable form ⇄ PUT body.
 *
 * The form keeps number inputs as strings (so a field can be empty while
 * typing); toPayload() turns it back into the API shape. validate() mirrors
 * the server rules in CatalogService.buildSettingsUpdate so most mistakes are
 * caught before saving. Keyed lists have a fixed key set: the admin edits
 * labels / order / visibility, never adds or removes keys.
 */

// Home feed sections (Settings.homeSections keys) — what each one shows.
export const HOME_SECTION_META = {
  cuisines: {
    label: 'Cuisines rail',
    hint: 'Cuisines marked "Show on Home" in Catalog → Cuisines.',
  },
  nearYou: { label: 'Near you', hint: 'Closest restaurants within the default search radius.' },
  discounted: { label: 'Discounts', hint: 'Restaurants with a discount, biggest discount first.' },
  recentlyViewed: {
    label: 'Recently viewed',
    hint: 'Restaurants the user opened lately (signed-in users; guests see their on-device history).',
  },
  recommends: {
    label: 'Recommends',
    hint: 'The recommendation tiles set up under Recommendations below.',
  },
  topWeek: {
    label: 'Top this week',
    hint: 'Two tabs: the most viewed and the most saved restaurants.',
    tabs: ['Most viewed tab', 'Most saved tab'],
  },
  surprise: { label: 'Surprise me card', hint: 'Promo card that opens Surprise me.', noLimit: true },
}

// What each sort key does (the label shown in the app is editable).
export const SORT_KEY_HINTS = {
  relevance: 'Best match for the search',
  distance: 'Closest first',
  rating: 'Highest rated first',
  popularity: 'Most viewed first',
  saved: 'Most saved first',
  newest: 'Recently added first',
  price_asc: 'Average price, low → high',
  price_desc: 'Average price, high → low',
  top_rated_month: 'Best rated over 30 days',
  trending_month: 'Most activity over 30 days',
  most_saved_month: 'Most saved over 30 days',
  on_the_rise: 'Fastest growing this week',
}

// "Trending this month" sheet options (each is also a sort key).
export const TRENDING_KEY_HINTS = {
  most_saved_month: 'Most saved over 30 days',
  top_rated_month: 'Best rated over 30 days',
  on_the_rise: 'Fastest growing this week',
}

// Recommendation tiles (Home "Recommends", Search "Popular also search for").
export const RECOMMENDATION_KEY_HINTS = {
  trending: 'Without an image the app shows a live collage of the top 4 trending restaurants.',
  bestRated: 'Highest average rating in the area.',
  friendPicks: 'Places people you follow saved or liked. Signed-in users only.',
}

export const NOTIFICATION_KEY_HINTS = {
  emailNotifications: 'Email',
  pushNotifications: 'Push',
  followerAlerts: 'New followers',
  reservationAlerts: 'Reservations',
}

export const SENTIMENT_KEY_HINTS = {
  liked: 'Positive',
  fine: 'Neutral',
  disliked: 'Negative',
}

// Surprise me screen copy, grouped by the state it is shown in.
export const SURPRISE_GROUPS = [
  {
    title: 'Screen',
    fields: [{ key: 'title', label: 'Header title' }],
  },
  {
    title: 'While searching',
    fields: [
      { key: 'loadingTitle', label: 'Title' },
      { key: 'loadingSubtitle', label: 'Subtitle', multiline: true },
    ],
  },
  {
    title: 'Result',
    fields: [
      { key: 'foundTitle', label: 'Title' },
      { key: 'exploreCta', label: 'Open restaurant button' },
      { key: 'againCta', label: 'Try again button' },
      {
        key: 'preferencesNote',
        label: 'Preferences note',
        hint: "Shown under the result when it matches the user's food preferences.",
      },
    ],
  },
  {
    title: 'Nothing found',
    fields: [
      { key: 'emptyTitle', label: 'Title' },
      { key: 'emptySubtitle', label: 'Subtitle', multiline: true },
      { key: 'emptyCta', label: 'Button' },
    ],
  },
]
const SURPRISE_KEYS = SURPRISE_GROUPS.flatMap((g) => g.fields.map((f) => f.key))

export const FILTER_LISTS = ['distanceOptions', 'ratingOptions', 'reviewCountOptions']
export const FILTER_NUMBERS = ['priceMin', 'priceMax', 'priceStep', 'defaultRadius', 'maxRadius']
export const QUICK_FILTER_KEYS = ['distance', 'rating', 'price']

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
// Same rule as the server: an https:// store link, or empty (not published yet).
const HTTPS_URL = /^https:\/\/[^\s/$.?#][^\s]*$/i
export const APP_LINK_KEYS = ['ios', 'android']

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)
const str = (value) => (value === null || value === undefined ? '' : String(value))
const numbers = (list) => (Array.isArray(list) ? list.map(Number) : [])

/** Parse a number input: '' / invalid → null. */
export const toNum = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** 1500 → "1.5 km", 500 → "500 m" */
export const formatMetres = (m) => {
  const n = Number(m)
  if (!Number.isFinite(n)) return ''
  return n >= 1000 ? `${Number((n / 1000).toFixed(1))} km` : `${n} m`
}

/** Settings document → form state. */
export const toForm = (s = {}) => ({
  supportPhone: str(s.supportPhone),
  companyAddress: str(s.companyAddress),
  supportReplyNote: str(s.supportReplyNote),
  timezone: str(s.timezone),
  filters: {
    ...Object.fromEntries(FILTER_LISTS.map((key) => [key, numbers(s.filters?.[key])])),
    ...Object.fromEntries(FILTER_NUMBERS.map((key) => [key, str(s.filters?.[key])])),
    distanceLabels: Object.fromEntries(
      Object.entries(s.filters?.distanceLabels || {}).map(([metres, label]) => [String(Number(metres)), str(label)])
    ),
  },
  eta: { speedKmh: str(s.eta?.speedKmh), roadFactor: str(s.eta?.roadFactor) },
  appLinks: Object.fromEntries(APP_LINK_KEYS.map((key) => [key, str(s.appLinks?.[key])])),
  inviteGoal: str(s.inviteGoal ?? 3),
  quickFilters: Object.fromEntries(
    QUICK_FILTER_KEYS.map((key) => [key, numbers(s.quickFilters?.[key])])
  ),
  sortOptions: [...(s.sortOptions || [])]
    .sort(byOrder)
    .map((o) => ({ key: o.key, label: str(o.label), description: str(o.description), isActive: !!o.isActive })),
  trendingOptions: [...(s.trendingOptions || [])]
    .sort(byOrder)
    .map((o) => ({ key: o.key, label: str(o.label), description: str(o.description), isActive: !!o.isActive })),
  recommendations: [...(s.recommendations || [])].sort(byOrder).map((r) => ({
    key: r.key,
    title: str(r.title),
    description: str(r.description),
    image: r.image || null,
    isActive: !!r.isActive,
  })),
  priceLevels: (s.priceLevels || []).map((p) => ({
    key: p.key,
    label: str(p.label),
    hint: str(p.hint),
    maxPrice: str(p.maxPrice),
  })),
  notificationOptions: (s.notificationOptions || []).map((n) => ({
    key: n.key,
    label: str(n.label),
    description: str(n.description),
  })),
  sentiments: (s.sentiments || []).map((x) => ({
    key: x.key,
    label: str(x.label),
    emoji: str(x.emoji),
    color: str(x.color),
  })),
  surprise: Object.fromEntries(SURPRISE_KEYS.map((key) => [key, str(s.surprise?.[key])])),
  homeSections: [...(s.homeSections || [])].sort(byOrder).map((h) => ({
    key: h.key,
    title: str(h.title),
    subtitle: str(h.subtitle),
    ctaLabel: str(h.ctaLabel),
    tabLabels: Array.isArray(h.tabLabels) ? h.tabLabels.map(str) : [],
    limit: str(h.limit),
    isActive: !!h.isActive,
  })),
})

/** Form state → PUT /admin/settings body (every field; see changedFields). */
export const toPayload = (form) => ({
  supportPhone: form.supportPhone.trim(),
  companyAddress: form.companyAddress.trim(),
  supportReplyNote: form.supportReplyNote.trim(),
  timezone: form.timezone.trim(),
  filters: {
    ...Object.fromEntries(FILTER_LISTS.map((key) => [key, form.filters[key]])),
    ...Object.fromEntries(FILTER_NUMBERS.map((key) => [key, toNum(form.filters[key])])),
    // Only labels of distances still offered, and only non-empty ones.
    distanceLabels: Object.fromEntries(
      form.filters.distanceOptions
        .map((metres) => [String(metres), (form.filters.distanceLabels[String(metres)] || '').trim()])
        .filter(([, label]) => label)
    ),
  },
  eta: { speedKmh: toNum(form.eta.speedKmh), roadFactor: toNum(form.eta.roadFactor) },
  appLinks: Object.fromEntries(APP_LINK_KEYS.map((key) => [key, form.appLinks[key].trim()])),
  inviteGoal: toNum(form.inviteGoal),
  quickFilters: { ...form.quickFilters },
  sortOptions: form.sortOptions.map((o, order) => ({
    key: o.key,
    label: o.label.trim(),
    description: o.description.trim(),
    isActive: o.isActive,
    order,
  })),
  trendingOptions: form.trendingOptions.map((o, order) => ({
    key: o.key,
    label: o.label.trim(),
    description: o.description.trim(),
    isActive: o.isActive,
    order,
  })),
  recommendations: form.recommendations.map((r, order) => ({
    key: r.key,
    title: r.title.trim(),
    description: r.description.trim(),
    image: r.image || null,
    isActive: r.isActive,
    order,
  })),
  priceLevels: form.priceLevels.map((p) => ({
    key: p.key,
    label: p.label.trim(),
    hint: p.hint.trim(),
    maxPrice: toNum(p.maxPrice),
  })),
  notificationOptions: form.notificationOptions.map((n) => ({
    key: n.key,
    label: n.label.trim(),
    description: n.description.trim(),
  })),
  sentiments: form.sentiments.map((x) => ({
    key: x.key,
    label: x.label.trim(),
    emoji: x.emoji.trim(),
    color: x.color.trim() || null,
  })),
  surprise: Object.fromEntries(SURPRISE_KEYS.map((key) => [key, form.surprise[key].trim()])),
  homeSections: form.homeSections.map((h, order) => ({
    key: h.key,
    title: h.title.trim(),
    subtitle: h.subtitle.trim(),
    ctaLabel: h.ctaLabel.trim(),
    tabLabels: h.tabLabels.map((t) => t.trim()),
    limit: toNum(h.limit),
    isActive: h.isActive,
    order,
  })),
})

/**
 * Only the top-level fields that differ from the saved settings, so a save
 * never re-sends (and re-validates) sections the admin did not touch.
 */
export const changedFields = (payload, original) =>
  Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(original[key])
    )
  )

const isTimezone = (tz) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Client-side mirror of the server validation.
 * → { [fieldPath]: message } — empty when the form can be saved.
 * Paths match the inputs, e.g. "filters.priceMax", "sortOptions.2.label".
 */
export const validate = (form) => {
  const errors = {}
  const required = (path, value, message = 'Required') => {
    if (!String(value ?? '').trim()) errors[path] = message
  }

  if (!form.timezone.trim()) errors.timezone = 'Timezone is required'
  else if (!isTimezone(form.timezone.trim())) errors.timezone = 'Unknown timezone (use e.g. Asia/Baku)'

  // Scalar filter numbers: all ≥ 0, plus the cross-field rules.
  const f = {}
  FILTER_NUMBERS.forEach((key) => {
    f[key] = toNum(form.filters[key])
    if (f[key] === null || f[key] < 0) errors[`filters.${key}`] = 'Enter a number ≥ 0'
  })
  if (!errors['filters.priceStep'] && f.priceStep <= 0) errors['filters.priceStep'] = 'Must be greater than 0'
  if (!errors['filters.priceMax'] && !errors['filters.priceMin'] && f.priceMax <= f.priceMin) {
    errors['filters.priceMax'] = 'Must be greater than the minimum price'
  }
  if (!errors['filters.maxRadius'] && f.maxRadius <= 0) errors['filters.maxRadius'] = 'Must be greater than 0'
  if (!errors['filters.defaultRadius'] && !errors['filters.maxRadius'] && f.defaultRadius > f.maxRadius) {
    errors['filters.defaultRadius'] = 'Cannot be larger than the maximum radius'
  }

  Object.entries(form.filters.distanceLabels).forEach(([metres, label]) => {
    if (form.filters.distanceOptions.includes(Number(metres)) && label.trim().length > 30) {
      errors[`filters.distanceLabels.${metres}`] = 'At most 30 characters'
    }
  })

  APP_LINK_KEYS.forEach((key) => {
    const url = form.appLinks[key].trim()
    if (url && (!HTTPS_URL.test(url) || url.length > 500)) {
      errors[`appLinks.${key}`] = 'Use a full https:// link, or leave it empty'
    }
  })
  const goal = toNum(form.inviteGoal)
  if (goal === null || !Number.isInteger(goal) || goal < 1 || goal > 20) {
    errors.inviteGoal = 'Whole number from 1 to 20'
  }

  const speed = toNum(form.eta.speedKmh)
  if (speed === null || speed <= 0 || speed > 200) errors['eta.speedKmh'] = 'A speed above 0 and up to 200 km/h'
  const factor = toNum(form.eta.roadFactor)
  if (factor === null || factor < 1 || factor > 3) errors['eta.roadFactor'] = 'A factor from 1 to 3'

  form.sortOptions.forEach((o, i) => required(`sortOptions.${i}.label`, o.label, 'Label is required'))
  form.trendingOptions.forEach((o, i) => required(`trendingOptions.${i}.label`, o.label, 'Label is required'))
  form.recommendations.forEach((r, i) => required(`recommendations.${i}.title`, r.title, 'Title is required'))
  if (!form.sortOptions.some((o) => o.isActive)) {
    errors.sortOptions = 'At least one sort option must stay active'
  }
  form.priceLevels.forEach((p, i) => required(`priceLevels.${i}.label`, p.label, 'Label is required'))
  // Price bands grow from $ to $$$$; only the last one may be open-ended (empty).
  let previous = -Infinity
  form.priceLevels.forEach((p, i) => {
    const max = toNum(p.maxPrice)
    const last = i === form.priceLevels.length - 1
    if (String(p.maxPrice).trim() && (max === null || max < 0)) {
      errors[`priceLevels.${i}.maxPrice`] = 'Enter a number ≥ 0'
    } else if (max === null && !last) {
      errors[`priceLevels.${i}.maxPrice`] = 'Only the last level can be open-ended'
    } else if (max !== null && max <= previous) {
      errors[`priceLevels.${i}.maxPrice`] = 'Must be higher than the level before'
    }
    if (max !== null) previous = max
  })
  form.notificationOptions.forEach((n, i) =>
    required(`notificationOptions.${i}.label`, n.label, 'Label is required')
  )
  form.sentiments.forEach((x, i) => {
    required(`sentiments.${i}.label`, x.label, 'Label is required')
    if (x.color.trim() && !HEX_COLOR.test(x.color.trim())) {
      errors[`sentiments.${i}.color`] = 'Use a hex colour like #22C55E'
    }
  })

  SURPRISE_KEYS.forEach((key) => required(`surprise.${key}`, form.surprise[key], 'Cannot be empty'))

  form.homeSections.forEach((h, i) => {
    required(`homeSections.${i}.title`, h.title, 'Title is required')
    const limit = toNum(h.limit)
    if (limit === null || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      errors[`homeSections.${i}.limit`] = 'Whole number from 1 to 50'
    }
    const tabs = HOME_SECTION_META[h.key]?.tabs
    tabs?.forEach((_, t) => required(`homeSections.${i}.tabLabels.${t}`, h.tabLabels[t], 'Tab label is required'))
  })

  return errors
}
