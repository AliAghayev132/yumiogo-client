import { Trash2 } from 'lucide-react'
import { useBanner, useConfirm } from '@components'
import { useRemoveAdminListMutation } from '@store/api'

/**
 * Remove a favourite list — the Figma destructive modalBox with a reason field (same pattern as
 * "Delete Review #N?"). The server soft-deletes the list (share link stops working, it leaves
 * feeds and saves), closes its open reports and notifies the owner with the reason; there is no
 * restore, so the notice says it cannot be undone. Resolves true when the list was removed.
 */
export const useListActions = () => {
  const confirm = useConfirm()
  const banner = useBanner()
  const [removeList] = useRemoveAdminListMutation()

  const remove = async (list) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Remove “${list.name}”?`,
      message: 'The list disappears from the app and its share link stops working. The owner will be notified with the reason.',
      notice: list.openReports
        ? `This cannot be undone. The ${list.openReports === 1 ? 'open report' : `${list.openReports} open reports`} about it will be resolved.`
        : 'This cannot be undone.',
      reasonField: {
        label: 'Reason for removal',
        placeholder: 'e.g. Offensive list name...',
        maxLength: 500,
      },
      confirmText: 'Remove list',
      onConfirm: (reason) => removeList({ id: list._id, reason, ownerId: list.owner?._id }).unwrap(),
    })
    if (!ok) return false
    // Figma: deletions report in the red snackbar.
    banner.error(ok.result?.message || `“${list.name}” was removed — owner notified`, { duration: 5000, host: 'page' })
    return true
  }

  return { remove }
}
