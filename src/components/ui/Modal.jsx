import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { IconTile } from './IconTile'
import { BannerOutlet } from '../feedback/BannerOutlet'

/*
 * Figma modalBox (component 1109:23261): 448px wide, radius 28, #FAFAFA surface, no header
 * bar / divider / close X. Headline = 40x40 tinted icon tile + title (Plus Jakarta Sans 500
 * 24/32 #212121); supporting text DM Sans 400 14/18 #424242; content padding 24, fields gap
 * 12; actions right-aligned (padding 20/24/20/16, gap 8): outlined Cancel + coloured primary.
 */
const SIZES = {
  sm: 'max-w-[400px]',
  md: 'max-w-[448px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[896px]',
  full: 'max-w-[calc(100vw-2rem)]',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Open-modal stack: Esc and focus-trapping only act on the top-most dialog, and the
// body stays scroll-locked while any dialog is open.
const openStack = []
const lockScroll = () => {
  if (openStack.length === 1) document.body.style.overflow = 'hidden'
}
const unlockScroll = () => {
  if (openStack.length === 0) document.body.style.overflow = ''
}

// Tells <Modal.Footer> whether it was hoisted out of the scrolling body or sits inside it
// (e.g. inside a <form> that wraps the whole modal content).
const ModalSectionContext = createContext('body')

const ModalFooter = ({ children, className }) => {
  const section = useContext(ModalSectionContext)
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center justify-end gap-2',
        // Hoisted: fixed under the scrolling body. Nested (e.g. inside a <form> so a submit button
        // keeps working): full-bleed at the end of the body content.
        section === 'footer' ? 'pt-5 pb-5 pl-4 pr-6' : '-mx-6 -mb-6 px-6 py-5',
        className
      )}
    >
      {children}
    </div>
  )
}

const ModalDialog = ({
  onClose,
  title,
  description,
  icon,
  tone = 'green',
  iconTone,
  size = 'md',
  children,
  footer,
  showCloseButton = false,
  closeOnOverlay = true,
  closeOnEsc = true,
  initialFocusRef,
  className,
  bodyClassName,
  role = 'dialog',
}) => {
  const id = useId()
  const dialogRef = useRef(null)
  const [layer] = useState(() => openStack.length)
  const titleId = `${id}-title`
  const descId = `${id}-desc`

  // Register in the stack, lock scroll, move focus in; restore everything on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement
    openStack.push(id)
    lockScroll()
    const node = dialogRef.current
    const target =
      initialFocusRef?.current ||
      node?.querySelector('[data-autofocus]') ||
      node?.querySelector('input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])') ||
      node
    target?.focus?.({ preventScroll: true })
    return () => {
      const i = openStack.indexOf(id)
      if (i !== -1) openStack.splice(i, 1)
      unlockScroll()
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus?.({ preventScroll: true })
    }
  }, [id, initialFocusRef])

  // Esc closes the top-most dialog only.
  useEffect(() => {
    if (!closeOnEsc) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) {
        e.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeOnEsc, id, onClose])

  // Keep Tab inside the dialog.
  const trapFocus = (e) => {
    if (e.key !== 'Tab') return
    const nodes = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])].filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    )
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Hoist direct <Modal.Footer> children out of the scrolling body (legacy API).
  const all = Children.toArray(children)
  const hoisted = all.filter((c) => isValidElement(c) && c.type === ModalFooter)
  const body = all.filter((c) => !(isValidElement(c) && c.type === ModalFooter))
  const footerContent = footer ? <ModalFooter>{footer}</ModalFooter> : hoisted.length ? hoisted : null
  const hasBody = body.length > 0

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 50 + layer * 2 }}>
      <motion.div
        className="fixed inset-0 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="pointer-events-none relative flex min-h-full items-center justify-center p-4">
        <motion.div
          ref={dialogRef}
          role={role}
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          onKeyDown={trapFocus}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={clsx(
            'pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden',
            'rounded-modal bg-canvas text-ink shadow-modal outline-none',
            SIZES[size] || SIZES.md,
            className
          )}
        >
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {(title || description) && (
            <div className={clsx('flex shrink-0 flex-col gap-4 p-6', showCloseButton && 'pr-14')}>
              {title && (
                <div className="flex items-center gap-2">
                  {icon && <IconTile icon={icon} tone={iconTone || tone} />}
                  <h2 id={titleId} className="min-w-0 font-display text-2xl font-medium leading-8 text-ink">
                    {title}
                  </h2>
                </div>
              )}
              {description && (
                <div id={descId} className="text-sm leading-[18px] text-ink-secondary">
                  {description}
                </div>
              )}
            </div>
          )}

          {hasBody && (
            <div
              className={clsx(
                'min-h-0 flex-1 overflow-y-auto px-6 scrollbar-thin',
                !(title || description) && 'pt-6',
                footerContent ? 'pb-1' : 'pb-6',
                bodyClassName
              )}
            >
              <BannerOutlet className="mb-3" />
              <ModalSectionContext.Provider value="body">{body}</ModalSectionContext.Provider>
            </div>
          )}

          {footerContent && (
            <div className="shrink-0">
              <ModalSectionContext.Provider value="footer">{footerContent}</ModalSectionContext.Provider>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Modal — Figma modalBox.
 *
 *   <Modal isOpen onClose={close} icon={Plus} tone="orange" title="Add new restaurant"
 *          description="Fill in the basic details…"
 *          footer={<><Button variant="outline" onClick={close}>Cancel</Button>
 *                    <Button onClick={save}>Add & publish</Button></>}>
 *     …fields…
 *   </Modal>
 *
 * Legacy API still works: children may end with <Modal.Footer>…</Modal.Footer>.
 * size: sm 400 | md 448 (Figma, default) | lg 640 | xl 896 | full.
 * tone (icon tile): green | blue | orange | purple | red | amber | pink | neutral.
 * Closes on Esc and overlay click (closeOnEsc / closeOnOverlay); no X unless showCloseButton.
 * While open, useBanner() messages render inside the modal body.
 */
export const Modal = ({ isOpen, ...props }) =>
  createPortal(<AnimatePresence>{isOpen && <ModalDialog {...props} />}</AnimatePresence>, document.body)

Modal.Footer = ModalFooter
