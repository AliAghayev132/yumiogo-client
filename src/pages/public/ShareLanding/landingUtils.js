import { getImageUrl } from '@utils'

/*
 * Helpers of the shared-link landing pages (/list, /restaurant, /invite, /review).
 */

// ============ APP DEEP LINKS ============
// Same paths as the app's linking config (mobile/src/navigation/linking.js).
const enc = (value) => encodeURIComponent(String(value ?? ''))
export const deepLinks = {
  list: (slug) => `yumio://list/${enc(slug)}`,
  restaurant: (id) => `yumio://restaurant/${enc(id)}`,
  invite: (code) => `yumio://invite/${enc(code)}`,
  review: (id) => `yumio://review/${enc(id)}`,
}

/** Phones / tablets can hand the yumio:// link to the app; desktops cannot. */
export const isMobileDevice = () =>
  typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')

// ============ VIEWER SESSION ============
// GET /api/restaurants/:id counts one view per viewer per day; guests are told apart by
// X-Session-Id (8–128 chars of [A-Za-z0-9_-]). A stable per-browser id keeps reloads and
// repeat visits of a shared link to one view instead of falling back to IP + user agent.
const SESSION_KEY = 'yumio.webSessionId'
const SESSION_RE = /^[A-Za-z0-9_-]{8,128}$/
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
let sessionId = ''

const randomId = (length = 24) => {
  const bytes = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)))
  return Array.from(bytes, (b) => ALPHABET[b & 63]).join('')
}

export const webSessionId = () => {
  if (sessionId) return sessionId
  try {
    const saved = window.localStorage.getItem(SESSION_KEY)
    if (SESSION_RE.test(saved || '')) return (sessionId = saved)
  } catch {
    // storage blocked (private mode) → one id for this page load
  }
  sessionId = randomId()
  try {
    window.localStorage.setItem(SESSION_KEY, sessionId)
  } catch {
    // ignore
  }
  return sessionId
}

// ============ FORMATTING ============
export const personName = (user, fallback = 'A Yumio member') =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || fallback

export const dateLabel = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

export const ratingLabel = (value) => (Number(value) > 0 ? Number(value).toFixed(1) : '')

export const countLabel = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "10 - 65₼" / "32₼" from the API, else the range / average / "$$" level of a list card. */
export const priceLabelOf = (r) => {
  if (!r) return ''
  if (r.priceLabel) return r.priceLabel
  const min = Number(r.priceMin)
  const max = Number(r.priceMax)
  if (min > 0 && max > 0) return min === max ? `${min}₼` : `${min} - ${max}₼`
  if (Number(r.avgPrice) > 0) return `${r.avgPrice}₼`
  return r.priceLevel || ''
}

/** First cover photo (absolute URL) of a restaurant. */
export const coverOf = (r) => getImageUrl(r?.coverImages?.[0] || r?.coverImage || r?.logo || '')

/** Plain one-line text for meta descriptions. */
export const clip = (text, max = 160) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/** RTK Query error → 'notFound' (404 / 400: private, deleted or malformed) | 'error' (network / 5xx). */
export const errorKind = (error) => (error && [400, 404].includes(error.status) ? 'notFound' : 'error')
