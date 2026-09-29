import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'

import { SEO, Button, Input, errorMessage } from '@components'
import {
  useForgotPasswordMutation,
  useVerifyResetOTPMutation,
  useResetPasswordMutation,
  useGetAuthConfigQuery,
} from '@store/api'
import { AuthCard } from '../LoginPage/AuthCard'

const PASSWORD_HINT = 'At least 6 characters, 1 uppercase letter and 1 number or special character.'

const STEPS = {
  email: { title: 'Forgot password?', subtitle: 'Enter your e-mail and we will send you a reset code' },
  code: { title: 'Check your e-mail', subtitle: null },
  password: { title: 'Set a new password', subtitle: 'Choose a password you have not used here before' },
}

/**
 * Admin password reset (/forgot-password, linked from Log in): e-mail → code
 * (POST /auth/forgot-password, /auth/verify-reset-otp → reset token) → new password
 * (POST /auth/reset-password). Ends on the login page with a "Password updated" notice.
 */
export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: authConfig } = useGetAuthConfigQuery()
  const [sendCode, { isLoading: sending }] = useForgotPasswordMutation()
  const [verifyCode, { isLoading: verifying }] = useVerifyResetOTPMutation()
  const [resetPassword, { isLoading: saving }] = useResetPasswordMutation()

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState(null)

  const codeLength = authConfig?.otp?.codeLength || 4
  const rules = authConfig?.password?.rules
  const hint = rules?.length ? `Use ${rules.map((r) => r.label).join(', ')}.` : PASSWORD_HINT

  const requestCode = async (e) => {
    e?.preventDefault()
    setNotice(null)
    try {
      await sendCode({ email: email.trim() }).unwrap()
      setStep('code')
      setNotice({ tone: 'success', title: e ? 'Code sent' : 'Code resent', message: `If ${email.trim()} has an account, a reset code is on its way.` })
    } catch (err) {
      setNotice({ tone: 'error', title: 'Could not send the code', message: errorMessage(err, 'Please try again in a moment.') })
    }
  }

  const submitCode = async (e) => {
    e.preventDefault()
    setNotice(null)
    try {
      const res = await verifyCode({ email: email.trim(), code: code.trim() }).unwrap()
      setResetToken(res?.data?.resetToken || '')
      setStep('password')
    } catch (err) {
      setNotice({ tone: 'error', title: 'Wrong code', message: errorMessage(err, 'The code is invalid or has expired.') })
    }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setNotice(null)
    if (password !== confirm) {
      setNotice({ tone: 'error', title: 'Passwords do not match', message: 'Type the same new password twice.' })
      return
    }
    try {
      await resetPassword({ newPassword: password, resetToken }).unwrap()
      navigate('/login', { replace: true, state: { notice: 'password-reset' } })
    } catch (err) {
      const expired = err?.status === 401
      if (expired) setStep('email')
      setNotice({
        tone: 'error',
        title: expired ? 'The reset link expired' : 'Could not update the password',
        message: errorMessage(err, 'Please try again.'),
      })
    }
  }

  const { title, subtitle } = STEPS[step]
  const toggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand/40"
    >
      {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
    </button>
  )

  return (
    <AuthCard
      title={title}
      subtitle={step === 'code' ? `Enter the ${codeLength}-digit code sent to ${email.trim()}` : subtitle}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="text-ink underline underline-offset-2 transition-colors hover:text-brand-hover">
            Log in
          </Link>
        </>
      }
    >
      <SEO title="Reset password" path="/forgot-password" noindex />

      {step === 'email' && (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            autoComplete="email"
            required
          />
          <Button type="submit" size="lg" fullWidth loading={sending} className="mt-2">
            Send reset code
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={submitCode} className="flex flex-col gap-4">
          <Input
            label="Reset code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, codeLength))}
            placeholder={`${codeLength}-digit code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
          <Button type="submit" size="lg" fullWidth loading={verifying} disabled={code.length < codeLength} className="mt-2">
            Verify code
          </Button>
          <p className="text-center text-sm text-ink-tertiary">
            Didn&apos;t get it?{' '}
            <Button variant="link" onClick={() => requestCode()} loading={sending} className="align-baseline">
              Send a new code
            </Button>
            {' · '}
            <Button variant="link" onClick={() => setStep('email')} className="align-baseline">
              Change e-mail
            </Button>
          </p>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitPassword} className="flex flex-col gap-4">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText={hint}
            maxLength={72}
            required
            rightIcon={toggle}
          />
          <Input
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            maxLength={72}
            required
          />
          <Button type="submit" size="lg" fullWidth loading={saving} className="mt-2">
            Update password
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
