import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff } from 'lucide-react'

import { SEO, Button, Input, errorMessage } from '@components'
import { useLoginMutation, useLogoutMutation } from '@store/api'
import { setCredentials, logout } from '@store/slices/authSlice'
import { AuthCard } from './AuthCard'

const NOT_ADMIN = {
  tone: 'error',
  title: 'No admin access',
  message: 'This account cannot use the admin panel. Sign in with an administrator account.',
}

// Notices other pages can hand over through the navigation state (`{ notice: key }`).
const NOTICES = {
  'not-admin': NOT_ADMIN,
  'password-reset': {
    tone: 'success',
    title: 'Password updated',
    message: 'Log in with your new password.',
  },
}

// Admin sign-in (look of the Figma "Log in" 1:12792): Plus Jakarta 24/700 title, #FAFAFA fields
// with a red asterisk, eye toggle on the password, 48px orange button, "Forgot password?".
// Only admins get in: any other account is signed out again right away with a clear message.
// Admin accounts are created by an admin (Users → Add user), so there is no sign-up here.
export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { isAuthenticated, role } = useSelector((state) => state.auth)
  const [login, { isLoading }] = useLoginMutation()
  const [logoutApi] = useLogoutMutation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [notice, setNotice] = useState(() => NOTICES[location.state?.notice] || null)
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'
  const sentBack = location.state?.notice === 'not-admin'

  // A signed-in admin who opens /login goes straight to the panel; a non-admin session that was
  // sent back here by the route guard is dropped.
  useEffect(() => {
    if (!isAuthenticated) return
    if (role === 'admin' && !sentBack) navigate(from, { replace: true })
    else if (role !== 'admin') dispatch(logout())
  }, [isAuthenticated, role, sentBack, from, navigate, dispatch])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice(null)
    try {
      // Server envelope: { success, message, data: { user, tokens } }
      const res = await login(form).unwrap()
      const { user, tokens } = res.data || {}
      if (user?.role !== 'admin') {
        // End just the session the server opened here; the account stays signed in in the app.
        if (tokens?.accessToken) logoutApi({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
        setNotice(NOT_ADMIN)
        return
      }
      dispatch(setCredentials(res.data))
      navigate(from === '/login' ? '/dashboard' : from, { replace: true })
    } catch (err) {
      setNotice({ tone: 'error', title: 'Login failed', message: errorMessage(err, 'Invalid email or password.') })
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to the Yumio admin panel"
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      footer={
        <span className="font-normal text-ink-tertiary">
          Need an account? Ask another admin to add you under Users.
        </span>
      }
    >
      <SEO title="Log in" path="/login" noindex />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="example@gmail.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter password"
          autoComplete="current-password"
          required
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand/40"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          }
        />
        <Link
          to="/forgot-password"
          state={{ email: form.email }}
          className="-mt-1 self-end text-sm font-semibold text-ink underline-offset-2 transition-colors hover:text-brand-hover hover:underline"
        >
          Forgot password?
        </Link>
        <Button type="submit" size="lg" fullWidth loading={isLoading} className="mt-2">
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </AuthCard>
  )
}
