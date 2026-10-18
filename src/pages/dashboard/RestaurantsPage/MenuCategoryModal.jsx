import { useState } from 'react'
import { FolderPlus, Pencil } from 'lucide-react'
import {
  Modal,
  Button,
  SwitchRow,
  LanguageBar,
  LocalizedInput,
  LocalizedTextarea,
  TranslateButton,
  localizedTexts,
  toTranslationForm,
  toTranslationPayload,
  translationEntries,
  translationStatus,
  withTranslation,
  useBanner,
  errorMessage,
} from '@components'
import { useCreateMenuCategoryMutation, useUpdateMenuCategoryMutation } from '@store/api'

// Texts with az / ru versions.
const CATEGORY_TEXTS = ['name', 'description']
const CATEGORY_TRANSLATE = localizedTexts(CATEGORY_TEXTS)

const CategoryForm = ({ restaurantId, category, onClose }) => {
  const banner = useBanner()
  const [form, setForm] = useState(() => ({
    name: category?.name || '',
    description: category?.description || '',
    translations: toTranslationForm(category?.translations, CATEGORY_TEXTS),
  }))
  const { name, description, translations } = form
  const [isActive, setIsActive] = useState(category ? category.isActive !== false : true)
  const [error, setError] = useState('')
  const [lang, setLang] = useState('en')
  // AZ / RU text of `field` in the selected language.
  const tr = (field) => ({
    lang,
    translation: translations[lang]?.[field],
    onTranslationChange: (value) =>
      setForm((f) => ({ ...f, translations: withTranslation(f.translations, lang, field, value) })),
  })
  const [createCategory, { isLoading: creating }] = useCreateMenuCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateMenuCategoryMutation()

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      setLang('en')
      return
    }
    const body = {
      restaurantId,
      name: name.trim(),
      description: description.trim(),
      isActive,
      translations: toTranslationPayload(translations, CATEGORY_TEXTS),
    }
    try {
      if (category) await updateCategory({ id: category._id, ...body }).unwrap()
      else await createCategory(body).unwrap()
      banner.success(category ? 'Category updated' : `Category “${body.name}” added`)
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the category'))
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Modal.HeaderActions>
        <TranslateButton form={form} setForm={setForm} texts={CATEGORY_TRANSLATE} onLanguageChange={setLang} />
      </Modal.HeaderActions>
      <div className="flex flex-col gap-3">
        <LanguageBar
          value={lang}
          onChange={setLang}
          status={translationStatus(translationEntries(form, translations, CATEGORY_TEXTS))}
        />
        <LocalizedInput
          {...tr('name')}
          label="Category name"
          value={name}
          onChange={(e) => {
            const value = e.target.value
            setForm((f) => ({ ...f, name: value }))
            setError('')
          }}
          error={error}
          maxLength={80}
          placeholder="e.g. Appetizers and salads"
        />
        <LocalizedTextarea
          {...tr('description')}
          label="Description (optional)"
          value={description}
          onChange={(e) => {
            const value = e.target.value
            setForm((f) => ({ ...f, description: value }))
          }}
          rows={2}
          maxLength={300}
          showCount
        />
        <SwitchRow
          className="-mx-3"
          label="Visible in the app"
          description="Hidden categories and their dishes are not shown in the app menu."
          checked={isActive}
          onChange={setIsActive}
        />
      </div>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={creating || updating}>
          Cancel
        </Button>
        <Button type="submit" loading={creating || updating}>
          {category ? 'Save category' : 'Add category'}
        </Button>
      </Modal.Footer>
    </form>
  )
}

/** Add / edit a menu category (chip row of "Explore full menu"). `state` = null | { category? }. */
export const MenuCategoryModal = ({ state, onClose, restaurantId }) => (
  <Modal
    isOpen={!!state}
    onClose={onClose}
    icon={state?.category ? Pencil : FolderPlus}
    tone="orange"
    title={state?.category ? 'Edit category' : 'Add category'}
    description="Categories group the dishes of the menu, in the order shown here."
  >
    {state && (
      <CategoryForm key={state.category?._id || 'new'} restaurantId={restaurantId} category={state.category} onClose={onClose} />
    )}
  </Modal>
)
