import { clsx } from 'clsx'
import { ChevronsUpDown, LogOut, Settings, UserRound } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { DropdownMenu } from '../ui/Menu'

/**
 * UserMenu — Figma sidebar footer "sb-user" (56px, top divider): 40px mint avatar with
 * initials, name (DM Sans 600 14) and role (Plus Jakarta Sans 400 10 #424242). Clicking opens
 * the account menu (Profile, Settings, Log out) — the design has no separate Logout row.
 * Props: user ({ firstName, lastName, email, avatar, role }), roleLabel, onProfile,
 * onSettings, onLogout.
 */
export const UserMenu = ({ user, roleLabel = 'Administrator', onProfile, onSettings, onLogout }) => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Admin'
  return (
    <DropdownMenu
      placement="top-start"
      width={220}
      header={
        <div className="border-b border-line px-4 py-3">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          {user?.email && <p className="truncate text-xs text-ink-muted">{user.email}</p>}
        </div>
      }
      items={[
        onProfile && { label: 'Profile', icon: UserRound, onSelect: onProfile },
        onSettings && { label: 'Settings', icon: Settings, onSelect: onSettings },
        { divider: true },
        { label: 'Log out', icon: LogOut, tone: 'danger', onSelect: onLogout },
      ]}
      trigger={({ open, ...props }) => (
        <button
          type="button"
          {...props}
          className={clsx(
            'group flex w-full items-center gap-3 px-6 py-0.5 text-left transition-colors outline-none',
            'hover:bg-canvas focus-visible:bg-canvas',
            open && 'bg-canvas'
          )}
        >
          <Avatar name={name} src={user?.avatar} tone="green" size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-[18px] text-ink">{name}</span>
            <span className="block truncate font-display text-[10px] leading-3 text-ink-secondary">{roleLabel}</span>
          </span>
          <ChevronsUpDown
            className={clsx(
              'h-4 w-4 shrink-0 text-ink-muted transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
              open ? 'opacity-100' : 'opacity-0'
            )}
          />
        </button>
      )}
    />
  )
}
