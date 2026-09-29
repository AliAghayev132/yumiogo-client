import { baseApi } from './baseApi'

// Auth endpoints — mirror the server `/api/auth` routes exactly.
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login -> returns { user, tokens }
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Register - Step 1: validate + send OTP
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // Register - Step 2: verify OTP, creates the user -> returns { user, tokens }
    verifyOTP: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Resend the OTP code
    resendOTP: builder.mutation({
      query: (data) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Current authenticated user. Server: { data: { user } } → unwrapped to the user object.
    getMe: builder.query({
      query: () => '/auth/me',
      transformResponse: (res) => res?.data?.user ?? null,
      providesTags: ['User', 'Auth'],
    }),

    // Public auth settings (password rules, OTP length, mail on/off)
    // → { otp, password: { rules: [{ key, label }], maxLength }, mail: { enabled }, … }
    getAuthConfig: builder.query({
      query: () => '/auth/config',
      transformResponse: (res) => res?.data ?? {},
    }),

    // Logout { refreshToken } ends this device's session only; without it (or with
    // allDevices: true) the server signs the account out everywhere (tokenVersion bump).
    // accessToken = end a session that is not in the auth slice (a non-admin sign-in the login
    // page turns away).
    logout: builder.mutation({
      query: ({ accessToken, refreshToken, allDevices = false } = {}) => ({
        url: '/auth/logout',
        method: 'POST',
        ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
        body: allDevices ? { allDevices: true } : refreshToken ? { refreshToken } : {},
      }),
    }),

    // Update profile (firstName / lastName / phone) → the saved user object.
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (res) => res?.data?.user ?? null,
      invalidatesTags: ['User', 'Auth'],
    }),

    // Profile photo: multipart field "avatar" → { avatar } (server-relative path); remove → { avatar: null }
    updateAvatar: builder.mutation({
      query: (formData) => ({
        url: '/auth/avatar',
        method: 'PUT',
        body: formData,
      }),
      transformResponse: (res) => res?.data ?? {},
      invalidatesTags: ['User', 'Auth'],
    }),
    deleteAvatar: builder.mutation({
      query: () => ({
        url: '/auth/avatar',
        method: 'DELETE',
      }),
      transformResponse: (res) => res?.data ?? {},
      invalidatesTags: ['User', 'Auth'],
    }),

    // Change password (while authenticated) { currentPassword, newPassword }.
    // The server signs out every other session and returns a new pair → { tokens }.
    changePassword: builder.mutation({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (res) => res?.data ?? {},
    }),

    // Forgot password - Step 1: send OTP
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Forgot password - Step 2: verify OTP, returns a reset token
    verifyResetOTP: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-reset-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Forgot password - Step 3: set new password with the reset token (sent as the bearer
    // token, so a signed-in session's access token is not used instead)
    resetPassword: builder.mutation({
      query: ({ newPassword, resetToken }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        headers: { Authorization: `Bearer ${resetToken}` },
        body: { newPassword },
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useGetAuthConfigQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useDeleteAvatarMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useVerifyResetOTPMutation,
  useResetPasswordMutation,
} = authApi
