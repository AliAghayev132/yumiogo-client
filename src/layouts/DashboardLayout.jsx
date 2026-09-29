// React
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// React Router
import { Outlet, useLocation, useNavigate } from 'react-router'

// Redux
import { useSelector, useDispatch } from 'react-redux'

// Motion
import { motion, AnimatePresence } from 'framer-motion'

// Components
import { SEO, BannerOutlet, FeedbackProvider, HeaderSearchContext, useBanner } from '@components'

// Slices + API + session hooks
import { logout } from '@store/slices/authSlice'
import { useLogoutMutation, useGetStatsQuery } from '@store/api'
import { useAdminLiveUpdates, useSessionCheck } from '@store/hooks'

// Shell
import { Sidebar } from './dashboard/Sidebar'
import { Header } from './dashboard/Header'
import { navBadges, pageTitleFor } from './dashboard/navigation'

// Page banners older than this are cleared when the route changes (a banner raised right
// before a navigate() survives the switch).
const BANNER_ROUTE_GRACE_MS = 800

const ClearBannersOnRouteChange = ({ pathname }) => {
  const banner = useBanner()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const cutoff = Date.now() - BANNER_ROUTE_GRACE_MS
    banner.clear((m) => m.hostId === 'page' && m.at < cutoff)
  }, [pathname, banner])
  return null
}

/**
 * Admin shell — Figma frame layout: white 236px sidebar + white 56px header, and the page in a
 * #FAFAFA panel with a 36px top-left radius and 24px padding (its own scroll area).
 * Provides useBanner() / useConfirm() (FeedbackProvider) and useHeaderSearch().
 * Below lg the sidebar becomes a slide-in drawer.
 */
export const DashboardLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, refreshToken } = useSelector((state) => state.auth)
  const [logoutApi] = useLogoutMutation()
  // Sidebar counters: polled, refreshed on window focus and pushed over the socket.
  const { data: statsData } = useGetStatsQuery(undefined, { pollingInterval: 60_000, refetchOnFocus: true })
  const badges = navBadges(statsData?.data)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // ---- Header search (useHeaderSearch) ----
  const [query, setQuery] = useState('')
  const [consumer, setConsumer] = useState(null)
  const register = useCallback((config) => {
    const token = {}
    setConsumer({ token, ...config })
    return () => {
      setConsumer((c) => (c?.token === token ? null : c))
      setQuery('')
    }
  }, [])
  const searchValue = useMemo(() => ({ query, setQuery, consumer, register }), [query, consumer, register])

  // Ends this browser's session only (the admin stays signed in on other devices).
  const handleLogout = async () => {
    try {
      await logoutApi({ refreshToken }).unwrap()
    } catch {
      // Ignore — clear the local session regardless.
    }
    dispatch(logout())
    navigate('/login')
  }

  // The session lost admin rights (demoted, suspended, banned): drop it and explain on /login.
  const endSession = useCallback(() => {
    logoutApi({ refreshToken })
    dispatch(logout())
    navigate('/login', { replace: true, state: { notice: 'not-admin' } })
  }, [logoutApi, refreshToken, dispatch, navigate])
  useSessionCheck({ onDenied: endSession })
  useAdminLiveUpdates({ onSignedOut: endSession })

  const { pathname } = location
  const closeDrawer = () => setDrawerOpen(false)

  // Esc closes the mobile drawer.
  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])
  const sidebarProps = {
    badges,
    user,
    onLogout: handleLogout,
    onProfile: () => navigate('/dashboard/profile'),
    onSettings: () => navigate('/dashboard/settings'),
  }

  return (
    <FeedbackProvider>
      <HeaderSearchContext.Provider value={searchValue}>
        <ClearBannersOnRouteChange pathname={pathname} />
        {/* Tab title per page ("Users | Yumio"); pages with their own <SEO> override it. */}
        <SEO title={pageTitleFor(pathname)} noindex />
        <div className="flex h-screen overflow-hidden bg-surface font-sans text-ink">
          {/* Sidebar (desktop) */}
          <div className="hidden h-full lg:block">
            <Sidebar {...sidebarProps} />
          </div>

          {/* Sidebar (drawer below lg) */}
          <AnimatePresence>
            {drawerOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <motion.div
                  className="absolute inset-0 bg-ink/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeDrawer}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 shadow-modal"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Sidebar {...sidebarProps} onNavigate={closeDrawer} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Header + content panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            <Header title={pageTitleFor(pathname)} onOpenMenu={() => setDrawerOpen(true)} />
            <main className="min-h-0 flex-1 overflow-y-auto rounded-tl-panel bg-canvas p-4 sm:p-6 scrollbar-thin">
              <BannerOutlet page className="pb-6" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </HeaderSearchContext.Provider>
    </FeedbackProvider>
  )
}
