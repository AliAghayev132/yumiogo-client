// React Router
import { Route, Routes } from 'react-router'

// Layouts
import { DashboardLayout } from '@layouts'

// Components
import { ProtectedRoute } from '@components'

// Pages
import {
  DashboardPage,
  AnalyticsPage,
  UsersPage,
  RestaurantsPage,
  ReviewsPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
} from '@pages/dashboard'
import { NotFoundPage } from '@pages/public'

export const DashboardRouter = () => (
  <Routes>
    {/* The whole admin panel requires an authenticated admin. */}
    <Route
      path="/"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="restaurants" element={<RestaurantsPage />} />
      <Route path="reviews" element={<ReviewsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
