import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGetMeQuery } from '@store/api'
import { updateUser } from '@store/slices/authSlice'

// Profile fields the shell shows (sidebar user row) — kept in step with the server.
const SYNCED = ['firstName', 'lastName', 'email', 'avatar', 'role', 'status']

/**
 * Re-validates the stored session against GET /auth/me (on mount, on window focus and whenever
 * a 403 from an admin endpoint invalidates the 'Auth' tag — see baseApi). The persisted auth
 * slice is only a snapshot, so:
 *  - a session whose account is no longer an admin calls `onDenied` (the shell signs it out);
 *  - name / photo / role changes made elsewhere are copied into the auth slice.
 */
export const useSessionCheck = ({ onDenied } = {}) => {
  const dispatch = useDispatch()
  const stored = useSelector((state) => state.auth.user)
  const { data: me } = useGetMeQuery(undefined, { refetchOnFocus: true })

  useEffect(() => {
    if (!me) return
    if (me.role !== 'admin') {
      onDenied?.()
      return
    }
    const changed = SYNCED.some((key) => (me[key] ?? null) !== (stored?.[key] ?? null))
    if (changed) dispatch(updateUser(Object.fromEntries(SYNCED.map((key) => [key, me[key] ?? null]))))
  }, [me, stored, onDenied, dispatch])
}

export default useSessionCheck
