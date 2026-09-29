import { useNavigate } from 'react-router'
import { Users } from 'lucide-react'
import { Modal, Input, Button, statusMeta, monthYear, formatNumber } from '@components'
import { useGetAdminUserQuery } from '@store/api'
import { fullName, STATUS_TEXT } from './userMeta'

/**
 * Figma modalBox 1329:27648 — quick profile: blue people_alt tile, the user's name,
 * "Quick profile overview…", read-only Reviews / Warnings / Status (coloured) / Joined, Close.
 * Opened from the row "View" chip or a `?user=<id>` link (bell, dashboard activity); the row
 * data shows at once and the detail request fills in / refreshes it.
 */
export const UserQuickView = ({ userId, initial, onClose }) => {
  const navigate = useNavigate()
  const { data, isError, isFetching } = useGetAdminUserQuery(userId, { skip: !userId })
  const user = data?.data?.user || initial
  const notFound = isError && !initial

  const status = user?.status
  const value = (v) => (user ? v : isFetching ? '…' : '—')

  return (
    <Modal
      isOpen={!!userId}
      onClose={onClose}
      icon={Users}
      tone="blue"
      title={notFound ? 'User not found' : user ? fullName(user) : 'Loading…'}
      description={
        notFound
          ? 'This account does not exist any more.'
          : 'Quick profile overview. Go to full profile for complete activity history.'
      }
      footer={
        <>
          {!notFound && (
            <Button variant="outline" onClick={() => navigate(`/dashboard/users/${userId}`)} disabled={!user}>
              Full profile
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {!notFound && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-3">
          <Input label="Reviews" value={value(formatNumber(user?.reviewCount ?? 0))} readOnly />
          <Input label="Warnings" value={value(formatNumber(user?.warningCount ?? 0))} readOnly />
          <Input
            label="Status"
            value={value(statusMeta(status, 'user').label)}
            readOnly
            className={`font-medium ${STATUS_TEXT[status] || ''}`}
          />
          <Input label="Joined" value={value(monthYear(user?.createdAt))} readOnly />
        </div>
      )}
    </Modal>
  )
}
