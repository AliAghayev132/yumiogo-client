import { useState } from 'react'
import { clsx } from 'clsx'
import { getImageUrl } from '@utils'
import { AVATAR_TINTS } from './tokens'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs', // Figma table avatar: 32px, initials Plus Jakarta Sans 600 12
  md: 'h-10 w-10 text-xs', // Figma sidebar user: 40px
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
}
const TINT_NAMES = { orange: 0, purple: 1, green: 2, blue: 3 }

const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** "Leyla Həsənova" → "LH"; firstName/lastName win over name. */
const initialsOf = ({ name, firstName, lastName }) => {
  const parts = firstName || lastName ? [firstName, lastName] : String(name || '').trim().split(/\s+/)
  const letters = parts.filter(Boolean).map((p) => p[0])
  return (letters.length > 1 ? letters[0] + letters[letters.length - 1] : letters[0] || '?').toUpperCase()
}

/**
 * Avatar — Figma round avatar: photo when `src` loads, otherwise tinted initials
 * (orange / purple / green / blue, picked deterministically from `seed` → id → name).
 * Props: src (absolute or server-relative path), name | firstName + lastName, seed,
 * tone (orange | purple | green | blue — fixes the tint), size (xs 24 | sm 32 | md 40 | lg 48 | xl 64).
 */
export const Avatar = ({ src, name, firstName, lastName, seed, tone, size = 'sm', className }) => {
  const [failed, setFailed] = useState(false)
  const url = src ? getImageUrl(src) : ''
  const fullName = name || [firstName, lastName].filter(Boolean).join(' ')
  const tint =
    AVATAR_TINTS[tone in TINT_NAMES ? TINT_NAMES[tone] : hash(seed || fullName || '?') % AVATAR_TINTS.length]

  return (
    <span
      className={clsx(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border font-display font-semibold',
        SIZES[size] || SIZES.sm,
        className
      )}
      style={{ backgroundColor: tint.bg, borderColor: tint.border, color: tint.text }}
      title={fullName || undefined}
    >
      {url && !failed ? (
        <img src={url} alt={fullName || ''} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initialsOf({ name, firstName, lastName })
      )}
    </span>
  )
}

/**
 * UserCell — avatar + name (+ optional subtitle), the Figma "User" table cell
 * (32px avatar, 12px gap, DM Sans 600 14 #212121 name).
 * `short` renders "Leyla H." (Reviews / Reports tables).
 */
export const UserCell = ({ user, name, subtitle, src, short = false, size = 'sm', className, avatarProps }) => {
  const firstName = user?.firstName
  const lastName = user?.lastName
  const full = name || [firstName, lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'Unknown'
  const display = short && firstName ? `${firstName}${lastName ? ` ${lastName[0]}.` : ''}` : full
  return (
    <div className={clsx('flex min-w-0 items-center gap-3', className)}>
      <Avatar
        src={src ?? user?.avatar}
        name={full}
        seed={user?._id || user?.id || full}
        size={size}
        {...avatarProps}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-[18px] text-ink">{display}</p>
        {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
      </div>
    </div>
  )
}
