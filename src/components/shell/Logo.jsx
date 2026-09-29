import { clsx } from 'clsx'

/**
 * Yumio wordmark (Figma sidebar Logo_SVG: 96px wide, green "yumio" with the fork-pin "o").
 * Served from /yumio-logo.svg; /favicon.svg is the pin mark alone.
 */
export const Logo = ({ className, width = 96 }) => (
  <img
    src="/yumio-logo.svg"
    alt="yumio"
    width={width}
    height={Math.round((width * 126) / 360)}
    className={clsx('block select-none', className)}
    draggable={false}
  />
)
