import { isValidElement } from 'react'
import { clsx } from 'clsx'
import { toneClasses } from './tokens'

const SIZES = {
  sm: { box: 'w-8 h-8 rounded-md', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10 rounded-lg', icon: 'w-5 h-5' },
  lg: { box: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6' },
}

/**
 * Tinted square icon tile (Figma "sc-icon": 40x40, radius 8, 20px glyph).
 * `icon` is a lucide component (Users) or an element (<Users />).
 * tone: green | blue | orange | purple | red | amber | pink | neutral
 *       (aliases: success, info, primary, danger, warning).
 */
export const IconTile = ({ icon: Icon, tone = 'green', size = 'md', className }) => {
  const t = toneClasses(tone)
  const s = SIZES[size] || SIZES.md
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center justify-center', s.box, t.tile, t.icon, className)}
      aria-hidden="true"
    >
      {isValidElement(Icon) ? Icon : Icon ? <Icon className={s.icon} strokeWidth={2} /> : null}
    </span>
  )
}
