// Redux Toolkit
import { configureStore } from '@reduxjs/toolkit'

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
