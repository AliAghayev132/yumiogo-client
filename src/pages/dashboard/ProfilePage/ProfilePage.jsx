import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'

import { SEO, Card, Input, Button, Badge, PageLoader } from '@components'
import { useGetMeQuery, useUpdateProfileMutation } from '@store/api'
import { updateUser } from '@store/slices/authSlice'

export const ProfilePage = () => {
  const dispatch = useDispatch()
  const { data, isLoading } = useGetMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()

  const user = data?.data

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' })

  // Hydrate the form once the current user has loaded from the server.
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await updateProfile(form).unwrap()
      // Keep the auth slice / localStorage in sync with the saved user.
      dispatch(updateUser(res.data || form))
      Swal.fire({
        icon: 'success',
        title: 'Profile updated',
        timer: 1600,
        showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update failed',
        text: err?.data?.message || 'Could not save your profile.',
      })
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-2xl space-y-6">
      <SEO title="Profile" noindex />

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your account details.</p>
      </div>

      <Card padding="lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-green-600 text-white text-xl font-semibold flex items-center justify-center">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{user?.email}</span>
              {user?.role && <Badge variant="primary">{user.role}</Badge>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Optional"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
