import { Link, NavLink } from 'react-router'
import { clsx } from 'clsx'
import { CountBadge, Logo, UserMenu } from '@components'
import { NAV_SECTIONS } from './navigation'

/*
 * Figma sidebar (1264:23061): 236px, white. Header 56px (padding 12/24) with the yumio logo.
 * Nav: padding 24/4, sections 10px apart; section label DM Sans 400 14/18 #616161 (4px inset);
 * items 48px (2/4 outer padding, 44px state layer, radius 4, padding 12, 8px gap, 20px icon,
 * DM Sans 500 14). Active: #FAFAFA state layer, icon + label #22C55E. Trailing counters are
 * green pills. Footer: "sb-user" row with a top divider.
 */
const SidebarLink = ({ item, count, onNavigate }) => (
  <NavLink
    to={item.path}
    end={item.end}
    onClick={onNavigate}
    className="block px-1 py-0.5 outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-brand/30"
  >
    {({ isActive }) => (
      <span
        className={clsx(
          'flex h-11 items-center gap-2 rounded-sm px-3 text-sm font-medium leading-[18px] transition-colors',
          isActive ? 'bg-canvas text-brand' : 'text-ink hover:bg-canvas'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        <CountBadge count={count} />
      </span>
    )}
  </NavLink>
)

export const Sidebar = ({ badges = {}, user, onLogout, onNavigate, onProfile, onSettings, className }) => (
  <aside className={clsx('flex h-full w-sidebar shrink-0 flex-col bg-surface', className)}>
    <div className="flex h-14 shrink-0 items-center px-6">
      <Link to="/dashboard" onClick={onNavigate} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
        <Logo />
      </Link>
    </div>

    <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 py-6 scrollbar-thin">
      <div className="flex flex-col gap-2.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-2">
            <p className="px-1 text-sm leading-[18px] text-ink-tertiary">{section.label}</p>
            <div>
              {section.items.map((item) => (
                <SidebarLink
                  key={item.path}
                  item={item}
                  count={item.badge ? badges[item.badge] : 0}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>

    <div className="shrink-0 border-t border-line py-1.5">
      <UserMenu user={user} onLogout={onLogout} onProfile={onProfile} onSettings={onSettings} />
    </div>
  </aside>
)
