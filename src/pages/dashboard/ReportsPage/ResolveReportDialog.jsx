import { useState } from 'react'
import { Check } from 'lucide-react'
import { Checkbox, ConfirmDialog, Input, Select, useBanner } from '@components'
import { useUpdateModerationReportMutation } from '@store/api'

// What resolving a report may do to the reported item (server reportActions): reviews can be
// hidden or deleted, lists removed. Users and restaurants are moderated on their own pages.
const TARGET_ACTIONS = {
  review: {
    label: 'Action on the review',
    options: [
      { value: 'none', label: 'No change to the review' },
      { value: 'hide_review', label: 'Hide the review (reject it)' },
      { value: 'delete_review', label: 'Delete the review' },
    ],
    help: 'The author is notified, the restaurant rating is recalculated and other open reports on this review are closed.',
  },
  list: {
    label: 'Action on the list',
    options: [
      { value: 'none', label: 'No change to the list' },
      { value: 'remove_list', label: 'Remove the list' },
    ],
    help: 'The list is removed from the app, its owner is notified and other open reports on it are closed.',
  },
}

const ResolveForm = ({ report, onClose, onDone }) => {
  const [note, setNote] = useState('')
  const [action, setAction] = useState('none')
  const [notifyReporter, setNotifyReporter] = useState(true)
  const [updateReport] = useUpdateModerationReportMutation()
  const banner = useBanner()
  const targetActions = TARGET_ACTIONS[report.targetType]
  const targetGone = !report.target || report.target.isDeleted
  const canAct = !!targetActions && !targetGone

  // The note is our own field (not reasonField) so it sits right under the message as in the Figma.
  const resolve = async () => {
    const res = await updateReport({
      id: report._id,
      status: 'resolved',
      resolutionNote: note.trim() || undefined,
      action: canAct ? action : 'none',
      notifyReporter,
    }).unwrap()
    onClose()
    banner.success(res?.message || `Report #${report.number} resolved — reporter notified`)
    onDone?.(res?.data?.report)
  }

  return (
    <ConfirmDialog
      isOpen
      onClose={onClose}
      tone="success"
      icon={Check}
      title={`Resolve Report #${report.number}?`}
      message={
        report.reporter
          ? 'Mark this report as resolved. The reporter will be notified.'
          : 'Mark this report as resolved.'
      }
      confirmText="Mark resolved"
      onConfirm={resolve}
    >
      <Input
        label="Resolution note (optional)"
        placeholder="e.g. Reviewed and action taken..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        data-autofocus
      />
      {canAct && (
        <Select
          label={targetActions.label}
          value={action}
          onValueChange={setAction}
          options={targetActions.options}
          helperText={action === 'none' ? undefined : targetActions.help}
        />
      )}
      {report.reporter && (
        <Checkbox
          label="Notify the reporter"
          checked={notifyReporter}
          onChange={(e) => setNotifyReporter(e.target.checked)}
        />
      )}
    </ConfirmDialog>
  )
}

/**
 * Figma modalBox 1353:7357 "Resolve Report #N?" with the optional resolution note, plus
 * (for review and list reports) the enforcement on the item and the notify-reporter switch.
 * Rendered while `report` is set; onClose() cancels, onDone(updatedReport) after success.
 */
export const ResolveReportDialog = ({ report, onClose, onDone }) =>
  report ? <ResolveForm key={report._id} report={report} onClose={onClose} onDone={onDone} /> : null
