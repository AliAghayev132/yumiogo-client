import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'

const GAP = 6
const MARGIN = 8

// Fixed-position coordinates next to the anchor; flips above when there is no room below and
// re-measures on scroll/resize (also inside scrolling modals and tables).
const measure = (anchor, panel, placement, matchWidth) => {
  const a = anchor.getBoundingClientRect()
  const pw = matchWidth ? a.width : panel?.offsetWidth || 0
  const ph = panel?.offsetHeight || 0
  const vw = window.innerWidth
  const vh = window.innerHeight
  const alignEnd = placement.endsWith('end')
  let left = alignEnd ? a.right - pw : a.left
  left = Math.max(MARGIN, Math.min(left, vw - pw - MARGIN))
  const below = a.bottom + GAP
  const fitsBelow = below + ph <= vh - MARGIN
  const fitsAbove = a.top - GAP - ph >= MARGIN
  const top = placement.startsWith('top') ? (fitsAbove ? a.top - GAP - ph : below) : fitsBelow || !fitsAbove ? below : a.top - GAP - ph
  return { top, left, width: matchWidth ? a.width : undefined, maxHeight: Math.max(160, vh - MARGIN * 2) }
}

/**
 * Popover — floating panel anchored to an element, rendered in a portal (never clipped by
 * table/modal overflow). Closes on outside click and Esc (without closing an open Modal).
 * Props: open, onClose, anchorRef (ref object) or anchorEl (element, e.g. from a callback ref),
 * placement (bottom-start | bottom-end | top-start | top-end),
 * matchWidth (same width as the anchor), className, children, role, id.
 * The panel is unstyled apart from the Figma menu surface (white, radius 12, menu shadow);
 * pass `className` for padding/width.
 */
export const Popover = ({
  open,
  onClose,
  anchorRef,
  anchorEl,
  placement = 'bottom-start',
  matchWidth = false,
  className,
  children,
  role,
  id,
  style,
}) => {
  const panelRef = useRef(null)
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    const anchor = () => anchorEl || anchorRef?.current
    if (!open || !anchor()) return undefined
    const update = () => {
      if (anchor()) setPos(measure(anchor(), panelRef.current, placement, matchWidth))
    }
    // Measure on the next frame, once the (off-screen) panel has its real size.
    const raf = requestAnimationFrame(update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef, anchorEl, placement, matchWidth])

  useEffect(() => {
    if (!open) return undefined
    const anchor = () => anchorEl || anchorRef?.current
    const onPointer = (e) => {
      if (panelRef.current?.contains(e.target) || anchor()?.contains(e.target)) return
      onClose?.()
    }
    // Capture phase + stopPropagation: Esc closes the popover, not the Modal underneath.
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        anchor()?.focus?.()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose, anchorRef, anchorEl])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id={id}
          role={role}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'fixed',
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            width: pos?.width,
            maxHeight: pos?.maxHeight,
            zIndex: 200,
            ...style,
          }}
          className={clsx('overflow-hidden rounded-xl bg-surface text-ink shadow-menu', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
