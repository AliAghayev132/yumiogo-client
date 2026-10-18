/**
 * Content translations (en / az / ru) — helpers shared by every admin form.
 *
 * The plain field (`name`, `description`, …) is the English text and keeps its
 * required rules; translatable documents also carry
 *
 *   translations: { az: { name, description, … }, ru: { … } }
 *
 * with optional strings. An empty translation falls back to English in the
 * apps, and sending "" clears it. The server merges per language and field, so
 * a form sends both languages for exactly the fields it manages.
 */

export const CONTENT_LANGUAGES = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'az', short: 'AZ', label: 'Azerbaijani' },
  { code: 'ru', short: 'RU', label: 'Russian' },
]
export const TRANSLATED_LANGUAGES = ['az', 'ru']

export const languageMeta = (code) => CONTENT_LANGUAGES.find((l) => l.code === code) || CONTENT_LANGUAGES[0]

/** Hint under an AZ / RU input. */
export const TRANSLATION_HINT = 'Optional — empty uses English.'

/** What the selected language means for the fields below a LanguageTabs switch. */
export const languageNote = (lang) =>
  lang === 'en'
    ? 'English is required. Azerbaijani and Russian are optional.'
    : `${languageMeta(lang).label} is optional — empty fields use the English text (shown greyed out).`

const str = (value) => (value === null || value === undefined ? '' : String(value))
const hasText = (value) => typeof value === 'string' && value.trim() !== ''

/** Stored translations → form state for `fields`: { az: { name: '' }, ru: { name: '' } } (always strings). */
export const toTranslationForm = (translations, fields) =>
  Object.fromEntries(
    TRANSLATED_LANGUAGES.map((lang) => [
      lang,
      Object.fromEntries(fields.map((field) => [field, str(translations?.[lang]?.[field])])),
    ])
  )

/** Form state → `translations` payload for `fields` (trimmed; "" = use English). */
export const toTranslationPayload = (form, fields) =>
  Object.fromEntries(
    TRANSLATED_LANGUAGES.map((lang) => [
      lang,
      Object.fromEntries(fields.map((field) => [field, str(form?.[lang]?.[field]).trim()])),
    ])
  )

/** Immutable update of one translated field. */
export const withTranslation = (translations, lang, field, value) => ({
  ...translations,
  [lang]: { ...(translations?.[lang] || {}), [field]: value },
})

/** [{ en, az, ru }] for `fields` of a document / form — the input of translationStatus. */
export const translationEntries = (english, translations, fields) =>
  fields.map((field) => ({
    en: english?.[field],
    az: translations?.az?.[field],
    ru: translations?.ru?.[field],
  }))

/**
 * How complete each language is over `entries` (only texts that have English count):
 * → { az: { state, filled, total }, ru: … } with state 'complete' | 'partial' | 'missing',
 * or null for a language when there is nothing to translate.
 */
export const translationStatus = (entries) =>
  Object.fromEntries(
    TRANSLATED_LANGUAGES.map((lang) => {
      const needed = entries.filter((e) => hasText(e.en))
      if (!needed.length) return [lang, null]
      const filled = needed.filter((e) => hasText(e[lang])).length
      const state = filled === needed.length ? 'complete' : filled ? 'partial' : 'missing'
      return [lang, { state, filled, total: needed.length }]
    })
  )

/** translationStatus() of one document. */
export const documentTranslationStatus = (doc, fields) =>
  translationStatus(translationEntries(doc, doc?.translations, fields))

/** "Azerbaijani: 2 of 3 texts translated" (tooltips). */
export const describeTranslationStatus = (lang, status) => {
  const { label } = languageMeta(lang)
  if (!status) return `${label}: nothing to translate`
  if (status.state === 'complete') return `${label}: translated`
  if (status.state === 'missing') return `${label}: not translated — the app shows English`
  return `${label}: ${status.filled} of ${status.total} texts translated — the rest show English`
}

/*
 * AI translation (TranslateButton / useAutoTranslate) — text adapters.
 *
 * An adapter reads and writes the translatable texts a form manages, per language:
 *
 *   { get(form, lang) → { "<key>": string | string[] }, set(form, lang, texts) → form }
 *
 * Keys are stable (field names, row keys, section ids), so the translated answer maps back to
 * the same field even if rows were reordered meanwhile. Arrays are positional (tab labels).
 * Build them from the helpers below instead of writing get / set by hand.
 */
const textValue = (value) => (Array.isArray(value) ? value.map(str) : str(value))
const own = (texts, fields) => Object.fromEntries(fields.filter((f) => f in texts).map((f) => [f, texts[f]]))
const prefixed = (prefix, texts) => Object.fromEntries(Object.entries(texts).map(([k, v]) => [`${prefix}.${k}`, v]))
const unprefixed = (prefix, texts) =>
  Object.fromEntries(
    Object.entries(texts)
      .filter(([k]) => k.startsWith(`${prefix}.`))
      .map(([k, v]) => [k.slice(prefix.length + 1), v])
  )

/** Standard shape: English at doc[field], AZ / RU at doc.translations[lang][field]. */
export const localizedTexts = (fields) => ({
  get: (doc, lang) =>
    Object.fromEntries(fields.map((f) => [f, textValue(lang === 'en' ? doc?.[f] : doc?.translations?.[lang]?.[f])])),
  set: (doc, lang, texts) => {
    const values = own(texts, fields)
    if (!Object.keys(values).length) return doc
    if (lang === 'en') return { ...doc, ...values }
    return { ...doc, translations: { ...doc.translations, [lang]: { ...(doc.translations?.[lang] || {}), ...values } } }
  },
})

/** The object at form[path] (e.g. App config `surprise`), keys "path.<key>". */
export const nestedTexts = (path, adapter) => ({
  get: (form, lang) => prefixed(path, adapter.get(form?.[path], lang)),
  set: (form, lang, texts) => {
    const values = unprefixed(path, texts)
    return Object.keys(values).length ? { ...form, [path]: adapter.set(form[path], lang, values) } : form
  },
})

/** Rows of the array form[path], identified by row[idKey]: keys "path.<id>.<key>". */
export const listTexts = (path, adapter, idKey = 'key') => ({
  get: (form, lang) =>
    Object.assign({}, ...(form?.[path] || []).map((row) => prefixed(`${path}.${row[idKey]}`, adapter.get(row, lang)))),
  set: (form, lang, texts) => ({
    ...form,
    [path]: form[path].map((row) => {
      const values = unprefixed(`${path}.${row[idKey]}`, texts)
      return Object.keys(values).length ? adapter.set(row, lang, values) : row
    }),
  }),
})

/** Several adapters over one form (e.g. a page's title / intro + its sections). */
export const combineTexts = (...adapters) => ({
  get: (form, lang) => Object.assign({}, ...adapters.map((a) => a.get(form, lang))),
  set: (form, lang, texts) => adapters.reduce((acc, a) => a.set(acc, lang, texts), form),
})

const blank = (value) => !hasText(value)
const hasAnyText = (value) => (Array.isArray(value) ? value.some(hasText) : hasText(value))

/**
 * Source texts to send for `targets` ({ lang: texts }): those with text that some target still
 * misses (every one with text when `overwrite`). Arrays go whole, as they are positional.
 */
export const textsToTranslate = (source, targets, overwrite = false) =>
  Object.fromEntries(
    Object.entries(source).filter(([key, value]) => {
      if (!hasAnyText(value)) return false
      if (overwrite) return true
      return Object.values(targets).some((texts) => {
        const current = texts?.[key]
        return Array.isArray(value)
          ? value.some((v, i) => hasText(v) && blank(Array.isArray(current) ? current[i] : ''))
          : blank(current)
      })
    })
  )

/**
 * `translated` merged over a language's `current` texts: only empty fields are filled unless
 * `overwrite`. → { texts (only the keys that change), filled (number of fields written) }
 */
export const mergeTranslated = (current = {}, translated = {}, overwrite = false) => {
  const texts = {}
  let filled = 0
  Object.entries(translated || {}).forEach(([key, value]) => {
    if (!(key in current)) return // a key this form does not manage
    const cur = current[key]
    if (Array.isArray(value)) {
      const base = Array.isArray(cur) ? cur : []
      const length = base.length || value.length
      let changed = false
      const next = Array.from({ length }, (_, i) => {
        if (hasText(value[i]) && (overwrite || blank(base[i]))) {
          changed = true
          filled += 1
          return String(value[i]).trim()
        }
        return str(base[i])
      })
      if (changed) texts[key] = next
    } else if (hasText(value) && (overwrite || blank(cur))) {
      texts[key] = String(value).trim()
      filled += 1
    }
  })
  return { texts, filled }
}
