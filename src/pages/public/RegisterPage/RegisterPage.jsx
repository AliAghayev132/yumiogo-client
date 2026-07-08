import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'

import { SEO, Button, Input, Card } from '@components'
import {
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
} from '@store/api'
import { setCredentials } from '@store/slices/authSlice'

// Two-step registration:
//   1. Submit profile -> server sends an OTP to the email.
//   2. Submit the OTP code -> server creates the user and returns { user, tokens }.
export const RegisterPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation()
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [code, setCode] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await register(form).unwrap()
      setStep(2)
      Swal.fire({
        icon: 'success',
        title: 'Check your email',
        text: `We sent a verification code to ${form.email}.`,
        timer: 2500,
        showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Registration failed',
        text: err?.data?.message || 'Could not start registration.',
      })
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    try {
      const res = await verifyOTP({ email: form.email, code }).unwrap()
      dispatch(setCredentials(res.data))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Verification failed',
        text: err?.data?.message || 'Invalid or expired code.',
      })
    }
  }

  const handleResend = async () => {
    try {
      await resendOTP({ email: form.email, type: 'register' }).unwrap()
      Swal.fire({
        icon: 'success',
        title: 'Code resent',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Could not resend',
        text: err?.data?.message || 'Please try again in a moment.',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <SEO title="Register" path="/register" />
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Starter
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 1
              ? 'Start with a free account'
              : `Enter the code sent to ${form.email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
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
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
            <Button type="submit" fullWidth disabled={isRegistering}>
              {isRegistering ? 'Sending code...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Verification code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              required
            />
            <Button type="submit" fullWidth disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify & continue'}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="w-full text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {isResending ? 'Resending...' : 'Resend code'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
