import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, RotateCcw, ListPlus } from 'lucide-react'
import { clsx } from 'clsx'
import {
  Card,
  Input,
  Checkbox,
  Button,
  IconButton,
  Switch,
  StatusPill,
  EmptyState,
  UnsavedBar,
  OrderButtons,
  LanguageBar,
  LocalizedInput,
  LocalizedTextarea,
  TranslationBadge,
  TranslateButton,
  TRANSLATION_HINT,
  translationEntries,
  translationStatus,
  withTranslation,
  moveItem,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import { useSaveContentPageMutation, useDeleteContentPageMutation } from '@store/api'
import { formatDateTime } from '@utils'
import {
  SLUG_PATTERN,
  SECTION_TEXTS,
  slugify,
  toForm,
  toPayload,
  emptySection,
  deletePageConfirm,
  pageTranslationEntries,
  PAGE_TRANSLATE,
} from './pageForm'

// Markup the app's Legal screen (and the website /legal page) understands in a section body.
const BODY_MARKUP_HELP = (
  <>
    A blank line starts a new paragraph. <code>&gt; text</code> — orange note box ·{' '}
    <code>| Type | Purpose |</code> — table rows (first row = header, <code>|---|</code> lines are skipped) · a
    paragraph of only <code>[Label](https://…)</code> links — buttons; App Store / Google Play links show as store
    badges. <code>{'{appLinks.ios}'}</code> / <code>{'{appLinks.android}'}</code> are replaced by the store links from
    App config → App stores (a link without a URL is hidden).
  </>
)

/**
 * Editor for one content page (title, intro, sections, published flag).
 * `page` null = a new page (the slug is chosen here). Saving is an upsert:
 * PUT /admin/pages/:slug. `dirtyRef` lets the list ask before switching away.
 */
export const PageEditor = ({ page, existingSlugs, dirtyRef, onSaved, onDeleted }) => {
  const isNew = !page
  const [savePage, { isLoading: saving }] = useSaveContentPageMutation()
  const [deletePage, { isLoading: deleting }] = useDeleteContentPageMutation()
  const [form, setForm] = useState(() => toForm(page))
  const [errors, setErrors] = useState({})
  // Language the title / intro / section fields edit (en | az | ru).
  const [lang, setLang] = useState('en')
  const banner = useBanner()
  const confirm = useConfirm()

  const baseline = useMemo(() => JSON.stringify({ slug: page?.slug || '', ...toPayload(toForm(page)) }), [page])
  const dirty = JSON.stringify({ slug: form.slug, ...toPayload(form) }) !== baseline

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty, dirtyRef])
  useEffect(() => () => {
    dirtyRef.current = false
  }, [dirtyRef])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => ({ ...errs, [key]: undefined }))
  }
  const setSection = (index, patch) =>
    setForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) }))
  const moveSection = (from, to) => setForm((f) => ({ ...f, sections: moveItem(f.sections, from, to) }))
  const removeSection = (index) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }))
  const addSection = () => setForm((f) => ({ ...f, sections: [...f.sections, emptySection()] }))
  // AZ / RU text of a page field / of a section field in the selected language.
  const tr = (field) => ({
    lang,
    translation: form.translations[lang]?.[field],
    onTranslationChange: (value) =>
      setForm((f) => ({ ...f, translations: withTranslation(f.translations, lang, field, value) })),
  })
  const sectionTr = (index, field) => ({
    lang,
    translation: form.sections[index].translations[lang]?.[field],
    onTranslationChange: (value) =>
      setForm((f) => ({
        ...f,
        sections: f.sections.map((s, i) =>
          i === index ? { ...s, translations: withTranslation(s.translations, lang, field, value) } : s
        ),
      })),
  })

  const save = async () => {
    const slug = isNew ? form.slug.replace(/-+$/, '') : page.slug
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required'
    if (isNew) {
      if (!slug) nextErrors.slug = 'Slug is required'
      else if (!SLUG_PATTERN.test(slug)) nextErrors.slug = 'Use lowercase letters, numbers and dashes only'
      else if (existingSlugs.includes(slug)) nextErrors.slug = 'A page with this slug already exists'
    }
    if (Object.keys(nextErrors).length) {
      if (nextErrors.title) setLang('en')
      return setErrors(nextErrors)
    }

    try {
      await savePage({ slug, ...toPayload(form) }).unwrap()
      banner.success(isNew ? 'Page created' : 'Page saved')
      onSaved(slug)
    } catch (err) {
      banner.error(errorMessage(err, 'Save failed'))
    }
  }

  const remove = async () => {
    const ok = await confirm(deletePageConfirm(page))
    if (!ok) return
    try {
      await deletePage(page.slug).unwrap()
      banner.success('Page deleted')
      onDeleted()
    } catch (err) {
      banner.error(errorMessage(err, 'Delete failed'))
    }
  }

  return (
    <Card padding="chart">
      <Card.Header
        divider
        className="-mx-[18px] px-[18px]"
        actions={
          <>
            <TranslateButton form={form} setForm={setForm} texts={PAGE_TRANSLATE} onLanguageChange={setLang} />
            <StatusPill status={form.isPublished ? 'published' : 'draft'} />
            <Switch
              checked={form.isPublished}
              onChange={(isPublished) => setForm((f) => ({ ...f, isPublished }))}
              label="Published"
            />
          </>
        }
      >
        <Card.Title>{isNew ? 'New page' : form.title || page.title}</Card.Title>
        <Card.Description>
          {isNew ? (
            'Pick a slug — it is the page address and cannot be changed later.'
          ) : (
            <>
              <code className="font-mono">/{page.slug}</code>
              {page.updatedAt && <> · updated {formatDateTime(page.updatedAt)}</>}
            </>
          )}
        </Card.Description>
      </Card.Header>

      <div className="flex flex-col gap-4">
        <LanguageBar value={lang} onChange={setLang} status={translationStatus(pageTranslationEntries(form))} />
        {isNew && (
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => {
              setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
              setErrors((errs) => ({ ...errs, slug: undefined }))
            }}
            placeholder="e.g. community-guidelines"
            error={errors.slug}
            helperText="Lowercase letters, numbers and dashes."
          />
        )}
        <LocalizedInput
          {...tr('title')}
          label="Title"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value
            setForm((f) => ({
              ...f,
              title,
              // Suggest a slug from the title until the admin types their own.
              slug: isNew && (!f.slug || f.slug === slugify(f.title)) ? slugify(title) : f.slug,
            }))
            setErrors((errs) => ({ ...errs, title: undefined, slug: undefined }))
          }}
          placeholder="Terms of use"
          error={errors.title}
        />
        <LocalizedTextarea
          {...tr('intro')}
          label="Intro"
          value={form.intro}
          onChange={set('intro')}
          rows={3}
          placeholder="Optional text shown above the sections."
        />

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold leading-[18px] text-ink">Sections ({form.sections.length})</p>
              <p className="mt-0.5 text-xs text-ink-muted">Highlighted sections are shown as a callout box.</p>
            </div>
            <Button size="sm" variant="outline" onClick={addSection} leftIcon={Plus}>
              Add section
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {form.sections.map((section, i) => (
              <div
                key={section._key}
                className={clsx(
                  'rounded-xl border p-4 transition-colors',
                  section.highlight ? 'border-mint-line bg-brand-soft' : 'border-line bg-surface'
                )}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-tertiary">
                    Section {i + 1}
                    <TranslationBadge
                      status={translationStatus(translationEntries(section, section.translations, SECTION_TEXTS))}
                    />
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Checkbox
                      label="Highlight"
                      checked={section.highlight}
                      onChange={() => setSection(i, { highlight: !section.highlight })}
                    />
                    <OrderButtons index={i} count={form.sections.length} onMove={moveSection} />
                    <IconButton
                      icon={Trash2}
                      label="Remove section"
                      tone="danger"
                      onClick={() => removeSection(i)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <LocalizedInput
                    {...sectionTr(i, 'heading')}
                    value={section.heading}
                    onChange={(e) => setSection(i, { heading: e.target.value })}
                    placeholder="Heading, e.g. 1. About Yumio"
                    aria-label={`Section ${i + 1} heading`}
                  />
                  <LocalizedTextarea
                    {...sectionTr(i, 'body')}
                    value={section.body}
                    onChange={(e) => setSection(i, { body: e.target.value })}
                    rows={4}
                    placeholder="Section text"
                    aria-label={`Section ${i + 1} text`}
                    helperText={BODY_MARKUP_HELP}
                    translationHint={`${TRANSLATION_HINT} Same markup as the English text.`}
                  />
                </div>
              </div>
            ))}
            {!form.sections.length && (
              <div className="rounded-xl border border-dashed border-line">
                <EmptyState
                  compact
                  icon={ListPlus}
                  title="No sections yet"
                  description="Add a section to start writing the page."
                  className="py-6"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Card.Footer className="-mx-[18px] flex flex-wrap items-center justify-between gap-3 px-[18px]">
        {isNew ? (
          <span />
        ) : (
          <Button variant="soft-danger" onClick={remove} loading={deleting} disabled={saving} leftIcon={Trash2}>
            Delete page
          </Button>
        )}
        <div className="flex items-center gap-2">
          {dirty && !isNew && (
            <Button variant="outline" onClick={() => setForm(toForm(page))} disabled={saving} leftIcon={RotateCcw}>
              Discard
            </Button>
          )}
          <Button onClick={save} loading={saving} disabled={!dirty && !isNew}>
            {isNew ? 'Create page' : 'Save page'}
          </Button>
        </div>
      </Card.Footer>

      {/* Long pages: keep Save reachable while scrolled into the sections. */}
      <UnsavedBar
        visible={dirty && !isNew}
        saving={saving}
        onSave={save}
        onDiscard={() => setForm(toForm(page))}
        saveLabel="Save page"
        message={`Unsaved changes to “${page?.title || ''}”`}
      />
    </Card>
  )
}
