import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { BannerContext, ConfirmContext } from './context'

const DEFAULT_DURATION = { success: 5000, info: 5000, warning: 7000, error: 0 }
const MAX_PER_HOST = 3
let nextId = 0

/**
 * FeedbackProvider — owns the useBanner() messages and the useConfirm() dialog.
 * Mounted once by DashboardLayout (wrap other shells the same way if they need it).
 */
export const FeedbackProvider = ({ children }) => {
  // ---------- Banners ----------
  const [messages, setMessages] = useState([])
  const hosts = useRef([]) // mounted <BannerOutlet> ids, oldest → newest ('page' first)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setMessages((list) => list.filter((m) => m.id !== id))
  }, [])

  const clear = useCallback((filter) => {
    setMessages((list) => {
      const keep = typeof filter === 'function' ? list.filter((m) => !filter(m)) : []
      list.forEach((m) => {
        if (!keep.includes(m)) {
          clearTimeout(timers.current.get(m.id))
          timers.current.delete(m.id)
        }
      })
      return keep
    })
  }, [])

  const show = useCallback(
    ({ tone = 'info', message, title, duration, action, dismissible = true, host } = {}) => {
      if (!message && !title) return null
      const id = ++nextId
      const hostId = host || hosts.current[hosts.current.length - 1] || 'page'
      const ms = duration ?? DEFAULT_DURATION[tone] ?? 5000
      setMessages((list) => {
        const sameHost = list.filter((m) => m.hostId === hostId)
        const overflow = sameHost.length >= MAX_PER_HOST ? sameHost[sameHost.length - 1].id : null
        return [{ id, tone, message, title, action, dismissible, hostId, at: Date.now() }, ...list].filter(
          (m) => m.id !== overflow
        )
      })
      if (ms > 0) timers.current.set(id, setTimeout(() => dismiss(id), ms))
      return id
    },
    [dismiss]
  )

  const registerHost = useCallback((hostId) => {
    hosts.current = [...hosts.current.filter((h) => h !== hostId), hostId]
  }, [])

  // A closing modal hands its non-error messages down to the next outlet (usually the page),
  // so "Saved" shown just before a form modal closes is still seen.
  const unregisterHost = useCallback(
    (hostId) => {
      hosts.current = hosts.current.filter((h) => h !== hostId)
      const next = hosts.current[hosts.current.length - 1] || 'page'
      setMessages((list) => {
        const dropped = list.filter((m) => m.hostId === hostId && m.tone === 'error')
        dropped.forEach((m) => {
          clearTimeout(timers.current.get(m.id))
          timers.current.delete(m.id)
        })
        return list
          .filter((m) => !dropped.includes(m))
          .map((m) => (m.hostId === hostId ? { ...m, hostId: next } : m))
      })
    },
    []
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  const api = useMemo(
    () => ({
      show,
      success: (message, opts) => show({ ...opts, tone: 'success', message }),
      warning: (message, opts) => show({ ...opts, tone: 'warning', message }),
      error: (message, opts) => show({ ...opts, tone: 'error', message }),
      info: (message, opts) => show({ ...opts, tone: 'info', message }),
      dismiss,
      clear,
    }),
    [show, dismiss, clear]
  )

  const bannerValue = useMemo(
    () => ({ api, messages, registerHost, unregisterHost }),
    [api, messages, registerHost, unregisterHost]
  )

  // ---------- Confirm ----------
  const [request, setRequest] = useState(null) // { options, resolve }
  const [open, setOpen] = useState(false)

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setRequest((prev) => {
        prev?.resolve(false) // a newer confirm replaces an unanswered one
        return { options, resolve }
      })
      setOpen(true)
    })
  }, [])

  const cancel = () => {
    request?.resolve(false)
    setOpen(false)
  }

  const accept = async (reason) => {
    const run = request?.options?.onConfirm
    const result = run ? await run(reason) : undefined // a throw keeps the dialog open with the error
    request?.resolve({ reason, result })
    setOpen(false)
  }

  // onConfirm is run by accept(); everything else is passed to the dialog.
  const { onConfirm: _ignored, ...dialogProps } = request?.options || {}

  return (
    <BannerContext.Provider value={bannerValue}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <ConfirmDialog {...dialogProps} isOpen={open && !!request} onClose={cancel} onConfirm={accept} />
      </ConfirmContext.Provider>
    </BannerContext.Provider>
  )
}
