import { useId, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import {
  Modal,
  Input,
  Textarea,
  Checkbox,
  Button,
  Field,
  ImageField,
  TAXONOMY_TYPES,
  useBanner,
  errorMessage,
} from '@components'
import {
  useCreateTaxonomyMutation,
  useUpdateTaxonomyMutation,
  useCreateReviewLabelMutation,
  useUpdateReviewLabelMutation,
} from '@store/api'
import { ItemVisual } from './ItemVisual'
import { PREFERENCE_TYPES, usageNoun } from './taxonomyMeta'

// Same rules as the server (adminCatalogController / adminReviewController).
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const ICON_NAME = /^[a-z0-9-]+$/

// <input type="color"> only understands #RRGGBB.
const toPickerColor = (color) => {
  if (/^#[0-9a-fA-F]{6}/.test(color)) return color.slice(0, 7)
  if (/^#[0-9a-fA-F]{3}$/.test(color)) return `#${[...color.slice(1)].map((c) => c + c).join('')}`
  return '#000000'
}

// Figma review-label headings (server defaults), offered even before any label uses them.
const DEFAULT_LABEL_GROUPS = ['Good for', 'What was wrong?']

/**
 * Create / edit one catalog item (cuisine, feature, tag, dietary option, dining option, mood,
 * report reason or review label). `item` null = create. Review labels also have a group
 * heading and are saved through /admin/review-labels (the generic catalog API has no group).
 */
export const TaxonomyFormModal = ({ type, item, groups = [], onClose }) => {
  const isEdit = !!item
  const isCuisine = type === 'cuisine'
  const isLabel = type === 'reviewLabel'
  const isPreference = PREFERENCE_TYPES.includes(type)
  const noun = usageNoun(type)
  const config = TAXONOMY_TYPES[type]
  const groupListId = useId()
  const [createTaxonomy, { isLoading: creating }] = useCreateTaxonomyMutation()
  const [updateTaxonomy, { isLoading: updating }] = useUpdateTaxonomyMutation()
  const [createLabel, { isLoading: creatingLabel }] = useCreateReviewLabelMutation()
  const [updateLabel, { isLoading: updatingLabel }] = useUpdateReviewLabelMutation()
  const saving = creating || updating || creatingLabel || updatingLabel
  const banner = useBanner()

  const [form, setForm] = useState({
    name: item?.name || '',
    group: item?.group || '',
    emoji: item?.emoji || '',
    icon: item?.icon || '',
    image: item?.image || null,
    color: item?.color || '',
    description: item?.description || '',
    isActive: item?.isActive ?? true,
    // Every existing cuisine is on the Home rail, so new ones start there too.
    showOnHome: item?.showOnHome ?? isCuisine,
    showInOnboarding: !!item?.showInOnboarding,
  })
  const [touched, setTouched] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setChecked = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }))

  const name = form.name.trim()
  const color = form.color.trim()
  const icon = form.icon.trim()
  const nameError = !name ? 'Name is required' : undefined
  const colorError = color && !HEX_COLOR.test(color) ? 'Use a hex value like #22C55E' : undefined
  const iconError = icon && !ICON_NAME.test(icon) ? 'Lowercase letters, numbers and dashes only' : undefined
  const renamed = isEdit && name && name !== item.name
  const usage = item?.usageCount || 0
  const groupOptions = [...new Set([...DEFAULT_LABEL_GROUPS, ...groups])]

  const submit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (nameError || colorError || iconError) return
    const body = {
      name,
      emoji: form.emoji.trim() || null,
      icon: icon || null,
      color: color || null,
      description: form.description.trim(),
      isActive: form.isActive,
      ...(isLabel ? { group: form.group.trim() } : { image: form.image || null }),
      ...(isCuisine ? { showOnHome: form.showOnHome } : {}),
      ...(isPreference ? { showInOnboarding: form.showInOnboarding } : {}),
    }
    try {
      let res
      if (isLabel) {
        res = isEdit ? await updateLabel({ id: item._id, ...body }).unwrap() : await createLabel(body).unwrap()
      } else {
        res = isEdit
          ? await updateTaxonomy({ id: item._id, ...body }).unwrap()
          : await createTaxonomy({ type, ...body }).unwrap()
      }
      const cascaded = res?.data?.cascaded || 0
      banner.success(
        !isEdit
          ? `${config.singular} added`
          : cascaded
            ? `${config.singular} updated — renamed in ${cascaded} ${noun}${cascaded === 1 ? '' : 's'}`
            : `${config.singular} updated`
      )
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Save failed'))
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      icon={isEdit ? Pencil : Plus}
      tone="orange"
      title={isEdit ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}
      description={
        isEdit ? `Slug: ${item.slug} (fixed after creation)` : `New ${config.label.toLowerCase()} appear in the app right away.`
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={set('name')}
          maxLength={60}
          placeholder={`${config.singular} name`}
          error={touched ? nameError : undefined}
          helperText={renamed && usage ? `Saving renames it in ${usage} ${noun}${usage === 1 ? '' : 's'}.` : undefined}
          data-autofocus
        />

        {isLabel && (
          <>
            <Input
              label="Group"
              value={form.group}
              onChange={set('group')}
              maxLength={40}
              list={groupListId}
              placeholder="e.g. Good for"
              helperText="The heading the label is listed under in the app. Leave empty for no heading."
            />
            <datalist id={groupListId}>
              {groupOptions.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Emoji" value={form.emoji} onChange={set('emoji')} maxLength={16} placeholder="Optional" />
          <Input
            label="Icon (Ionicons name)"
            value={form.icon}
            onChange={set('icon')}
            placeholder="e.g. wifi-outline"
            error={iconError}
            helperText={
              <>
                Find names at{' '}
                <a
                  href="https://ionic.io/ionicons"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-hover hover:underline"
                >
                  ionic.io/ionicons
                </a>
              </>
            }
          />
        </div>

        {!isLabel && (
          <ImageField
            label="Image"
            value={form.image}
            onChange={(image) => setForm((f) => ({ ...f, image }))}
            kind="catalog"
            hint="Optional. When set, the app shows it instead of the emoji or icon."
          />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Colour" error={colorError}>
            <div className="flex items-start gap-2">
              <input
                type="color"
                value={toPickerColor(color)}
                onChange={set('color')}
                aria-label="Pick a colour"
                className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-canvas p-1"
              />
              <Input value={form.color} onChange={set('color')} placeholder="Optional, e.g. #22C55E" aria-label="Colour" />
            </div>
          </Field>
          <Field label="Preview">
            <div className="flex h-12 items-center gap-3">
              <ItemVisual item={{ ...form, emoji: form.emoji.trim(), icon, image: isLabel ? null : form.image }} />
              <span className="inline-flex items-center gap-1.5 text-sm text-ink">
                {HEX_COLOR.test(color) && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
                {name || config.singular}
              </span>
            </div>
          </Field>
        </div>

        <Textarea label="Description" value={form.description} onChange={set('description')} rows={2} placeholder="Optional" />

        <div className="flex flex-col gap-2">
          <Checkbox
            label={
              isLabel
                ? 'Active (offered in the review "Labels & dishes" sheet)'
                : 'Active (available in the app and in the restaurant form)'
            }
            checked={form.isActive}
            onChange={setChecked('isActive')}
          />
          {isCuisine && (
            <Checkbox label="Show in the Home cuisine rail" checked={form.showOnHome} onChange={setChecked('showOnHome')} />
          )}
          {isPreference && (
            <Checkbox
              label='Offer on the onboarding "What food do you love?" page'
              checked={form.showInOnboarding}
              onChange={setChecked('showInOnboarding')}
            />
          )}
        </div>

        <Modal.Footer>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : `Add ${config.singular.toLowerCase()}`}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
