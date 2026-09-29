// Redux Toolkit
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// API
import { baseApi } from './api/baseApi'

// Slices
import authReducer from './slices/authSlice'

// ============ STORE ============
export const store = configureStore({
  reducer: {
    // RTK Query cache reducer
    [baseApi.reducerPath]: baseApi.reducer,
    // Auth state (localStorage-backed)
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

// Enables refetchOnFocus / refetchOnReconnect for the queries that ask for it (session check,
// sidebar counters, notifications bell).
setupListeners(store.dispatch)
