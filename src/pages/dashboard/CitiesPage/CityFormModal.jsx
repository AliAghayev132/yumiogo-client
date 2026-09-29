import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Modal, Input, SwitchRow, Button, useBanner, errorMessage } from '@components'
import { useCreateCityMutation, useUpdateCityMutation } from '@store/api'

// The server fills the label as "<name>, <country>" when it is left empty.
const autoLabel = (name, country) => [name, country].filter(Boolean).join(', ')

const inRange = (value, min, max) => {
  if (value === '' || value === null) return false
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max
}

/**
 * Create / edit a city. `city` null = create; `defaultCountry` pre-fills the
 * country for new cities (taken from the current default city).
 */
export const CityFormModal = ({ city, defaultCountry = '', onClose }) => {
  const isEdit = !!city
  const [createCity, { isLoading: creating }] = useCreateCityMutation()
  const [updateCity, { isLoading: updating }] = useUpdateCityMutation()
  const banner = useBanner()

  const [form, setForm] = useState({
    name: city?.name || '',
    // An auto-generated label is left empty so it follows renames.
    label: city && city.label !== autoLabel(city.name, city.country) ? city.label : '',
    country: city ? city.country || '' : defaultCountry,
    latitude: city?.latitude ?? '',
    longitude: city?.longitude ?? '',
    isDefault: city?.isDefault ?? false,
    isActive: city?.isActive ?? true,
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setFlag = (key) => (checked) => setForm((f) => ({ ...f, [key]: checked }))

  const latOk = inRange(form.latitude, -90, 90)
  const lngOk = inRange(form.longitude, -180, 180)
  const renamed = isEdit && form.name.trim() && form.name.trim() !== city.name
  const usage = city?.usageCount || 0
  const mapUrl =
    latOk && lngOk
      ? `https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=12/${form.latitude}/${form.longitude}`
      : null

  const submit = async () => {
    const name = form.name.trim()
    const country = form.country.trim()
    if (!name || !country) {
      banner.error(name ? 'Country is required' : 'Name is required')
      return
    }
    if (!latOk || !lngOk) {
      banner.error('Latitude must be between -90 and 90 and longitude between -180 and 180')
      return
    }
    if (form.isDefault && !form.isActive) {
      banner.error('The default city must be active')
      return
    }
    const body = {
      name,
      label: form.label.trim(),
      country,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      isDefault: form.isDefault,
      isActive: form.isActive,
    }
    try {
      if (isEdit) {
        const res = await updateCity({ id: city._id, ...body }).unwrap()
        const cascaded = res?.data?.cascaded || 0
        banner.success(
          cascaded ? `City updated — renamed in ${cascaded} restaurant${cascaded === 1 ? '' : 's'}` : 'City updated'
        )
      } else {
        await createCity(body).unwrap()
        banner.success('City added')
      }
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Save failed'))
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      icon={isEdit ? Pencil : Plus}
      tone="orange"
      title={isEdit ? 'Edit city' : 'Add city'}
      description={
        isEdit
          ? 'Changes show in the app and in the restaurant form right away.'
          : "Add a city to the app's location picker and the restaurant form."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creating || updating}>
            {isEdit ? 'Save changes' : 'Add city'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={set('name')}
            maxLength={80}
            placeholder="City name"
            helperText={
              renamed && usage
                ? `Saving moves ${usage} restaurant${usage === 1 ? '' : 's'} to the new name.`
                : 'Stored on restaurants as their city.'
            }
          />
          <Input label="Country" value={form.country} onChange={set('country')} placeholder="Country" />
        </div>

        <Input
          label="Label"
          value={form.label}
          onChange={set('label')}
          placeholder={autoLabel(form.name.trim(), form.country.trim()) || 'City, Country'}
          helperText="Shown in the app's location picker. Leave empty to use “Name, Country”."
        />

        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={set('latitude')}
              error={form.latitude !== '' && !latOk ? 'Between -90 and 90' : undefined}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={set('longitude')}
              error={form.longitude !== '' && !lngOk ? 'Between -180 and 180' : undefined}
            />
          </div>
          <p className="mt-1.5 text-xs leading-4 text-ink-muted">
            The city centre. The app uses it as the default search point, and new restaurants in this
            city start there.
            {mapUrl && (
              <>
                {' '}
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-hover underline-offset-2 hover:underline"
                >
                  Check on the map
                </a>
              </>
            )}
          </p>
        </div>

        <div className="divide-y divide-line rounded-lg border border-line bg-surface">
          <SwitchRow
            label="Default city"
            description="Used when the user hasn't picked a location."
            checked={form.isDefault}
            onChange={setFlag('isDefault')}
          />
          <SwitchRow
            label="Active"
            description="Shown in the app and in the restaurant form."
            checked={form.isActive}
            onChange={setFlag('isActive')}
          />
        </div>
      </div>
    </Modal>
  )
}
