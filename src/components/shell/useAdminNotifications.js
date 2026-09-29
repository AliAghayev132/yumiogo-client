import { useCallback, useMemo } from 'react'
import { useGetAdminNotificationFeedQuery, useMarkAdminNotificationsReadMutation } from './notificationsApi'

// Alert kind (server alertKind) → bell icon type.
const KIND_TYPE = { new_report: 'report', report: 'report', review: 'review', user: 'user', restaurant: 'restaurant' }

/**
 * useAdminNotifications — data for the header NotificationBell from GET /admin/notifications.
 * Unread alerts come first (they can be marked read), then the moderation queue (open reports,
 * pending restaurants / users / reviews), newest first. Polls every 60 s and refetches when the
 * bell opens.
 * Returns { notifications, unreadCount, counts, loading, error, refetch, markAllRead, markRead }.
 */
export const useAdminNotifications = ({ limit = 20, pollingInterval = 60_000 } = {}) => {
  const { data, isLoading, isError, refetch } = useGetAdminNotificationFeedQuery({ limit }, { pollingInterval, refetchOnFocus: true })
  const [markReadApi] = useMarkAdminNotificationsReadMutation()
  const feed = data?.data

  const notifications = useMemo(() => {
    if (!feed) return []
    const alerts = (feed.alerts || []).map((a) => ({
      id: String(a._id),
      alert: true,
      type: KIND_TYPE[a.kind] || 'system',
      title: a.title,
      message: a.message,
      createdAt: a.createdAt,
      read: a.read,
      link: a.link,
    }))
    const queue = (feed.items || []).map((i) => ({
      id: `${i.type}-${i.id}`,
      type: i.type,
      title: i.title,
      message: i.message,
      createdAt: i.at,
      read: false,
      link: i.link,
    }))
    return [...alerts.filter((a) => !a.read), ...queue, ...alerts.filter((a) => a.read)].slice(0, limit)
  }, [feed, limit])

  const markAllRead = useCallback(() => markReadApi({}).unwrap().catch(() => {}), [markReadApi])
  const markRead = useCallback(
    (n) => {
      if (n?.alert && !n.read) markReadApi({ ids: [n.id] }).unwrap().catch(() => {})
    },
    [markReadApi]
  )

  return {
    notifications,
    // Dot + "N new": unread alerts plus everything waiting in the moderation queue.
    unreadCount: (feed?.unread || 0) + (feed?.counts?.total || 0),
    counts: feed?.counts,
    loading: isLoading,
    error: isError ? true : null,
    refetch,
    markAllRead: feed?.unread ? markAllRead : undefined,
    markRead,
  }
}
