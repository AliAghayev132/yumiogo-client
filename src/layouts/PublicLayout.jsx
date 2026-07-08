import { Link, Outlet } from 'react-router'
import { useSelector } from 'react-redux'

// Simple marketing/public shell: header + <Outlet/> + footer.
export const PublicLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-100 sticky top-0 z-10 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900">
            Starter
          </Link>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-6 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Starter</span>
          <span>Built with React + Vite</span>
        </div>
      </footer>
    </div>
  )
}
