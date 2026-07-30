// RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// ============ BASE QUERY ============
// All endpoints are injected against this base query. It attaches the access
// token from the auth slice unless an Authorization header is already set
// (e.g. a one-off reset token during password reset).
const baseQuery = fetchBaseQuery({
  // Production: same origin as the site (nginx -> the API server), so
  // https://yumiogo.com/api works with no env at all.
  // Development: the local API server. Override with VITE_API_URL.
  baseUrl: `${import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3042' : '')}/api`,
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
// On a 401 we attempt a single token refresh using the stored refresh token.
// If refresh succeeds we replay the original request; otherwise we log out.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    const refreshToken = api.getState().auth?.refreshToken

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
        api,
        extraOptions
      )

      if (refreshResult?.data) {
        // Server envelope: { success, message, data: { tokens } }
        api.dispatch({
          type: 'auth/setTokens',
          payload: refreshResult.data.data.tokens,
        })
        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch({ type: 'auth/logout' })
      }
    } else {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

// ============ API INSTANCE ============
// Endpoints are injected from feature files (authApi, postApi, ...).
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
    'AdminSettings',
  ],
  endpoints: () => ({}),
})
