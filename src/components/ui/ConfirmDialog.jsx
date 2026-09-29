import { useState } from 'react'
import { AlertTriangle, Check, Info, Plus, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Banner } from './Banner'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { errorMessage } from '../feedback/errorMessage'

// tone → icon tile colour, default glyph and confirm-button variant (from the Figma modalBoxes:
// red delete/ban/reject/dismiss, green approve/restore/resolve, amber warn/maintenance with
// an orange action, orange add).
const TONE_MAP = {
  danger: { tile: 'red', icon: Trash2, button: 'danger' },
  success: { tile: 'green', icon: Check, button: 'success' },
  warning: { tile: 'amber', icon: AlertTriangle, button: 'primary' },
  primary: { tile: 'orange', icon: Plus, button: 'primary' },
  info: { tile: 'blue', icon: Info, button: 'primary' },
}

const ConfirmContent = ({
  onClose,
  onConfirm,
  notice,
  noticeTone = 'warning',
  reasonField,
  confirmText,
  cancelText,
  confirmVariant,
  buttonVariant,
  hideCancel,
  loading,
  error,
  children,
}) => {
  const [reason, setReason] = useState(reasonField?.defaultValue || '')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')

  const required = !!reasonField?.required
  const missing = required && !reason.trim()
  const working = busy || loading

  const submit = async (e) => {
    e?.preventDefault()
    if (working) return
    if (missing) {
      setTouched(true)
      return
    }
    setFailure('')
    const out = onConfirm?.(reason.trim())
    if (out && typeof out.then === 'function') {
      setBusy(true)
      try {
        await out
      } catch (err) {
        setFailure(errorMessage(err))
      } finally {
        setBusy(false)
      }
    }
  }

  const Field = reasonField?.multiline ? Textarea : Input
  const shownError = failure || error

  return (
    <form onSubmit={submit} noValidate>
      {(notice || reasonField || children || shownError) && (
        <div className="flex flex-col gap-3">
          {shownError && <Banner tone="error">{shownError}</Banner>}
          {notice && <Banner tone={noticeTone}>{notice}</Banner>}
          {children}
          {reasonField && (
            <Field
              label={reasonField.label}
              placeholder={reasonField.placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={reasonField.maxLength}
              rows={reasonField.rows || 3}
              error={touched && missing ? reasonField.requiredMessage || 'This field is required' : undefined}
              helperText={reasonField.helperText}
              disabled={working}
              data-autofocus
            />
          )}
        </div>
      )}
      <Modal.Footer>
        {!hideCancel && (
          <Button variant="outline" onClick={onClose} disabled={working}>
            {cancelText}
          </Button>
        )}
        <Button type="submit" variant={confirmVariant || buttonVariant} loading={working} disabled={missing && touched}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </form>
  )
}

/**
 * ConfirmDialog — Figma modalBox confirmation (declarative form).
 * Prefer the promise API: `const confirm = useConfirm(); if (!(await confirm({...}))) return`.
 *
 * Props: isOpen, onClose (Cancel / Esc / overlay), onConfirm(reason) — may return a promise:
 * the confirm button spins until it settles and a rejection is shown inside the dialog.
 * tone: danger | success | warning | primary | info; icon (override); title; message;
 * notice (amber inline notice text); noticeTone; confirmText; cancelText; confirmVariant;
 * reasonField ({ label, placeholder, required, multiline, rows, maxLength, defaultValue,
 * helperText, requiredMessage }); loading; error; hideCancel; children (extra body content).
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  tone = 'danger',
  icon,
  title,
  message,
  size = 'md',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  ...rest
}) => {
  const t = TONE_MAP[tone] || TONE_MAP.danger
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={icon === undefined ? t.icon : icon}
      tone={t.tile}
      title={title}
      description={message}
      size={size}
      role="alertdialog"
    >
      <ConfirmContent
        onClose={onClose}
        confirmText={confirmText}
        cancelText={cancelText}
        buttonVariant={t.button}
        {...rest}
      />
    </Modal>
  )
}
