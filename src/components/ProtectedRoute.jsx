// Redux
import { useSelector } from 'react-redux'

// React Router
import { Navigate, useLocation } from 'react-router'

/**
 * Route guard.
 *
 * - Sends signed-out visitors to the login page (and back to where they were afterwards).
 * - `allowedRoles` restricts the routes to those roles. A session with another role (e.g. an
 *   admin who was demoted) goes to the login page with the "No admin access" notice, which
 *   also drops that session.
 * The role is re-checked against GET /auth/me by the dashboard shell (useSessionCheck).
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" state={{ notice: 'not-admin' }} replace />
  }

  return children
}
