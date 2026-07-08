// React Router
import { Route, Routes } from 'react-router'

// Layouts
import { PublicLayout } from '@layouts'

// Pages
import { HomePage, LoginPage, RegisterPage, NotFoundPage } from '@pages/public'

export const PublicRouter = () => (
  <Routes>
    {/* Pages that share the marketing header/footer */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
    </Route>

    {/* Standalone auth pages */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
