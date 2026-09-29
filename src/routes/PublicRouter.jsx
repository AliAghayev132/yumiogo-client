// React Router
import { Navigate, Route, Routes } from 'react-router'

// Pages
import { HomePage, LoginPage, ForgotPasswordPage, LegalPage, NotFoundPage } from '@pages/public'
import { ListLandingPage, RestaurantLandingPage, InviteLandingPage, ReviewLandingPage } from '@pages/public'

export const PublicRouter = () => (
  <Routes>
    {/* Landing page ships its own nav + footer */}
    <Route path="/" element={<HomePage />} />

    {/* Admin sign-in. There is no public sign-up: admins are added under Users → Add user
        (old /register links land on the login page). */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/register" element={<Navigate to="/login" replace />} />

    {/* Legal pages (Terms / Privacy / Cookies), managed under Content → Legal pages */}
    <Route path="/legal/:slug" element={<LegalPage />} />

    {/* Landing pages of links shared from the app ("Open in Yumio" + store buttons) */}
    <Route path="/list/:slug" element={<ListLandingPage />} />
    <Route path="/restaurant/:idOrSlug" element={<RestaurantLandingPage />} />
    <Route path="/invite/:code" element={<InviteLandingPage />} />
    <Route path="/review/:id" element={<ReviewLandingPage />} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
