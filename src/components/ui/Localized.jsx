import { clsx } from 'clsx'
import { Tabs } from './Tabs'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Badge } from './Badge'
import {
  CONTENT_LANGUAGES,
  TRANSLATED_LANGUAGES,
  TRANSLATION_HINT,
  languageMeta,
  languageNote,
  describeTranslationStatus,
} from './translations'

// Filled state of a language: green complete · amber partial · hollow missing.
const StatusDot = ({ status }) => {
  if (!status) return null
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        status.state === 'complete' && 'bg-brand',
        status.state === 'partial' && 'bg-warning',
        status.state === 'missing' && 'ring-1 ring-inset ring-ink-disabled'
      )}
    />
  )
}

/**
 * LanguageTabs — "EN* · AZ · RU" switch for the translatable fields of a form or card.
 * English is required (asterisk); AZ / RU carry a dot from translationStatus():
 * green = translated, amber = partly, hollow = not yet.
 *   <LanguageTabs value={lang} onChange={setLang} status={translationStatus(entries)} />
 */
export const LanguageTabs = ({ value = 'en', onChange, status, className, ...aria }) => (
  <Tabs
    variant="pill"
    value={value}
    onChange={onChange}
    aria-label={aria['aria-label'] || 'Content language'}
    className={clsx('shrink-0', className)}
    items={CONTENT_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: (
        <span
          className="inline-flex items-center gap-1.5"
          title={lang.code === 'en' ? 'English (required)' : describeTranslationStatus(lang.code, status?.[lang.code])}
        >
          {lang.short}
          {lang.code === 'en' ? (
            <span className="-ml-1 text-danger">*</span>
          ) : (
            <StatusDot status={status?.[lang.code]} />
          )}
        </span>
      ),
    }))}
  />
)

/**
 * LanguageBar — the language switch row at the top of a form (modals): title + note on the
 * left, LanguageTabs on the right. Same props as LanguageTabs.
 */
export const LanguageBar = ({ value = 'en', onChange, status, className }) => (
  <div
    className={clsx(
      'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2',
      className
    )}
  >
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium leading-5 text-ink">Language</p>
      <p className="text-xs leading-4 text-ink-tertiary">{languageNote(value)}</p>
    </div>
    <LanguageTabs value={value} onChange={onChange} status={status} />
  </div>
)

// Label "Name" → "Name · AZ" while a translation is edited.
const translatedLabel = (label, lang) =>
  label ? (
    <>
      {label} <span className="text-ink-muted">· {languageMeta(lang).short}</span>
    </>
  ) : undefined

// Props that only make sense for the English value (validation, English suggestions).
const ENGLISH_ONLY = ['required', 'error', 'list', 'helperText']
const englishOnly = (props) => Object.fromEntries(Object.entries(props).filter(([key]) => !ENGLISH_ONLY.includes(key)))

const translationProps = ({ lang, label, value, translation, onTranslationChange, translationHint, placeholder, ...props }) => {
  const english = String(value ?? '')
  const ariaLabel = props['aria-label']
  return {
    ...englishOnly(props),
    label: translatedLabel(label, lang),
    'aria-label': ariaLabel ? `${ariaLabel} (${languageMeta(lang).label})` : undefined,
    value: translation ?? '',
    onChange: (e) => onTranslationChange?.(e.target.value),
    // The English text as the placeholder: what the app shows while this stays empty.
    placeholder: english.trim() ? english : placeholder,
    helperText: translationHint === undefined ? TRANSLATION_HINT : translationHint || undefined,
  }
}

/**
 * LocalizedInput — an Input that edits the English value (lang "en", all Input props apply,
 * incl. `required` / `error`) or the AZ / RU translation of it: `translation` +
 * `onTranslationChange(text)`; optional, English as the placeholder, "Optional — empty uses
 * English." as the hint (`translationHint` overrides it, null hides it).
 *   <LocalizedInput lang={lang} label="Name" required value={form.name} onChange={set('name')}
 *     translation={form.translations[lang]?.name} onTranslationChange={setTr('name')} />
 */
export const LocalizedInput = ({ lang = 'en', translation, onTranslationChange, translationHint, ...props }) =>
  lang === 'en' || !TRANSLATED_LANGUAGES.includes(lang) ? (
    <Input {...props} />
  ) : (
    <Input {...translationProps({ lang, translation, onTranslationChange, translationHint, ...props })} />
  )

/** LocalizedTextarea — LocalizedInput for a Textarea (same props). */
export const LocalizedTextarea = ({ lang = 'en', translation, onTranslationChange, translationHint, ...props }) =>
  lang === 'en' || !TRANSLATED_LANGUAGES.includes(lang) ? (
    <Textarea {...props} />
  ) : (
    <Textarea {...translationProps({ lang, translation, onTranslationChange, translationHint, ...props })} />
  )

/**
 * TranslationBadge — compact "AZ RU" filled-state pills for tables and lists
 * (green translated, amber partly, grey not yet). Renders nothing without English text.
 *   <TranslationBadge status={documentTranslationStatus(item, ['name', 'description'])} />
 */
export const TranslationBadge = ({ status, className }) => {
  if (!status || TRANSLATED_LANGUAGES.every((lang) => !status[lang])) return null
  return (
    <span className={clsx('inline-flex shrink-0 items-center gap-0.5 align-middle', className)}>
      {TRANSLATED_LANGUAGES.map((lang) => {
        const s = status[lang]
        if (!s) return null
        return (
          <Badge
            key={lang}
            size="sm"
            tone={s.state === 'complete' ? 'success' : s.state === 'partial' ? 'warning' : 'neutral'}
            title={describeTranslationStatus(lang, s)}
            className={clsx('font-semibold', s.state === 'missing' && 'text-ink-disabled')}
          >
            {languageMeta(lang).short}
          </Badge>
        )
      })}
    </span>
  )
}
