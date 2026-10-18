import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import {
  Modal,
  Select,
  Button,
  LanguageBar,
  LocalizedInput,
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
import { useCreateRestaurantMutation, useGetMetaQuery, useGetCatalogQuery } from '@store/api'

// Texts with az / ru versions here (the description is added later in the editor).
const TEXTS = ['name', 'address']
const TRANSLATE = localizedTexts(TEXTS)
const EMPTY = { name: '', cuisine: '', address: '', translations: toTranslationForm(null, TEXTS) }

/**
 * Figma modalBox 1338:4674 — "Add new restaurant": Restaurant name, Category (cuisine from the
 * admin catalog), Location; "Add & publish". The listing starts in the default city at its
 * centre; the full editor opens next for photos, hours, menu and the rest.
 * With "Restaurant approval" on (Settings) the server keeps it pending.
 */
export const AddRestaurantModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const banner = useBanner()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [lang, setLang] = useState('en')
  const { data: metaData, isLoading: metaLoading } = useGetMetaQuery(undefined, { skip: !isOpen })
  const { data: catalogData } = useGetCatalogQuery(undefined, { skip: !isOpen })
  const [createRestaurant, { isLoading }] = useCreateRestaurantMutation()

  const cuisines = metaData?.data?.cuisines || []
  const defaultCity = catalogData?.data?.defaultCity || null

  // AZ / RU text of `field` in the selected language.
  const tr = (field) => ({
    lang,
    translation: form.translations[lang]?.[field],
    onTranslationChange: (value) =>
      setForm((f) => ({ ...f, translations: withTranslation(f.translations, lang, field, value) })),
  })

  const close = () => {
    setForm(EMPTY)
    setErrors({})
    setLang('en')
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Restaurant name is required'
    if (cuisines.length && !form.cuisine) next.cuisine = 'Choose a category'
    setErrors(next)
    if (Object.keys(next).length) {
      if (next.name) setLang('en')
      return
    }

    try {
      const res = await createRestaurant({
        name: form.name.trim(),
        cuisines: form.cuisine ? [form.cuisine] : [],
        address: form.address.trim(),
        translations: toTranslationPayload(form.translations, TEXTS),
        ...(defaultCity
          ? {
              // `key` is the English name restaurants store (`name` may be localized).
              city: defaultCity.key || defaultCity.name,
              location: { type: 'Point', coordinates: [defaultCity.longitude, defaultCity.latitude] },
            }
          : {}),
      }).unwrap()
      const created = res?.data?.restaurant
      if (created?.status === 'pending') {
        banner.warning('Restaurant added. It is waiting for approval because “Restaurant approval” is on in Settings.')
      } else {
        banner.success('Restaurant added successfully')
      }
      close()
      if (created?._id) navigate(`/dashboard/restaurants/${created._id}?tab=general`)
    } catch (err) {
      banner.error(errorMessage(err, 'Could not add the restaurant'))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      icon={Plus}
      tone="orange"
      title="Add new restaurant"
      description="Fill in the basic details. You can add photos and more info after publishing."
    >
      <Modal.HeaderActions>
        <TranslateButton form={form} setForm={setForm} texts={TRANSLATE} onLanguageChange={setLang} />
      </Modal.HeaderActions>
      <form onSubmit={submit} noValidate>
        <div className="flex flex-col gap-3">
          <LanguageBar
            value={lang}
            onChange={setLang}
            status={translationStatus(translationEntries(form, form.translations, TEXTS))}
          />
          <LocalizedInput
            {...tr('name')}
            label="Restaurant name"
            placeholder="e.g. Sushi Palace"
            value={form.name}
            maxLength={120}
            error={errors.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }))
              setErrors((er) => ({ ...er, name: undefined }))
            }}
          />
          <Select
            label="Category"
            placeholder={metaLoading ? 'Loading…' : cuisines.length ? 'Select' : 'No cuisines in the catalog yet'}
            options={cuisines}
            value={form.cuisine}
            clearable={false}
            searchable={cuisines.length > 8}
            disabled={!cuisines.length}
            error={errors.cuisine}
            onValueChange={(cuisine) => {
              setForm((f) => ({ ...f, cuisine }))
              setErrors((er) => ({ ...er, cuisine: undefined }))
            }}
          />
          <LocalizedInput
            {...tr('address')}
            label="Location"
            placeholder="e.g. Nizami str, Baku"
            value={form.address}
            maxLength={300}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <Modal.Footer>
          <Button variant="outline" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Add & publish
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
