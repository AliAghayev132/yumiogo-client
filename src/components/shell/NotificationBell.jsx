import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, Bell, BellOff, MessageSquareMore, Store, Users } from 'lucide-react'
import { IconButton } from '../ui/Button'
import { IconTile } from '../ui/IconTile'
import { Popover } from '../ui/Popover'
import { Skeleton } from '../ui/Skeleton'
import { timeAgo } from '../ui/time'

// Notification type → icon tile (matches the dashboard activity/stat colours).
const TYPE_ICON = {
  report: { icon: AlertCircle, tone: 'red' },
  review: { icon: MessageSquareMore, tone: 'purple' },
  restaurant: { icon: Store, tone: 'orange' },
  user: { icon: Users, tone: 'blue' },
}

/**
 * NotificationBell — Figma header bell (40x40, #FAFAFA fill, #E0E0E0 border, radius 8) with a
 * 6px green unread dot; opens a dropdown feed.
 *
 * Props (all data comes from the caller — see useAdminNotifications):
 *   notifications: [{ id|_id, title, message|body, type (report|review|restaurant|user|…),
 *                     createdAt, read, link }]
 *   unreadCount (drives the dot), counts ({ openReports, pendingReviews, pendingRestaurants,
 *   pendingUsers } → "pending" chips linking to the pages), loading, error, onOpen(),
 *   onMarkAllRead(), onItemClick(n), viewAllHref.
 */
const PENDING = [
  { key: 'openReports', label: 'reports', to: '/dashboard/reports' },
  { key: 'pendingReviews', label: 'reviews', to: '/dashboard/reviews' },
  { key: 'pendingRestaurants', label: 'restaurants', to: '/dashboard/restaurants' },
  { key: 'pendingUsers', label: 'users', to: '/dashboard/users' },
]

export const NotificationBell = ({
  notifications = [],
  unreadCount,
  counts,
  loading = false,
  error,
  onOpen,
  onMarkAllRead,
  onItemClick,
  viewAllHref,
}) => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const unread = unreadCount ?? notifications.filter((n) => !n.read).length

  const toggle = () => {
    if (!open) onOpen?.()
    setOpen(!open)
  }

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon={Bell}
        label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        variant="secondary"
        size="md"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {unread > 0 && (
          <span className="absolute right-[5px] top-[5px] h-1.5 w-1.5 rounded-full bg-brand ring-2 ring-canvas" />
        )}
      </IconButton>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} placement="bottom-end" role="dialog" style={{ width: 360 }}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-bold text-ink">
            Notifications
            {!counts && unread > 0 && <span className="ml-2 text-xs font-medium text-ink-muted">{unread} new</span>}
          </p>
          {onMarkAllRead && unread > 0 && (
            <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-brand-hover hover:underline">
              Mark all as read
            </button>
          )}
        </div>

        {counts && PENDING.some((p) => counts[p.key] > 0) && (
          <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
            {PENDING.filter((p) => counts[p.key] > 0).map((p) => (
              <Link
                key={p.key}
                to={p.to}
                onClick={() => setOpen(false)}
                className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-ink-tertiary transition-colors hover:bg-line/70 hover:text-ink"
              >
                {counts[p.key]} {p.label} pending
              </Link>
            ))}
          </div>
        )}

        <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">Notifications could not be loaded.</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <IconTile icon={BellOff} tone="neutral" />
              <p className="mt-3 text-sm font-semibold text-ink">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-ink-muted">New reports, reviews and sign-ups will show up here.</p>
            </div>
          ) : (
            <ul className="py-1">
              {notifications.map((n) => {
                const t = TYPE_ICON[n.type] || { icon: Bell, tone: 'green' }
                const body = (
                  <>
                    <IconTile icon={t.icon} tone={t.tone} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-[18px] text-ink">
                        <span className="font-semibold">{n.title}</span>
                        {(n.message || n.body) && <span className="text-ink-muted"> {n.message || n.body}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-disabled">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </>
                )
                const cls = 'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas'
                const handle = () => {
                  setOpen(false)
                  onItemClick?.(n)
                }
                return (
                  <li key={n.id || n._id}>
                    {n.link ? (
                      <Link to={n.link} className={cls} onClick={handle}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" className={cls} onClick={handle}>
                        {body}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {viewAllHref && notifications.length > 0 && (
          <Link
            to={viewAllHref}
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-canvas"
          >
            View all
          </Link>
        )}
      </Popover>
    </>
  )
}
