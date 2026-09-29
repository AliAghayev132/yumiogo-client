import { AlertTriangle, Ban, RotateCcw, UserCheck, PauseCircle, Shield, ShieldOff, Trash2 } from 'lucide-react'
import { useBanner, useConfirm, errorMessage } from '@components'
import {
  useWarnUserMutation,
  useBanUserMutation,
  useSuspendUserMutation,
  useRestoreUserMutation,
  useApproveUserMutation,
  useVerifyUserMutation,
  useSetUserRoleMutation,
  useDeleteUserMutation,
  useRemoveUserWarningMutation,
} from '@store/api'
import { fullName } from './userMeta'
import { SuspendLength } from './SuspendLength'

/**
 * Users moderation actions with the Figma modalBox copy (Warn 1331:28058, Ban 1332:28305,
 * Restore 1333:28429) and page snackbars ("Warning sent to … Notification delivered.").
 * Every action returns true when it went through. Server guards (your own account, the last
 * active admin) are shown inside the dialog and keep it open.
 */
export const useUserActions = () => {
  const confirm = useConfirm()
  const banner = useBanner()
  const [warnUser] = useWarnUserMutation()
  const [banUser] = useBanUserMutation()
  const [suspendUser] = useSuspendUserMutation()
  const [restoreUser] = useRestoreUserMutation()
  const [approveUser] = useApproveUserMutation()
  const [verifyUser] = useVerifyUserMutation()
  const [setUserRole] = useSetUserRoleMutation()
  const [deleteUser] = useDeleteUserMutation()
  const [removeUserWarning] = useRemoveUserWarningMutation()

  // Results go to the page outlet (the confirm dialog is closing at this point).
  const report = (tone, message) =>
    banner.show({ tone, message, host: 'page', duration: tone === 'error' ? 6000 : undefined })

  const warn = async (user) => {
    const name = fullName(user)
    const ok = await confirm({
      tone: 'warning',
      icon: AlertTriangle,
      title: `Issue a warning to ${name}`,
      message: 'The user will receive a notification explaining why they were warned.',
      reasonField: {
        label: 'Reason for warning',
        placeholder: 'e.g. Inappropriate review content...',
        required: true,
        maxLength: 500,
        requiredMessage: 'Enter the reason for the warning',
      },
      confirmText: 'Send warning',
      onConfirm: (reason) => warnUser({ id: user._id, reason }).unwrap(),
    })
    if (ok) report('warning', ok.result?.message || `Warning sent to ${name}. Notification delivered.`)
    return !!ok
  }

  const ban = async (user) => {
    const name = fullName(user)
    const ok = await confirm({
      tone: 'danger',
      icon: Ban,
      title: `Ban ${name}?`,
      message: 'This user will lose access to Yumio immediately and receive a notification.',
      notice: 'This action can be reversed later from the Users page.',
      reasonField: { label: 'Reason for ban', placeholder: 'e.g. Repeated policy violations...', maxLength: 500 },
      confirmText: 'Ban user',
      onConfirm: (reason) => banUser({ id: user._id, reason }).unwrap(),
    })
    if (ok) report('error', ok.result?.message || `${name} has been banned`)
    return !!ok
  }

  const suspend = async (user) => {
    const name = fullName(user)
    const choice = { days: '7' }
    const ok = await confirm({
      tone: 'warning',
      icon: PauseCircle,
      title: `Suspend ${name}?`,
      message: 'This user will lose access to Yumio until the suspension ends and receive a notification.',
      children: <SuspendLength initial={choice.days} onChange={(days) => (choice.days = days)} />,
      reasonField: { label: 'Reason for suspension', placeholder: 'e.g. Spam reviews...', maxLength: 500 },
      confirmText: 'Suspend user',
      confirmVariant: 'danger',
      onConfirm: (reason) =>
        suspendUser({ id: user._id, reason, days: choice.days ? Number(choice.days) : undefined }).unwrap(),
    })
    if (ok) report('warning', ok.result?.message || `${name} has been suspended`)
    return !!ok
  }

  const restore = async (user) => {
    const name = fullName(user)
    const ok = await confirm({
      tone: 'success',
      icon: RotateCcw,
      title: `Restore ${name}?`,
      message: 'This will reactivate their account. They will be notified and regain full access.',
      confirmText: 'Restore access',
      onConfirm: () => restoreUser(user._id).unwrap(),
    })
    if (ok) report('success', ok.result?.message || `${name} has been restored`)
    return !!ok
  }

  const approve = async (user) => {
    const name = fullName(user)
    const ok = await confirm({
      tone: 'success',
      icon: UserCheck,
      title: `Approve ${name}?`,
      message: 'Their account will be activated. They will be notified and can sign in right away.',
      confirmText: 'Approve',
      onConfirm: () => approveUser(user._id).unwrap(),
    })
    if (ok) report('success', ok.result?.message || `${name} has been approved`)
    return !!ok
  }

  const verify = async (user, verified = !user.verified) => {
    try {
      const res = await verifyUser({ id: user._id, verified }).unwrap()
      report('success', res?.message || (verified ? 'Verified badge added' : 'Verified badge removed'))
      return true
    } catch (err) {
      report('error', errorMessage(err, 'Could not update the verified badge'))
      return false
    }
  }

  const setRole = async (user, role = user.role === 'admin' ? 'user' : 'admin') => {
    const name = fullName(user)
    const promote = role === 'admin'
    const ok = await confirm({
      tone: promote ? 'info' : 'warning',
      icon: promote ? Shield : ShieldOff,
      title: promote ? `Make ${name} an admin?` : `Remove admin access from ${name}?`,
      message: promote
        ? 'Admins can manage users, restaurants, reviews, reports and settings. They are signed out and need to sign in again.'
        : 'They will lose access to the admin panel and be signed out.',
      confirmText: promote ? 'Make admin' : 'Remove admin',
      onConfirm: () => setUserRole({ id: user._id, role }).unwrap(),
    })
    if (ok) report('success', promote ? `${name} is now an admin` : `${name} is no longer an admin`)
    return !!ok
  }

  const remove = async (user) => {
    const name = fullName(user)
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete ${name}?`,
      message: 'The account is closed and personal data is anonymised. Their reviews are hidden and ratings recalculated.',
      notice: 'This action cannot be undone.',
      confirmText: 'Delete user',
      onConfirm: () => deleteUser(user._id).unwrap(),
    })
    if (ok) report('error', `${name} was deleted`)
    return !!ok
  }

  const removeWarning = async (user, warning) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Remove this warning?',
      message: `“${warning.reason}” will be removed from ${fullName(user)}'s record. The user is not notified.`,
      confirmText: 'Remove warning',
      onConfirm: () => removeUserWarning({ id: user._id, warningId: warning._id }).unwrap(),
    })
    if (ok) report('success', 'Warning removed')
    return !!ok
  }

  return { warn, ban, suspend, restore, approve, verify, setRole, remove, removeWarning }
}
