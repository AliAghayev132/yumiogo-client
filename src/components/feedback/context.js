import { createContext, useContext } from 'react'

export const BannerContext = createContext(null)
export const ConfirmContext = createContext(null)

// Fallbacks so a page rendered outside <FeedbackProvider> (e.g. the public auth pages or a
// unit test) never crashes: banners become console messages, confirm() uses the browser dialog.
const warnNoProvider = (tone) => (message) => {
  console.warn(`[useBanner] no <FeedbackProvider>; ${tone}:`, message)
  return null
}
const fallbackBanner = {
  show: ({ tone = 'info', message } = {}) => warnNoProvider(tone)(message),
  success: warnNoProvider('success'),
  warning: warnNoProvider('warning'),
  error: warnNoProvider('error'),
  info: warnNoProvider('info'),
  dismiss: () => {},
  clear: () => {},
}
const fallbackConfirm = async ({ title, message, onConfirm } = {}) => {
  const text = [title, typeof message === 'string' ? message : ''].filter(Boolean).join('\n\n')
  if (!window.confirm(text || 'Are you sure?')) return false
  const result = onConfirm ? await onConfirm('') : undefined
  return { reason: '', result }
}

/**
 * useBanner() — page-level inline snackbars (Figma Snackbar).
 *
 *   const banner = useBanner()
 *   banner.success('Restaurant added successfully')
 *   banner.warning('Warning sent to Leyla Həsənova. Notification delivered.')
 *   banner.error(err?.data?.message || 'Delete failed')
 *   banner.show({ tone, message, title, duration, action })   // → id
 *   banner.dismiss(id); banner.clear()
 *
 * Messages render at the top of the page content, or inside the top-most open Modal while
 * one is open (so form errors appear next to the form). When that modal closes, its
 * success / warning / info messages move down to the page; its errors are dropped.
 * Default auto-hide: success/info 5s, warning 7s, error stays until dismissed
 * (override with `duration` in ms, 0 = sticky).
 */
export const useBanner = () => useContext(BannerContext)?.api || fallbackBanner

/**
 * useConfirm() — promise-based Figma confirm modal (modalBox).
 *
 *   const confirm = useConfirm()
 *   const ok = await confirm({
 *     tone: 'danger',                       // danger | success | warning | primary | info
 *     icon: Trash2,                         // optional, defaults per tone
 *     title: 'Delete Review #4821?',
 *     message: 'This review will be permanently deleted. The user will be notified with the reason.',
 *     notice: 'Restaurant rating will be recalculated after deletion.',   // amber inline notice
 *     confirmText: 'Delete review',
 *     reasonField: { label: 'Reason for deletion', placeholder: 'e.g. Violates community guidelines...', required: false },
 *     onConfirm: async (reason) => deleteReview({ id, reason }).unwrap(),  // optional: runs with a spinner,
 *   })                                                                     // errors show inside the dialog
 *   if (!ok) return            // cancelled → false
 *   ok.reason                  // trimmed reason text ('' when no field)
 *   ok.result                  // what onConfirm resolved with
 */
export const useConfirm = () => useContext(ConfirmContext) || fallbackConfirm
