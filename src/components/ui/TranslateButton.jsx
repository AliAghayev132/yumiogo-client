import { useRef, useState } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from './Button'
import { Popover } from './Popover'
import { Tabs } from './Tabs'
import { Checkbox } from './Checkbox'
import { CONTENT_LANGUAGES, languageMeta } from './translations'
import { useAutoTranslate, translateError } from './useAutoTranslate'
import { useBanner } from '../feedback/context'

const OTHERS = (from) => CONTENT_LANGUAGES.map((l) => l.code).filter((code) => code !== from)

// "Azerbaijani: 3 fields · Russian: 3 fields" for the success message.
const describeFilled = (filled) =>
  Object.entries(filled)
    .filter(([, count]) => count > 0)
    .map(([lang, count]) => `${languageMeta(lang).label}: ${count} ${count === 1 ? 'field' : 'fields'}`)
    .join(' · ')

/**
 * TranslateButton — "✨ Translate" for the header of a form / card that uses the language
 * switch. Opens a small panel: From (EN / AZ / RU, default EN), To (the other languages, all on),
 * "Overwrite filled fields" (off: only empty fields are filled) and Translate. The answer goes
 * into the form state only — the admin still saves — and the language tab switches to the
 * first filled language (`onLanguageChange`). Disabled with a tooltip while the server has no
 * OPENROUTER_API_KEY (GET /admin/translate/status → enabled false).
 *
 *   <TranslateButton form={form} setForm={setForm} texts={localizedTexts(FAQ_TEXTS)} onLanguageChange={setLang} />
 *
 * `texts` is a text adapter (translations.js). `setForm` must accept an updater function.
 */
export const TranslateButton = ({ form, setForm, texts, onLanguageChange, disabled = false, size = 'sm', className }) => {
  const auto = useAutoTranslate({ form, setForm, texts })
  const banner = useBanner()
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('en')
  const [to, setTo] = useState(() => OTHERS('en'))
  const [overwrite, setOverwrite] = useState(false)
  const [error, setError] = useState(null)

  const unavailable = !auto.enabled
  const tooltip = auto.statusLoading
    ? 'Checking AI translation…'
    : auto.statusError
      ? 'AI translation is unavailable (the server did not answer the status check).'
      : unavailable
        ? 'AI translation is off. Set OPENROUTER_API_KEY on the server to turn it on.'
        : `Translate these texts with AI${auto.model ? ` (${auto.model})` : ''}`

  const changeFrom = (lang) => {
    setFrom(lang)
    setTo(OTHERS(lang))
    setError(null)
  }
  // Kept in EN · AZ · RU order whatever order they were ticked in.
  const toggleTo = (lang) =>
    setTo((list) => OTHERS(from).filter((l) => (l === lang ? !list.includes(l) : list.includes(l))))

  const run = async () => {
    setError(null)
    try {
      const { filled, nothing } = await auto.translate({ from, to, overwrite })
      const total = Object.values(filled).reduce((sum, n) => sum + n, 0)
      if (nothing || !total) {
        setError({
          kind: 'empty',
          message:
            nothing === 'source'
              ? `There is no ${languageMeta(from).label} text to translate yet.`
              : nothing === 'filled'
                ? `Nothing to fill — the ${to.map((l) => languageMeta(l).short).join(' / ')} fields already have text. Turn on “Overwrite filled fields” to replace them.`
                : 'The translation came back empty. Try again.',
        })
        return
      }
      setOpen(false)
      const first = to.find((lang) => filled[lang] > 0)
      if (first) onLanguageChange?.(first)
      banner.success(`${describeFilled(filled)}. Review the texts, then save.`, { title: 'Translated' })
    } catch (err) {
      setError(translateError(err))
    }
  }

  return (
    <>
      <span className={clsx('inline-flex', className)} title={tooltip}>
        <Button
          ref={anchorRef}
          size={size}
          variant="outline"
          leftIcon={Sparkles}
          disabled={disabled || unavailable}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setError(null)
            setOpen((o) => !o)
          }}
        >
          Translate
        </Button>
      </span>
      <Popover
        open={open}
        onClose={() => !auto.translating && setOpen(false)}
        anchorRef={anchorRef}
        placement="bottom-end"
        role="dialog"
        className="w-[300px] p-4"
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold leading-[18px] text-ink">
              <Sparkles className="h-4 w-4 text-primary" /> AI translate
            </p>
            <p className="mt-0.5 text-xs leading-4 text-ink-muted">
              Fills the form only — nothing is saved until you click Save.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-tertiary">From</p>
            <Tabs
              variant="pill"
              value={from}
              onChange={changeFrom}
              aria-label="Translate from"
              items={CONTENT_LANGUAGES.map((l) => ({ value: l.code, label: l.short }))}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-tertiary">To</p>
            <div className="flex flex-col gap-2">
              {OTHERS(from).map((lang) => (
                <Checkbox
                  key={lang}
                  label={languageMeta(lang).label}
                  checked={to.includes(lang)}
                  onChange={() => toggleTo(lang)}
                  disabled={auto.translating}
                />
              ))}
            </div>
          </div>

          <div>
            <Checkbox
              label="Overwrite filled fields"
              checked={overwrite}
              onChange={() => setOverwrite((o) => !o)}
              disabled={auto.translating}
            />
            <p className="mt-1 pl-6 text-xs leading-4 text-ink-muted">
              {overwrite ? 'Every field is replaced with the AI text.' : 'Only empty fields are filled.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className={clsx(
                'flex gap-2 rounded-lg px-3 py-2 text-xs leading-4',
                error.kind === 'empty' ? 'bg-subtle text-ink-secondary' : 'bg-error-soft text-error'
              )}
            >
              {error.kind !== 'empty' && <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />}
              <span>
                {error.kind === 'config' ? (
                  <>
                    AI translation is not set up. Set <code className="font-mono">OPENROUTER_API_KEY</code> in the server
                    environment and restart it.
                  </>
                ) : (
                  error.message
                )}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={auto.translating}>
              Cancel
            </Button>
            <Button size="sm" leftIcon={Sparkles} onClick={run} loading={auto.translating} disabled={!to.length}>
              {auto.translating ? 'Translating…' : 'Translate'}
            </Button>
          </div>
        </div>
      </Popover>
    </>
  )
}
