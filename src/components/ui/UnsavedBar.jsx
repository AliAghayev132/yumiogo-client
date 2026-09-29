import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { Button } from './Button'

/**
 * Floating "unsaved changes" bar pinned to the bottom-right of the window while
 * a long form is dirty, so Save (orange primary) stays reachable without scrolling.
 */
export const UnsavedBar = ({
  visible,
  saving = false,
  onSave,
  onDiscard,
  saveLabel = 'Save changes',
  message = 'You have unsaved changes',
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="fixed bottom-6 right-6 z-30 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-menu backdrop-blur"
        role="status"
      >
        <p className="text-sm font-semibold text-ink">{message}</p>
        <div className="flex items-center gap-2">
          {onDiscard && (
            <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving} leftIcon={RotateCcw}>
              Discard
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onSave} loading={saving}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)
