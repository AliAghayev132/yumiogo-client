import {
  toTranslationForm,
  toTranslationPayload,
  translationEntries,
  localizedTexts,
  listTexts,
  combineTexts,
} from '@components'

// Texts with az / ru versions: the page's title + intro, and each section's heading + body
// (sections carry their own `translations`, so they move with the section).
export const PAGE_TEXTS = ['title', 'intro']
export const SECTION_TEXTS = ['heading', 'body']

// AI translate texts of the editor: title + intro, and each section by its client key
// ("sections.s3.body"), so answers land on the right section even after a reorder.
export const PAGE_TRANSLATE = combineTexts(
  localizedTexts(PAGE_TEXTS),
  listTexts('sections', localizedTexts(SECTION_TEXTS), '_key')
)

// Slugs the mobile app links to (Settings → Terms / Privacy / Cookies).
export const APP_SLUGS = ['terms', 'privacy', 'cookies']

export const SLUG_PATTERN = /^[a-z0-9-]+$/

/** "Refund Policy!" → "refund-policy" (a trailing dash is kept while typing). */
export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')

// Client-only keys so section rows keep their identity (and focus) when moved.
let nextKey = 0
export const withKey = (section) => ({ ...section, _key: `s${(nextKey += 1)}` })

export const emptySection = () =>
  withKey({ heading: '', body: '', highlight: false, translations: toTranslationForm(null, SECTION_TEXTS) })

/** ContentPage → editor state. */
export const toForm = (page) => ({
  slug: page?.slug || '',
  title: page?.title || '',
  intro: page?.intro || '',
  isPublished: page?.isPublished ?? true,
  translations: toTranslationForm(page?.translations, PAGE_TEXTS),
  sections: (page?.sections || []).map((s) =>
    withKey({
      heading: s.heading || '',
      body: s.body || '',
      highlight: !!s.highlight,
      translations: toTranslationForm(s.translations, SECTION_TEXTS),
    })
  ),
})

/** Editor state → PUT /admin/pages/:slug body (sections without English text dropped). */
export const toPayload = (form) => ({
  title: form.title.trim(),
  intro: form.intro,
  isPublished: form.isPublished,
  translations: toTranslationPayload(form.translations, PAGE_TEXTS),
  sections: form.sections
    .filter((s) => s.heading.trim() || s.body.trim())
    .map((s) => ({
      heading: s.heading.trim(),
      body: s.body,
      highlight: !!s.highlight,
      translations: toTranslationPayload(s.translations, SECTION_TEXTS),
    })),
})

/** translationStatus() entries of the whole page (title, intro and every section). */
export const pageTranslationEntries = (form) => [
  ...translationEntries(form, form.translations, PAGE_TEXTS),
  ...form.sections.flatMap((s) => translationEntries(s, s.translations, SECTION_TEXTS)),
]

/** useConfirm() options for deleting `page` (the list row and the editor share them). */
export const deletePageConfirm = (page) => ({
  tone: 'danger',
  title: `Delete “${page.title}”?`,
  message: 'This page will be removed permanently.',
  notice: APP_SLUGS.includes(page.slug)
    ? 'The app links to this page from its Settings screen and will show “not found” until a page with this slug exists again. Unpublishing hides it instead.'
    : undefined,
  confirmText: 'Delete page',
})
