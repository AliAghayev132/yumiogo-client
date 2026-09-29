import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Camera, Eye, EyeOff, Trash2 } from 'lucide-react'

import {
  SEO,
  Card,
  Input,
  Button,
  Badge,
  Avatar,
  Banner,
  Skeleton,
  useBanner,
  useConfirm,
  errorMessage,
  monthYear,
} from '@components'
import {
  useGetMeQuery,
  useGetAuthConfigQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useDeleteAvatarMutation,
  useChangePasswordMutation,
} from '@store/api'
import { updateUser, setTokens } from '@store/slices/authSlice'

const AVATAR_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/heic'
const AVATAR_MAX_MB = 5
// Fallback copy of the server password rule (GET /auth/config returns the live one).
const PASSWORD_HINT = 'At least 6 characters, 1 uppercase letter and 1 number or special character.'

/** Card with a title (+ description) over a full-width divider — same anatomy as the editor cards. */
const Section = ({ title, description, children }) => (
  <Card padding="chart">
    <Card.Header divider className="-mx-[18px] px-[18px]">
      <Card.Title>{title}</Card.Title>
      {description && <p className="mt-0.5 font-chart text-xs text-ink-muted">{description}</p>}
    </Card.Header>
    {children}
  </Card>
)

const PasswordInput = ({ label, value, onChange, autoComplete, error, helperText }) => {
  const [visible, setVisible] = useState(false)
  return (
    <Input
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      error={error}
      helperText={helperText}
      maxLength={72}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand/40"
        >
          {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      }
    />
  )
}

/** Profile header: photo (upload / remove), name, e-mail, role and join date. */
const ProfileHeader = ({ user }) => {
  const dispatch = useDispatch()
  const banner = useBanner()
  const confirm = useConfirm()
  const inputRef = useRef(null)
  const [uploadAvatar, { isLoading: uploading }] = useUpdateAvatarMutation()
  const [deleteAvatar] = useDeleteAvatarMutation()

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      banner.error(`The photo must be ${AVATAR_MAX_MB} MB or smaller.`)
      return
    }
    const body = new FormData()
    body.append('avatar', file)
    try {
      const res = await uploadAvatar(body).unwrap()
      dispatch(updateUser({ avatar: res.avatar ?? null }))
      banner.success('Profile photo updated')
    } catch (err) {
      banner.error(errorMessage(err, 'Could not upload the photo'))
    }
  }

  const remove = async () => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Remove your profile photo?',
      message: 'Your initials are shown instead.',
      confirmText: 'Remove photo',
      onConfirm: () => deleteAvatar().unwrap(),
    })
    if (!ok) return
    dispatch(updateUser({ avatar: null }))
    banner.success('Profile photo removed')
  }

  return (
    <Card padding="sm" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar
        src={user.avatar}
        firstName={user.firstName}
        lastName={user.lastName}
        seed={user._id || user.id}
        tone="green"
        size="xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-display text-2xl font-medium leading-8 text-ink">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
          </h2>
          <Badge tone="success" size="sm">
            {user.role === 'admin' ? 'Administrator' : user.role}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {user.email}
          {user.createdAt ? ` · Joined ${monthYear(user.createdAt)}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept={AVATAR_TYPES} className="hidden" onChange={pick} />
        <Button size="sm" variant="outline" leftIcon={Camera} loading={uploading} onClick={() => inputRef.current?.click()}>
          {user.avatar ? 'Change photo' : 'Upload photo'}
        </Button>
        {user.avatar && (
          <Button size="sm" variant="ghost" leftIcon={Trash2} onClick={remove}>
            Remove
          </Button>
        )}
      </div>
    </Card>
  )
}

/** First / last name and phone. Saving refreshes the name in the sidebar. */
const DetailsForm = ({ user }) => {
  const dispatch = useDispatch()
  const banner = useBanner()
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()
  const initial = { firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'Enter your first name'
    if (!form.lastName.trim()) next.lastName = 'Enter your last name'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const saved = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
      }).unwrap()
      if (saved) dispatch(updateUser(saved))
      banner.success('Profile updated')
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save your profile'))
    }
  }

  return (
    <Section title="Account details" description="Your name is shown in the sidebar and on moderation records.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} maxLength={50} autoComplete="given-name" required />
          <Input label="Last name" value={form.lastName} onChange={set('lastName')} error={errors.lastName} maxLength={50} autoComplete="family-name" required />
        </div>
        <Input label="Email" value={user.email || ''} disabled helperText="The sign-in e-mail cannot be changed here." />
        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="Optional, e.g. +994 50 123 45 67" autoComplete="tel" maxLength={40} />
        <div>
          <Button type="submit" size="sm" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Section>
  )
}

/** Change password — the server signs out every other session and returns a new token pair. */
const PasswordForm = ({ hasPassword }) => {
  const dispatch = useDispatch()
  const banner = useBanner()
  const { data: authConfig } = useGetAuthConfigQuery()
  const [changePassword, { isLoading: saving }] = useChangePasswordMutation()
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const rules = authConfig?.password?.rules
  const hint = rules?.length ? `Use ${rules.map((r) => r.label).join(', ')}.` : PASSWORD_HINT

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (hasPassword && !form.currentPassword) next.currentPassword = 'Enter your current password'
    if (!form.newPassword) next.newPassword = 'Enter a new password'
    if (form.newPassword && form.confirmPassword !== form.newPassword) next.confirmPassword = 'The passwords do not match'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const res = await changePassword({
        ...(hasPassword ? { currentPassword: form.currentPassword } : {}),
        newPassword: form.newPassword,
      }).unwrap()
      if (res?.tokens?.accessToken) dispatch(setTokens(res.tokens))
      setForm(empty)
      banner.success('Password changed. Other devices were signed out.')
    } catch (err) {
      const message = errorMessage(err, 'Could not change the password')
      const code = err?.data?.code
      if (code === 'CURRENT_PASSWORD_INVALID' || code === 'CURRENT_PASSWORD_REQUIRED') setErrors({ currentPassword: message })
      else if (code?.startsWith('PASSWORD')) setErrors({ newPassword: message })
      else banner.error(message)
    }
  }

  return (
    <Section title="Change password" description="Changing it signs you out on every other device.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {hasPassword && (
          <PasswordInput
            label="Current password"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            autoComplete="current-password"
            error={errors.currentPassword}
          />
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordInput
            label="New password"
            value={form.newPassword}
            onChange={set('newPassword')}
            autoComplete="new-password"
            error={errors.newPassword}
            helperText={errors.newPassword ? undefined : hint}
          />
          <PasswordInput
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </div>
        <div>
          <Button type="submit" size="sm" loading={saving} disabled={!form.newPassword}>
            Change password
          </Button>
        </div>
      </form>
    </Section>
  )
}

/**
 * Profile (/dashboard/profile, sidebar user menu → Profile): the signed-in admin's photo,
 * name and phone (GET /auth/me, PUT /auth/profile, PUT|DELETE /auth/avatar) and password
 * (PUT /auth/change-password). Saved changes update the auth slice, so the sidebar follows.
 */
export const ProfilePage = () => {
  const { data: user, isLoading, isError, refetch } = useGetMeQuery()

  if (isLoading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <Banner tone="error" action={{ label: 'Retry', onClick: refetch }}>
        Could not load your profile.
      </Banner>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <SEO title="Profile" noindex />
      <ProfileHeader user={user} />
      {/* Keyed by the saved values so the form re-hydrates after a save or a refetch. */}
      <DetailsForm key={`${user.firstName}|${user.lastName}|${user.phone}`} user={user} />
      <PasswordForm hasPassword={user.hasPassword !== false} />
    </div>
  )
}
