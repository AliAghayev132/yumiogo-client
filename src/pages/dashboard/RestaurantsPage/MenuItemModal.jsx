import { useState } from 'react'
import { UtensilsCrossed, Pencil } from 'lucide-react'
import {
  Modal,
  Input,
  Select,
  Button,
  SwitchRow,
  Field,
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
import { useCreateMenuItemMutation, useUpdateMenuItemMutation, useUploadMenuImagesMutation } from '@store/api'
import { ChipMulti } from './ChipMulti'
import { PhotoGrid } from './PhotoGrid'

// Texts with az / ru versions.
const DISH_TEXTS = ['name', 'description']
const DISH_TRANSLATE = localizedTexts(DISH_TEXTS)

const toState = (item, category) => ({
  name: item?.name || '',
  description: item?.description || '',
  price: item?.price === undefined || item?.price === null ? '' : String(item.price),
  category: item ? item.category || '' : category || '',
  dietary: [...(item?.dietary || [])],
  image: item?.image || '',
  isPopular: !!item?.isPopular,
  isAvailable: item ? item.isAvailable !== false : true,
  translations: toTranslationForm(item?.translations, DISH_TEXTS),
})

const MenuItemForm = ({ restaurantId, item, category, categories, dietaryOptions, onClose }) => {
  const banner = useBanner()
  const [form, setForm] = useState(() => toState(item, category))
  const [errors, setErrors] = useState({})
  const [lang, setLang] = useState('en')
  const [createItem, { isLoading: creating }] = useCreateMenuItemMutation()
  const [updateItem, { isLoading: updating }] = useUpdateMenuItemMutation()
  const [uploadImages, { isLoading: uploading }] = useUploadMenuImagesMutation()

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }
  // AZ / RU text of `field` in the selected language.
  const tr = (field) => ({
    lang,
    translation: form.translations[lang]?.[field],
    onTranslationChange: (value) =>
      setForm((f) => ({ ...f, translations: withTranslation(f.translations, lang, field, value) })),
  })
  const retiredDietary = (item?.dietary || []).filter((d) => !dietaryOptions.includes(d))

  const upload = async (files) => {
    try {
      const formData = new FormData()
      formData.append('files', files[0])
      const res = await uploadImages(formData).unwrap()
      const [url] = res?.data?.urls || []
      if (url) setForm((f) => ({ ...f, image: url }))
    } catch (err) {
      banner.error(errorMessage(err, 'Upload failed'))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    const price = Number(form.price)
    if (!form.name.trim()) next.name = 'Name is required'
    if (String(form.price).trim() === '' || !Number.isFinite(price) || price < 0) next.price = 'Enter a price of 0 or more'
    setErrors(next)
    if (Object.keys(next).length) {
      if (next.name) setLang('en')
      return
    }

    const body = {
      restaurantId,
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category || null,
      dietary: form.dietary,
      image: form.image || null,
      isPopular: form.isPopular,
      isAvailable: form.isAvailable,
      translations: toTranslationPayload(form.translations, DISH_TEXTS),
    }
    try {
      if (item) await updateItem({ id: item._id, ...body }).unwrap()
      else await createItem(body).unwrap()
      banner.success(item ? `${body.name} updated` : `${body.name} added to the menu`)
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the dish'))
    }
  }

  const categoryOptions = [
    ...categories.map((c) => ({ value: String(c._id), label: c.isActive === false ? `${c.name} (hidden)` : c.name })),
    { value: '', label: 'No category (“Other”)' },
  ]

  return (
    <form onSubmit={submit} noValidate>
      <Modal.HeaderActions>
        <TranslateButton form={form} setForm={setForm} texts={DISH_TRANSLATE} onLanguageChange={setLang} />
      </Modal.HeaderActions>
      <div className="flex flex-col gap-3">
        <LanguageBar
          value={lang}
          onChange={setLang}
          status={translationStatus(translationEntries(form, form.translations, DISH_TEXTS))}
        />
        <LocalizedInput {...tr('name')} label="Dish name" value={form.name} onChange={set('name')} error={errors.name} maxLength={120} placeholder="e.g. Salmon nigiri" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Price"
            type="number"
            min="0"
            step="0.1"
            value={form.price}
            onChange={set('price')}
            error={errors.price}
            rightIcon={<span className="text-sm text-ink-muted">₼</span>}
          />
          <Select
            label="Category"
            value={String(form.category || '')}
            options={categoryOptions}
            clearable={false}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
        </div>
        <LocalizedTextarea
          {...tr('description')}
          label="Description"
          value={form.description}
          onChange={set('description')}
          rows={3}
          maxLength={500}
          showCount
        />
        <ChipMulti
          label="Dietary"
          options={[...dietaryOptions, ...retiredDietary]}
          inactive={retiredDietary}
          value={form.dietary}
          onToggle={(d) =>
            setForm((f) => ({ ...f, dietary: f.dietary.includes(d) ? f.dietary.filter((x) => x !== d) : [...f.dietary, d] }))
          }
          emptyText="No dietary options in the catalog yet."
        />
        <Field label="Photo">
          <PhotoGrid
            photos={form.image ? [form.image] : []}
            multiple={false}
            uploading={uploading}
            uploadLabel={form.image ? 'Replace photo' : 'Upload photo'}
            onUpload={upload}
            onRemove={() => setForm((f) => ({ ...f, image: '' }))}
            emptyText="No photo."
          />
        </Field>
        <div className="-mx-3 flex flex-col">
          <SwitchRow
            label="Popular dish"
            description="Shown in the “Popular dishes” row of the restaurant profile."
            checked={form.isPopular}
            onChange={(isPopular) => setForm((f) => ({ ...f, isPopular }))}
          />
          <SwitchRow
            label="Available"
            description="Unavailable dishes are hidden from the app menu."
            checked={form.isAvailable}
            onChange={(isAvailable) => setForm((f) => ({ ...f, isAvailable }))}
          />
        </div>
      </div>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={creating || updating}>
          Cancel
        </Button>
        <Button type="submit" loading={creating || updating} disabled={uploading}>
          {item ? 'Save dish' : 'Add dish'}
        </Button>
      </Modal.Footer>
    </form>
  )
}

/**
 * Add / edit a menu item (dish): name, price in ₼, category, description, dietary (catalog),
 * photo (POST /admin/menu/uploads), popular + available flags.
 * `state` = null (closed) | { item?, category? }.
 */
export const MenuItemModal = ({ state, onClose, ...props }) => (
  <Modal
    isOpen={!!state}
    onClose={onClose}
    icon={state?.item ? Pencil : UtensilsCrossed}
    tone="orange"
    size="lg"
    title={state?.item ? 'Edit dish' : 'Add dish'}
    description={state?.item ? state.item.name : 'Dishes appear in the app under “Explore full menu”.'}
  >
    {state && (
      <MenuItemForm
        key={state.item?._id || 'new'}
        item={state.item}
        category={state.category}
        onClose={onClose}
        {...props}
      />
    )}
  </Modal>
)
