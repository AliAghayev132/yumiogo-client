import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal, Input, Select, Button, Checkbox, useBanner, errorMessage } from '@components'
import { useCreateUserMutation } from '@store/api'

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY = { firstName: '', lastName: '', email: '', role: 'user', password: '', verified: false }

/**
 * "+ Add user" (Users table header) — modalBox form with the orange add tile. The account is
 * active at once (optionally with the verified badge); without a password the person is
 * e-mailed an invitation to choose one (when e-mail is configured on the server).
 */
export const AddUserModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [createUser, { isLoading }] = useCreateUserMutation()
  const banner = useBanner()

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const close = () => {
    setForm(EMPTY)
    setErrors({})
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required'
    if (!form.lastName.trim()) next.lastName = 'Last name is required'
    if (!EMAIL.test(form.email.trim())) next.email = 'Enter a valid e-mail address'
    if (form.password && (form.password.length < 6 || !/[A-Z]/.test(form.password) || !/[\d\W_]/.test(form.password))) {
      next.password = 'At least 6 characters, 1 uppercase letter and 1 number or symbol'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    try {
      const res = await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        verified: form.verified,
        ...(form.password ? { password: form.password } : {}),
      }).unwrap()
      const user = res?.data?.user
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
      if (form.password || res?.data?.invitationSent) {
        banner.success(
          form.password ? `${name} was added` : `${name} was added. An invitation e-mail was sent.`
        )
      } else {
        banner.warning(
          `${name} was added, but no invitation e-mail was sent (e-mail is not configured). Ask them to use “Forgot password”.`
        )
      }
      onCreated?.(user)
      close()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not add the user'))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      icon={Plus}
      tone="orange"
      title="Add new user"
      description="Create an account. Without a password, the person gets an e-mail to choose their own."
    >
      <form onSubmit={submit} noValidate>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Input label="First name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} placeholder="e.g. Leyla" maxLength={50} />
            <Input label="Last name" value={form.lastName} onChange={set('lastName')} error={errors.lastName} placeholder="e.g. Həsənova" maxLength={50} />
          </div>
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            placeholder="e.g. leyla@email.com"
            autoComplete="off"
          />
          <Select
            label="Role"
            value={form.role}
            options={ROLE_OPTIONS}
            clearable={false}
            onValueChange={(role) => setForm((f) => ({ ...f, role }))}
          />
          <Input
            label="Password (optional)"
            type="password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            helperText="Leave empty to send an invitation e-mail instead."
            autoComplete="new-password"
          />
          <Checkbox
            label="Verified badge"
            checked={form.verified}
            onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
          />
        </div>
        <Modal.Footer>
          <Button variant="outline" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Add user
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
