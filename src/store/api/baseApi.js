// RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// API origin (same origin by default — see utils/apiOrigin.js)
import { API_BASE_URL } from '@utils/apiOrigin'

// ============ BASE QUERY ============
// All endpoints are injected against this base query. It attaches the access
// token from the auth slice unless an Authorization header is already set
// (e.g. a one-off reset token during password reset).
const baseQuery = fetchBaseQuery({
  // Same origin as the site in production (nginx) and in `npm run dev` (Vite proxy), so
  // /api works with no env at all. VITE_API_URL points it at another origin.
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    if (!headers.get('Authorization')) {
      const token = getState().auth?.accessToken
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }
    return headers
  },
})

// ============ REAUTH WRAPPER ============
// The server rotates refresh tokens: every refresh returns a new pair and the old refresh
// token stops working (sending it again later signs the account out everywhere). So:
//  - one refresh at a time — every request that hits a 401 meanwhile waits for it, then replays;
//  - tabs share the session through localStorage (authSlice persists it): before refreshing,
//    a tab adopts tokens another tab already rotated instead of replaying its stale copy;
//  - the user is signed out only when the server rejects the refresh (401/403); network
//    errors, 429 and 5xx keep the session.

// Auth endpoints whose 401 is an answer (wrong password, bad code), not an expired session.
const NO_REFRESH = /\/auth\/(login|register|verify-otp|resend-otp|forgot-password|verify-reset-otp|reset-password|refresh|logout)\b/

const urlOf = (args) => (typeof args === 'string' ? args : args?.url || '')

const hasOwnAuthHeader = (args) => {
  const headers = typeof args === 'object' ? args?.headers : null
  if (!headers) return false
  if (typeof headers.get === 'function') return !!headers.get('Authorization')
  return !!(headers.Authorization || headers.authorization)
}

// The session the tabs last persisted (see authSlice), or null.
const storedTokens = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') || 'null')
    return auth?.accessToken && auth?.refreshToken
      ? { accessToken: auth.accessToken, refreshToken: auth.refreshToken }
      : null
  } catch {
    return null
  }
}

let refreshing = null

/** → 'ok' (new tokens stored) | 'auth' (session rejected) | 'transient' (try again later) */
const refreshSession = async (api, extraOptions) => {
  const refreshToken = api.getState().auth?.refreshToken
  // Another tab rotated the session already: use its tokens.
  const stored = storedTokens()
  if (stored && refreshToken && stored.refreshToken !== refreshToken) {
    api.dispatch({ type: 'auth/setTokens', payload: stored })
    return 'ok'
  }
  if (!refreshToken) return 'auth'

  const result = await baseQuery(
    { url: '/auth/refresh', method: 'POST', headers: { Authorization: `Bearer ${refreshToken}` } },
    api,
    extraOptions
  )
  // Server envelope: { success, message, data: { tokens: { accessToken, refreshToken } } }
  const tokens = result.data?.data?.tokens
  if (tokens?.accessToken && tokens?.refreshToken) {
    api.dispatch({ type: 'auth/setTokens', payload: tokens })
    return 'ok'
  }
  const status = result.error?.status
  if (status === 401 || status === 403) {
    // A newer session (another tab, a new sign-in) replaced ours while this one was in flight.
    const latest = storedTokens()
    if (latest && latest.refreshToken !== refreshToken) {
      api.dispatch({ type: 'auth/setTokens', payload: latest })
      return 'ok'
    }
    return 'auth'
  }
  return 'transient'
}

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Don't send a token that is being replaced right now.
  if (refreshing) await refreshing

  const tokenUsed = api.getState().auth?.accessToken
  const result = await baseQuery(args, api, extraOptions)
  // 403 from an admin endpoint: the account may have lost admin rights since it signed in, so
  // re-check GET /auth/me (the dashboard shell signs the session out when it is not an admin).
  if (result?.error?.status === 403 && tokenUsed && urlOf(args).startsWith('/admin')) {
    api.dispatch(baseApi.util.invalidateTags(['Auth']))
  }
  if (result?.error?.status !== 401 || !tokenUsed || hasOwnAuthHeader(args) || NO_REFRESH.test(urlOf(args))) {
    return result
  }

  // Another request already refreshed while this one was in flight.
  const current = api.getState().auth?.accessToken
  if (current && current !== tokenUsed) return baseQuery(args, api, extraOptions)

  if (!refreshing) {
    refreshing = refreshSession(api, extraOptions).finally(() => {
      refreshing = null
    })
  }
  const outcome = await refreshing
  if (outcome === 'ok') return baseQuery(args, api, extraOptions)
  if (outcome === 'auth') api.dispatch({ type: 'auth/logout' })
  return result
}

// ============ API INSTANCE ============
// Endpoints are injected from feature files (authApi, adminUsersApi, ...).
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Post',
    'Auth',
    'AdminStats',
    'AdminUser',
    'AdminRestaurant',
    'AdminReview',
    'AdminReport',
    'AdminList',
    'AdminSettings',
    'AdminMeta',
    'AdminTaxonomy',
    'AdminCity',
    'AdminFaq',
    'AdminOnboarding',
    'AdminPage',
    'Catalog',
    'PublicContent',
  ],
  endpoints: () => ({}),
})
