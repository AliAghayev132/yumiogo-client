import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'

import { SEO, Button, Input, Card } from '@components'
import { useLoginMutation } from '@store/api'
import { setCredentials } from '@store/slices/authSlice'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [form, setForm] = useState({ email: '', password: '' })

  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Server envelope: { success, message, data: { user, tokens } }
      const res = await login(form).unwrap()
      dispatch(setCredentials(res.data))
      navigate(from, { replace: true })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login failed',
        text: err?.data?.message || 'Invalid email or password.',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <SEO title="Login" path="/login" />
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Starter
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-green-600 hover:text-green-700">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  )
}
