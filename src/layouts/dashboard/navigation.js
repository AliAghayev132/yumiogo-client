import {
  LayoutDashboard,
  BarChart3,
  Users,
  Store,
  MessageSquareMore,
  CircleAlert,
  Settings,
  UtensilsCrossed,
  Sparkles,
  Tag,
  Leaf,
  Smile,
  MessageSquareWarning,
  MapPin,
  SlidersHorizontal,
  CircleHelp,
  ScrollText,
  GalleryHorizontalEnd,
  Coffee,
  Tags,
  Megaphone,
  Bookmark,
} from 'lucide-react'
import { TAXONOMY_TYPES } from '@components'

const taxonomyIcons = {
  cuisine: UtensilsCrossed,
  feature: Sparkles,
  tag: Tag,
  dietary: Leaf,
  mood: Smile,
  reportReason: MessageSquareWarning,
  dining: Coffee,
  reviewLabel: Tags,
}

/*
 * Sidebar sections. Figma (1264:23061): Overview (Dashboard, Analytics), Management (Users,
 * Restaurants, Reviews + count, Reports + count — plus Lists moderation), System (Settings). Catalog and Content are
 * the admin-managed content sections added after the design; they use the same section style
 * and sit between Management and System.
 * `badge` names a key of navBadges() below.
 */
export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
      { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Users', path: '/dashboard/users', icon: Users },
      { name: 'Restaurants', path: '/dashboard/restaurants', icon: Store },
      { name: 'Reviews', path: '/dashboard/reviews', icon: MessageSquareMore, badge: 'reviews' },
      { name: 'Reports', path: '/dashboard/reports', icon: CircleAlert, badge: 'reports' },
      { name: 'Lists', path: '/dashboard/lists', icon: Bookmark },
    ],
  },
  {
    label: 'Catalog',
    items: [
      ...Object.entries(TAXONOMY_TYPES).map(([type, { label }]) => ({
        name: label,
        path: `/dashboard/catalog/${type}`,
        icon: taxonomyIcons[type] || Tag,
      })),
      { name: 'Cities', path: '/dashboard/cities', icon: MapPin },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'App config & Home', path: '/dashboard/content/app-config', icon: SlidersHorizontal, title: 'App config & Home' },
      { name: 'FAQ', path: '/dashboard/content/faqs', icon: CircleHelp, title: 'FAQ' },
      { name: 'Legal pages', path: '/dashboard/content/pages', icon: ScrollText },
      { name: 'Onboarding', path: '/dashboard/content/onboarding', icon: GalleryHorizontalEnd },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      { name: 'Broadcast', path: '/dashboard/broadcast', icon: Megaphone },
    ],
  },
]

export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items)

// Header titles for routes that are not in the sidebar.
const EXTRA_TITLES = [{ path: '/dashboard/profile', title: 'Profile' }]

/** Sidebar item for a pathname (longest matching path wins). */
export const findNavItem = (pathname) =>
  NAV_ITEMS.filter((item) =>
    item.end ? pathname === item.path || pathname === `${item.path}/` : pathname === item.path || pathname.startsWith(`${item.path}/`)
  ).sort((a, b) => b.path.length - a.path.length)[0]

/** Header title for a pathname. */
export const pageTitleFor = (pathname) =>
  findNavItem(pathname)?.title ||
  findNavItem(pathname)?.name ||
  EXTRA_TITLES.find((t) => pathname.startsWith(t.path))?.title ||
  'Dashboard'

/**
 * Sidebar counters (Figma: Reviews + Reports) from GET /admin/stats → data.
 * Prefers `data.badges` ({ reviews, reports, restaurants, users }); falls back to
 * `stats.pendingReviews` / `stats.openReports`.
 */
export const navBadges = (data = {}) => {
  const { badges = {}, stats = {} } = data || {}
  return {
    reports: badges.reports ?? stats.openReports ?? 0,
    reviews: badges.reviews ?? stats.pendingReviews ?? 0,
  }
}
