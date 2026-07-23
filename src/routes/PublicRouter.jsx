// React Router
import { Route, Routes } from 'react-router'

// Pages
import { HomePage, LoginPage, RegisterPage, NotFoundPage } from '@pages/public'

export const PublicRouter = () => (
  <Routes>
    {/* Landing page ships its own nav + footer (full-bleed dark design) */}
    <Route path="/" element={<HomePage />} />

    {/* Standalone auth pages */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
