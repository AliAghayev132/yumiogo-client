// React Router
import { Navigate, Route, Routes, useParams } from 'react-router'

// Layouts
import { DashboardLayout } from '@layouts'

// Components
import { ProtectedRoute, isTaxonomyType } from '@components'

// Pages
import {
  DashboardPage,
  AnalyticsPage,
  UsersPage,
  UserDetailPage,
  RestaurantsPage,
  RestaurantDetailPage,
  ImportRestaurantsPage,
  ReviewsPage,
  ReportsPage,
  ListsPage,
  SettingsPage,
  ProfilePage,
  TaxonomyPage,
  CitiesPage,
  FaqsPage,
  LegalPagesPage,
  OnboardingPage,
  AppConfigPage,
  BroadcastPage,
} from '@pages/dashboard'
import { NotFoundPage } from '@pages/public'

// /dashboard/catalog/:type — unknown types fall back to Cuisines. Keyed by type
// so switching between taxonomy types starts with fresh page state.
const TaxonomyRoute = () => {
  const { type } = useParams()
  if (!isTaxonomyType(type)) return <Navigate to="/dashboard/catalog/cuisine" replace />
  return <TaxonomyPage key={type} type={type} />
}

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
      <Route path="users/:id" element={<UserDetailPage />} />
      <Route path="restaurants" element={<RestaurantsPage />} />
      <Route path="restaurants/import" element={<ImportRestaurantsPage />} />
      <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
      <Route path="reviews" element={<ReviewsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="lists" element={<ListsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="broadcast" element={<BroadcastPage />} />

      {/* Catalog: taxonomies + cities */}
      <Route path="catalog" element={<Navigate to="/dashboard/catalog/cuisine" replace />} />
      <Route path="catalog/:type" element={<TaxonomyRoute />} />
      <Route path="cities" element={<CitiesPage />} />

      {/* Content: app config, FAQs, legal pages, onboarding */}
      <Route path="content" element={<Navigate to="/dashboard/content/app-config" replace />} />
      <Route path="content/app-config" element={<AppConfigPage />} />
      <Route path="content/faqs" element={<FaqsPage />} />
      <Route path="content/pages" element={<LegalPagesPage />} />
      <Route path="content/onboarding" element={<OnboardingPage />} />

      <Route path="profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
