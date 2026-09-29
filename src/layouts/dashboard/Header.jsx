import { useContext, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Menu as MenuIcon, CornerDownLeft } from 'lucide-react'
import { clsx } from 'clsx'
import {
  HeaderSearchContext,
  IconButton,
  Menu,
  MenuItem,
  NotificationBell,
  Popover,
  SearchInput,
  useAdminNotifications,
} from '@components'
import { NAV_ITEMS } from './navigation'

/**
 * Header search box (Figma "Search bar", 354x40). When the current page called
 * useHeaderSearch() it filters that page's list; otherwise it is a quick "go to page" search
 * over the sidebar items.
 */
const HeaderSearchBox = ({ className }) => {
  const ctx = useContext(HeaderSearchContext)
  const navigate = useNavigate()
  const anchorRef = useRef(null)
  const [jump, setJump] = useState('')
  const [open, setOpen] = useState(false)
  const pageMode = !!ctx?.consumer

  const matches = useMemo(() => {
    const q = jump.trim().toLowerCase()
    return q ? NAV_ITEMS.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 8) : []
  }, [jump])

  const go = (item) => {
    navigate(item.path)
    setJump('')
    setOpen(false)
    anchorRef.current?.blur()
  }

  if (pageMode) {
    return (
      <SearchInput
        className={className}
        value={ctx.query}
        onChange={(e) => ctx.setQuery(e.target.value)}
        onClear={() => ctx.setQuery('')}
        placeholder={ctx.consumer.placeholder}
        aria-label={ctx.consumer.placeholder}
      />
    )
  }

  return (
    <div className={className} ref={anchorRef}>
      <SearchInput
        value={jump}
        onChange={(e) => {
          setJump(e.target.value)
          setOpen(true)
        }}
        onClear={() => setJump('')}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) go(matches[0])
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Search pages"
        aria-label="Search pages"
      />
      <Popover
        open={open && matches.length > 0}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        matchWidth
        placement="bottom-end"
      >
        <Menu>
          {matches.map((item, i) => (
            <MenuItem key={item.path} icon={item.icon} onSelect={() => go(item)} active={i === 0}>
              <span className="flex items-center justify-between gap-2">
                {item.name}
                {i === 0 && <CornerDownLeft className="h-3.5 w-3.5 text-ink-disabled" />}
              </span>
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </div>
  )
}

/**
 * Header — Figma tabbar-section (1297:29939): 56px white bar, padding 8/24; page title
 * DM Sans 700 20/24 #212121; search box and the notifications bell on the right.
 * Below lg a menu button opens the sidebar drawer; below md the search moves to its own row.
 */
export const Header = ({ title, onOpenMenu }) => {
  const feed = useAdminNotifications()
  const ctx = useContext(HeaderSearchContext)

  return (
    <header className="sticky top-0 z-20 shrink-0 bg-surface">
      <div className="flex h-14 items-center gap-2.5 px-4 sm:px-6">
        <IconButton icon={MenuIcon} label="Open menu" size="md" className="-ml-2 lg:hidden" onClick={onOpenMenu} />
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold leading-6 text-ink">{title}</h1>
        <HeaderSearchBox className="hidden w-[354px] max-w-[40vw] md:block" />
        <NotificationBell
          notifications={feed.notifications}
          unreadCount={feed.unreadCount}
          counts={feed.counts}
          loading={feed.loading}
          error={feed.error}
          onOpen={feed.refetch}
          onMarkAllRead={feed.markAllRead}
          onItemClick={feed.markRead}
          viewAllHref={feed.viewAllHref}
        />
      </div>
      <div className={clsx('px-4 pb-3 md:hidden', !ctx?.consumer && 'hidden')}>
        <HeaderSearchBox />
      </div>
    </header>
  )
}
