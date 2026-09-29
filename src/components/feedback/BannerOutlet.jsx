import { useContext, useEffect, useId } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { clsx } from 'clsx'
import { Banner } from '../ui/Banner'
import { BannerContext } from './context'

/**
 * Where useBanner() messages appear. The dashboard layout renders the page outlet
 * (`<BannerOutlet page />`) at the top of the content panel; every Modal body renders
 * one automatically. The most recently mounted outlet receives new messages.
 * The outlet is sticky (`stickyClassName`, default top-0) so a message stays visible while
 * the page or modal body is scrolled. Renders nothing outside a <FeedbackProvider>.
 */
export const BannerOutlet = ({ page = false, className, stickyClassName = 'top-0' }) => {
  const ctx = useContext(BannerContext)
  const localId = useId()
  const hostId = page ? 'page' : localId
  const register = ctx?.registerHost
  const unregister = ctx?.unregisterHost
  // A modal that is animating out stops receiving messages straight away.
  const present = useIsPresent()

  useEffect(() => {
    if (!register || !present) return undefined
    register(hostId)
    return () => unregister(hostId)
  }, [hostId, present, register, unregister])

  if (!ctx) return null
  const mine = ctx.messages.filter((m) => m.hostId === hostId)

  return (
    <div className={clsx('pointer-events-none sticky z-10', stickyClassName)}>
      <AnimatePresence initial={false}>
        {mine.length > 0 && (
          <motion.div
            key="banner-stack"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className={clsx('flex flex-col gap-2', className)}>
              {mine.map((m) => (
                // Opaque backing: the tinted banner stays readable over scrolled content.
                <div key={m.id} className="pointer-events-auto rounded-sm bg-canvas">
                  <Banner
                    tone={m.tone}
                    title={m.title}
                    action={m.action}
                    onClose={m.dismissible === false ? undefined : () => ctx.api.dismiss(m.id)}
                  >
                    {m.message}
                  </Banner>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
