import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSocket } from '@store/context'
import { baseApi } from '@store/api/baseApi'

// Caches that a server push can make stale: stats / sidebar counters / bell (AdminStats) and the
// lists an alert is about (new users, reports, pending reviews and restaurants).
const ALERT_TAGS = [
  'AdminStats',
  { type: 'AdminUser', id: 'LIST' },
  { type: 'AdminReport', id: 'LIST' },
  { type: 'AdminReview', id: 'LIST' },
  { type: 'AdminRestaurant', id: 'LIST' },
]

/**
 * Live admin data over the socket (mounted once by the dashboard shell):
 *  - `admin:alert` (new user, new report, …) and `notification:new` refresh the sidebar
 *    counters, the notifications bell and the affected lists right away (polling stays as the
 *    fallback);
 *  - `app:maintenance` refreshes the settings (maintenance switch);
 *  - `account:status` for this admin (suspended / banned) calls `onSignedOut`.
 */
export const useAdminLiveUpdates = ({ onSignedOut } = {}) => {
  const { socket } = useSocket()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!socket) return undefined
    const refresh = () => dispatch(baseApi.util.invalidateTags(ALERT_TAGS))
    const onMaintenance = () => dispatch(baseApi.util.invalidateTags(['AdminSettings']))
    const onAccount = (data) => {
      if (data?.status && data.status !== 'active') onSignedOut?.(data)
    }
    socket.on('admin:alert', refresh)
    socket.on('notification:new', refresh)
    socket.on('app:maintenance', onMaintenance)
    socket.on('account:status', onAccount)
    return () => {
      socket.off('admin:alert', refresh)
      socket.off('notification:new', refresh)
      socket.off('app:maintenance', onMaintenance)
      socket.off('account:status', onAccount)
    }
  }, [socket, dispatch, onSignedOut])
}

export default useAdminLiveUpdates
