import { Ban, Check, Hourglass, RotateCcw, Trash2, X } from 'lucide-react'
import { useBanner, useConfirm, errorMessage } from '@components'
import {
  useApproveRestaurantMutation,
  useRejectRestaurantMutation,
  useSuspendRestaurantMutation,
  useRestoreRestaurantMutation,
  useDeleteRestaurantMutation,
  usePurgeRestaurantMutation,
  useSetRestaurantStatusMutation,
} from '@store/api'

/**
 * Restaurant moderation actions with the Figma modalBox copy: Approve (1338:4347), Reject with
 * a reason (1338:4111), Restore (1338:4302), Remove (1334:28752) — plus Suspend and the Trash-only
 * "Remove permanently" (the exact Remove modalBox copy, now that it is a real hard delete). Every action
 * returns true when it went through; server errors (e.g. "Cannot approve a restaurant that
 * is active") are shown inside the dialog.
 */
export const useRestaurantActions = () => {
  const confirm = useConfirm()
  const banner = useBanner()
  const [approveRestaurant] = useApproveRestaurantMutation()
  const [rejectRestaurant] = useRejectRestaurantMutation()
  const [suspendRestaurant] = useSuspendRestaurantMutation()
  const [restoreRestaurant] = useRestoreRestaurantMutation()
  const [deleteRestaurant] = useDeleteRestaurantMutation()
  const [purgeRestaurant] = usePurgeRestaurantMutation()
  const [setRestaurantStatus] = useSetRestaurantStatusMutation()

  // Results go to the page outlet (the confirm dialog is closing at this point).
  const report = (tone, message, extra) =>
    banner.show({ tone, message, host: 'page', duration: tone === 'error' ? 7000 : undefined, ...extra })

  const approve = async (r) => {
    const ok = await confirm({
      tone: 'success',
      icon: Check,
      title: `Approve ${r.name}?`,
      message: 'This restaurant will go live on the platform and be visible to all users.',
      confirmText: 'Approve & publish',
      onConfirm: () => approveRestaurant(r._id).unwrap(),
    })
    if (ok) report('success', ok.result?.message || `${r.name} is now live`)
    return !!ok
  }

  // Pending, live or suspended listings can be rejected (a live one is taken down).
  const reject = async (r) => {
    const ok = await confirm({
      tone: 'danger',
      icon: X,
      title: `Reject ${r.name}?`,
      message:
        r.status === 'pending'
          ? 'This restaurant listing will be rejected and not published.'
          : 'This restaurant will be taken down and hidden from the app.',
      reasonField: {
        label: 'Reason for rejection',
        placeholder: 'e.g. Incomplete information provided...',
        required: true,
        maxLength: 500,
        requiredMessage: 'Enter the reason for the rejection',
      },
      confirmText: 'Reject',
      onConfirm: (reason) => rejectRestaurant({ id: r._id, reason }).unwrap(),
    })
    if (ok) report('error', ok.result?.message || `${r.name} has been rejected`)
    return !!ok
  }

  // Live or pending listings can be suspended.
  const suspend = async (r) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Ban,
      title: `Suspend ${r.name}?`,
      message:
        r.status === 'pending'
          ? 'This listing will stay hidden from the app until it is restored.'
          : 'This restaurant will be hidden from the app until it is restored.',
      reasonField: { label: 'Reason for suspension', placeholder: 'e.g. Health inspection pending...', maxLength: 500 },
      confirmText: 'Suspend',
      onConfirm: (reason) => suspendRestaurant({ id: r._id, reason }).unwrap(),
    })
    if (ok) report('warning', ok.result?.message || `${r.name} has been suspended`)
    return !!ok
  }

  const restore = async (r) => {
    const ok = await confirm({
      tone: 'success',
      icon: RotateCcw,
      title: `Restore ${r.name}?`,
      message: 'This restaurant will become active and visible in the app again.',
      confirmText: 'Restore',
      onConfirm: () => restoreRestaurant(r._id).unwrap(),
    })
    if (ok) report('success', ok.result?.message || `${r.name} has been restored`)
    return !!ok
  }

  // Back to the approval queue (PATCH /admin/restaurants/:id/status — any status is allowed there).
  const toPending = async (r) => {
    const ok = await confirm({
      tone: 'warning',
      icon: Hourglass,
      title: `Move ${r.name} back to pending?`,
      message: 'The listing is hidden from the app until it is approved again.',
      confirmText: 'Move to pending',
      onConfirm: () => setRestaurantStatus({ id: r._id, status: 'pending' }).unwrap(),
    })
    if (ok) report('warning', `${r.name} is waiting for approval`)
    return !!ok
  }

  // Removing is a soft delete: the listing moves to Trash, where Restore brings it back.
  const remove = async (r) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Remove ${r.name}?`,
      message: 'This restaurant will be removed from the platform and hidden from the app.',
      notice: 'It moves to Trash with its reviews. You can restore it from the Trash tab.',
      confirmText: 'Remove',
      onConfirm: () => deleteRestaurant(r._id).unwrap(),
    })
    if (!ok) return false
    // Restore re-publishes, so Undo is only offered for listings that were live.
    let notice = null
    const undo = {
      label: 'Undo',
      onClick: async () => {
        banner.dismiss(notice)
        try {
          await restoreRestaurant(r._id).unwrap()
          banner.show({ tone: 'success', message: `${r.name} has been restored`, host: 'page' })
        } catch (err) {
          banner.show({ tone: 'error', message: errorMessage(err, 'Could not restore'), host: 'page' })
        }
      },
    }
    notice = report('error', `${r.name} was removed`, r.status === 'active' ? { action: undo } : {})
    return true
  }

  // Hard delete from Trash — Figma "Remove {name}?" modalBox (1334:28752) copy, word for word.
  const purge = async (r) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Remove ${r.name}?`,
      message: 'This restaurant will be permanently removed from the platform.',
      notice: 'This action cannot be undone. All linked reviews will be archived.',
      confirmText: 'Remove permanently',
      onConfirm: () => purgeRestaurant(r._id).unwrap(),
    })
    if (ok) report('error', ok.result?.message || `${r.name} was permanently removed`)
    return !!ok
  }

  return { approve, reject, suspend, restore, toPending, remove, purge }
}
