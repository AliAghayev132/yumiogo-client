import { Link } from 'react-router'
import { SEO } from '@components'

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <SEO title="Not found" noindex />
      <p className="text-7xl font-bold text-green-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
      >
        Back home
      </Link>
    </div>
  )
}
