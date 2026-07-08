// React
import { useState } from 'react'

// React Router
import { Link, Outlet, NavLink, useLocation, useNavigate } from 'react-router'

// Redux
import { useSelector, useDispatch } from 'react-redux'

// Motion
import { motion, AnimatePresence } from 'framer-motion'

// Icons
import {
  LayoutDashboard,
  BarChart3,
  Users as UsersIcon,
  Store,
  Star,
  Flag,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Slices + API
import { logout } from '@store/slices/authSlice'
import { useLogoutMutation, useGetStatsQuery } from '@store/api'

// Yumio admin nav.
const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
  { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Users', path: '/dashboard/users', icon: UsersIcon },
  { name: 'Restaurants', path: '/dashboard/restaurants', icon: Store },
  { name: 'Reviews', path: '/dashboard/reviews', icon: Star },
  { name: 'Reports', path: '/dashboard/reports', icon: Flag, badgeKey: 'openReports' },
  { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
]

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [logoutApi] = useLogoutMutation()
  const { data: statsData } = useGetStatsQuery()
  const badges = { openReports: statsData?.data?.stats?.openReports || 0 }

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } catch {
      // Ignore — clear the local session regardless.
    }
    dispatch(logout())
    navigate('/')
  }

  const activeItem = navItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside
        className="bg-white border-r border-gray-100 flex flex-col relative shadow-sm"
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm z-10"
        >
          {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center font-extrabold shrink-0">
              Y
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-base font-bold text-gray-900 whitespace-nowrap"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  Yumio<span className="text-green-500"> Admin</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : 0
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      className="text-sm font-medium whitespace-nowrap flex-1"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarOpen && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-sm font-medium whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-800">{activeItem?.name || 'Dashboard'}</h2>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500 text-white text-sm font-semibold flex items-center justify-center">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
