import { toTranslationForm, toTranslationPayload } from '@components'
import { toHoursState, toHoursPayload } from './openingHours'
import { priceBandsConfigured } from './restaurantMeta'

// Catalog-backed multi-selects (key = restaurant field = /admin/meta list).
export const CATALOG_LISTS = ['cuisines', 'dining', 'features', 'tags', 'dietary', 'moods']

// Texts with az / ru versions (Restaurant.translations).
export const RESTAURANT_TEXTS = ['name', 'description', 'address']

const numText = (v) => (v === null || v === undefined ? '' : String(v))

// Date input value (yyyy-mm-dd, local day) ↔ the stored instant. A promotion ends at the end of
// the chosen day in the admin's time zone.
const pad = (n) => String(n).padStart(2, '0')
const toDateInput = (value) => {
  const d = value ? new Date(value) : null
  return d && !Number.isNaN(d.getTime()) ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : ''
}
const endOfDay = (dateText) => {
  const d = new Date(`${dateText}T23:59:59`)
  return Number.isNaN(d.getTime()) ? null : d
}
/** Today as a date input value (the earliest allowed discount end). */
export const todayInput = () => toDateInput(new Date())

/** Restaurant document (admin detail or PUT response) → editor state (General / Hours / Media). */
export const toForm = (r = {}) => {
  const coords = r.location?.coordinates
  return {
    name: r.name || '',
    description: r.description || '',
    phone: r.phone || '',
    discountPercent: numText(r.discountPercent ?? 0),
    discountEndsAt: toDateInput(r.discountEndsAt),
    avgPrice: numText(r.avgPrice),
    priceMin: numText(r.priceMin),
    priceMax: numText(r.priceMax),
    priceLevel: r.priceLevel || '',
    address: r.address || '',
    city: r.city || '',
    lng: numText(coords?.[0]),
    lat: numText(coords?.[1]),
    ...Object.fromEntries(CATALOG_LISTS.map((key) => [key, [...(r[key] || [])]])),
    temporarilyClosed: !!r.temporarilyClosed,
    hours: toHoursState(r.hours),
    coverImages: [...(r.coverImages || [])],
    logo: r.logo || '',
    translations: toTranslationForm(r.translations, RESTAURANT_TEXTS),
  }
}

export const sameForm = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const optionalNumber = (value) => (String(value).trim() === '' ? null : Number(value))

/**
 * Editor state → PUT /restaurants/:id body, or { error, tab } for the first problem.
 * priceLevel is only sent when the admin price bands are off (otherwise the server derives it).
 */
export const toPayload = (form, { priceLevels = [] } = {}) => {
  const fail = (error, tab = 'general') => ({ error, tab })
  if (!form.name.trim()) return fail('Name is required')

  const avg = optionalNumber(form.avgPrice)
  const min = optionalNumber(form.priceMin)
  const max = optionalNumber(form.priceMax)
  const discount = optionalNumber(form.discountPercent)
  if (avg !== null && (!Number.isFinite(avg) || avg < 0)) return fail('Average price must be 0 or more')
  if (min !== null && (!Number.isFinite(min) || min < 0)) return fail('Minimum price must be 0 or more')
  if (max !== null && (!Number.isFinite(max) || max < 0)) return fail('Maximum price must be 0 or more')
  if (min !== null && max !== null && max < min) return fail('Maximum price must be at least the minimum price')
  if (discount !== null && (!Number.isFinite(discount) || discount < 0 || discount > 100)) {
    return fail('Discount must be between 0 and 100')
  }
  // The end date only matters while there is a discount (the server clears it otherwise).
  const discountEnds = discount > 0 && form.discountEndsAt ? endOfDay(form.discountEndsAt) : null
  if (discount > 0 && form.discountEndsAt && (!discountEnds || discountEnds.getTime() <= Date.now())) {
    return fail('The discount end date must be today or later')
  }

  const lng = Number(form.lng)
  const lat = Number(form.lat)
  if (
    String(form.lng).trim() === '' ||
    String(form.lat).trim() === '' ||
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    Math.abs(lng) > 180 ||
    Math.abs(lat) > 90
  ) {
    return fail('Enter valid coordinates: longitude -180 to 180, latitude -90 to 90')
  }

  const { hours, error: hoursError } = toHoursPayload(form.hours)
  if (hoursError) return fail(hoursError, 'hours')

  const payload = {
    name: form.name.trim(),
    description: form.description,
    phone: form.phone.trim() || null,
    discountPercent: discount ?? 0,
    discountEndsAt: discountEnds ? discountEnds.toISOString() : null,
    ...(avg !== null ? { avgPrice: avg } : {}),
    priceMin: min,
    priceMax: max,
    address: form.address.trim(),
    city: form.city,
    location: { type: 'Point', coordinates: [lng, lat] },
    ...Object.fromEntries(CATALOG_LISTS.map((key) => [key, form[key]])),
    temporarilyClosed: form.temporarilyClosed,
    hours,
    coverImages: form.coverImages,
    logo: form.logo || null,
    translations: toTranslationPayload(form.translations, RESTAURANT_TEXTS),
  }
  if (!priceBandsConfigured(priceLevels) && form.priceLevel) payload.priceLevel = form.priceLevel
  return { payload }
}
