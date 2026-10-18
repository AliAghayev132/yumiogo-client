import { Hourglass, RotateCcw, Trash2, X } from 'lucide-react'
import { useBanner, useConfirm } from '@components'
import { useUpdateModerationReportMutation, useDeleteModerationReportMutation } from '@store/api'

/**
 * Report flows that are plain confirmations (Figma modalBox 1353:8245 "Dismiss Report #N?",
 * the trash action, "in review" and reopen). Resolve has its own dialog (ResolveReportDialog)
 * because of the review action and notify options. Each resolves true when done.
 */
export const useReportActions = () => {
  const confirm = useConfirm()
  const banner = useBanner()
  const [updateReport] = useUpdateModerationReportMutation()
  const [deleteReport] = useDeleteModerationReportMutation()

  const setStatus = async (report, status, options, fallback, tone = 'success') => {
    const ok = await confirm({
      ...options,
      onConfirm: (note) => updateReport({ id: report._id, status, resolutionNote: note || undefined }).unwrap(),
    })
    if (!ok) return false
    banner[tone](ok.result?.message || fallback)
    return true
  }

  const dismiss = (report) =>
    setStatus(
      report,
      'dismissed',
      {
        tone: 'danger',
        icon: X,
        title: `Dismiss Report #${report.number}?`,
        message: report.reporter
          ? 'No action will be taken. The reporter will be notified that their report was reviewed.'
          : 'No action will be taken.',
        confirmText: 'Dismiss report',
      },
      `Report #${report.number} dismissed`
    )

  const markInReview = (report) =>
    setStatus(
      report,
      'in_review',
      {
        tone: 'warning',
        icon: Hourglass,
        title: `Mark Report #${report.number} in review?`,
        message: 'Other moderators see that someone is already looking at this report.',
        confirmText: 'Mark in review',
      },
      `Report #${report.number} marked in review`,
      'info'
    )

  const reopen = (report) =>
    setStatus(
      report,
      'open',
      {
        tone: 'info',
        icon: RotateCcw,
        title: `Reopen Report #${report.number}?`,
        message: 'The report goes back to the open queue. Actions already taken on the reported item stay as they are.',
        confirmText: 'Reopen',
      },
      `Report #${report.number} reopened`,
      'info'
    )

  const remove = async (report) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete Report #${report.number}?`,
      message: 'The report is removed from the queue permanently. The reporter is not notified.',
      confirmText: 'Delete report',
      onConfirm: () => deleteReport({ id: report._id, report }).unwrap(),
    })
    if (!ok) return false
    banner.error(ok.result?.message || `Report #${report.number} deleted`, { duration: 5000, host: 'page' })
    return true
  }

  return { dismiss, markInReview, reopen, remove }
}
