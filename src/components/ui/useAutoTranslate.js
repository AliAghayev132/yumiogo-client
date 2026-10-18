import { useGetTranslateStatusQuery, useTranslateTextsMutation } from '@store/api'
import { CONTENT_LANGUAGES, textsToTranslate, mergeTranslated } from './translations'

// Server limits per POST /admin/translate (TranslationService): 200 keys, 30 000 characters;
// bigger forms (long legal pages) are sent in several requests, with some headroom.
const MAX_KEYS = 200
const MAX_CHARS = 28000

const textLength = (value) => (Array.isArray(value) ? value.reduce((n, v) => n + String(v).length, 0) : String(value).length)

/** { key: text } → [{ key: text }, …] batches within the request limits. */
const toBatches = (texts) => {
  const batches = []
  let batch = {}
  let keys = 0
  let chars = 0
  Object.entries(texts).forEach(([key, value]) => {
    const size = textLength(value)
    if (keys && (keys >= MAX_KEYS || chars + size > MAX_CHARS)) {
      batches.push(batch)
      batch = {}
      keys = 0
      chars = 0
    }
    batch[key] = value
    keys += 1
    chars += size
  })
  if (keys) batches.push(batch)
  return batches
}

/** Why a translation failed → { kind: 'config' | 'failed' | 'invalid' | 'other', message }. */
export const translateError = (err) => {
  const code = err?.data?.code
  if (code === 'TRANSLATE_NOT_CONFIGURED' || err?.status === 503) {
    return {
      kind: 'config',
      message: 'AI translation is not set up. Set OPENROUTER_API_KEY in the server environment and restart it.',
    }
  }
  if (err?.status === 429) {
    return { kind: 'failed', message: 'Too many translation requests. Wait a minute and try again.' }
  }
  if (code === 'TRANSLATE_FAILED' || err?.status === 502) {
    return { kind: 'failed', message: 'The translation service did not answer. Try again in a moment.' }
  }
  if (code === 'TRANSLATE_INVALID' || err?.status === 400) {
    return { kind: 'invalid', message: err?.data?.message || 'These texts could not be sent for translation.' }
  }
  return { kind: 'other', message: err?.data?.message || err?.error || 'Translation failed' }
}

/**
 * useAutoTranslate — AI-translates the texts of one form into the form state (nothing is saved).
 *
 *   const auto = useAutoTranslate({ form, setForm, texts: localizedTexts(['name', 'description']) })
 *   auto.enabled            // server has OPENROUTER_API_KEY (status.enabled)
 *   const { filled } = await auto.translate({ from: 'en', to: ['az', 'ru'], overwrite: false })
 *
 * `texts` is a text adapter (translations.js: localizedTexts / nestedTexts / listTexts /
 * combineTexts). translate() sends the source-language texts that a target still misses (all
 * of them with `overwrite`; split into batches within the server limits), then merges the answer into the latest form state, filling only
 * empty fields unless `overwrite`. → { filled: { lang: count }, nothing } — `nothing` is
 * 'source' (no source text) or 'filled' (every target already has text) when nothing was
 * sent, else null. Throws the RTK error (see translateError) when the call fails.
 */
export const useAutoTranslate = ({ form, setForm, texts }) => {
  const status = useGetTranslateStatusQuery()
  const [translateTexts, { isLoading: translating }] = useTranslateTextsMutation()

  const translate = async ({ from = 'en', to, overwrite = false }) => {
    const targets = (to || CONTENT_LANGUAGES.map((l) => l.code)).filter((lang) => lang !== from)
    const source = texts.get(form, from)
    const pending = textsToTranslate(
      source,
      Object.fromEntries(targets.map((lang) => [lang, texts.get(form, lang)])),
      overwrite
    )
    if (!targets.length || !Object.keys(pending).length) {
      const hasSource = !!Object.keys(textsToTranslate(source, {}, true)).length
      return { filled: {}, nothing: hasSource ? 'filled' : 'source' }
    }

    // One request per batch, one after another (the server allows 30 requests a minute).
    const answer = {}
    for (const batch of toBatches(pending)) {
      const res = await translateTexts({ from, to: targets, texts: batch }).unwrap()
      Object.entries(res?.data?.translations || {}).forEach(([lang, values]) => {
        answer[lang] = { ...(answer[lang] || {}), ...values }
      })
    }
    // Only the keys that were asked for (the source may have changed while waiting).
    const answered = (lang) =>
      Object.fromEntries(Object.entries(answer[lang] || {}).filter(([key]) => key in pending))

    const filled = Object.fromEntries(
      targets.map((lang) => [lang, mergeTranslated(texts.get(form, lang), answered(lang), overwrite).filled])
    )
    // Merge over the latest state, so typing during the request is kept.
    setForm((latest) =>
      targets.reduce((acc, lang) => {
        const { texts: values } = mergeTranslated(texts.get(acc, lang), answered(lang), overwrite)
        return Object.keys(values).length ? texts.set(acc, lang, values) : acc
      }, latest)
    )
    return { filled, nothing: null }
  }

  return {
    enabled: !!status.data?.data?.enabled,
    model: status.data?.data?.model || '',
    statusLoading: status.isLoading,
    statusError: status.isError,
    translating,
    translate,
  }
}
