import { useState } from 'react'
import Swal from 'sweetalert2'
import { Modal, Input, Textarea, Select, Button } from '@components'
import { useCreateRestaurantMutation, useUpdateRestaurantMutation } from '@store/api'

/** Multi-select chip grid (cuisines / features). */
const ChipMulti = ({ label, options, value, onToggle }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  </div>
)

export const RestaurantFormModal = ({ restaurant, meta, onClose }) => {
  const isEdit = !!restaurant
  const [createRestaurant, { isLoading: creating }] = useCreateRestaurantMutation()
  const [updateRestaurant, { isLoading: updating }] = useUpdateRestaurantMutation()

  const coords = restaurant?.location?.coordinates || [49.8671, 40.4093]
  const [form, setForm] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    priceLevel: restaurant?.priceLevel || '$$',
    avgPrice: restaurant?.avgPrice ?? 30,
    status: restaurant?.status || 'active',
    address: restaurant?.address || '',
    city: restaurant?.city || 'Baku',
    phone: restaurant?.phone || '',
    discountPercent: restaurant?.discountPercent ?? 0,
    openNow: restaurant?.openNow ?? true,
    lng: coords[0],
    lat: coords[1],
    cuisines: restaurant?.cuisines || [],
    features: restaurant?.features || [],
    tags: (restaurant?.tags || []).join(', '),
    coverImages: (restaurant?.coverImages || []).join('\n'),
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleIn = (key) => (item) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(item) ? f[key].filter((x) => x !== item) : [...f[key], item],
    }))

  const submit = async () => {
    if (!form.name.trim()) {
      Swal.fire({ icon: 'error', text: 'Name is required' })
      return
    }
    const payload = {
      name: form.name.trim(),
      description: form.description,
      priceLevel: form.priceLevel,
      avgPrice: Number(form.avgPrice) || 0,
      status: form.status,
      address: form.address,
      city: form.city,
      phone: form.phone || null,
      discountPercent: Number(form.discountPercent) || 0,
      openNow: !!form.openNow,
      cuisines: form.cuisines,
      features: form.features,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      coverImages: form.coverImages.split('\n').map((t) => t.trim()).filter(Boolean),
      location: { type: 'Point', coordinates: [Number(form.lng), Number(form.lat)] },
    }
    try {
      if (isEdit) await updateRestaurant({ id: restaurant._id, ...payload }).unwrap()
      else await createRestaurant(payload).unwrap()
      Swal.fire({
        icon: 'success',
        title: isEdit ? 'Restaurant updated' : 'Restaurant created',
        timer: 1200,
        showConfirmButton: false,
      })
      onClose()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Save failed' })
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit restaurant' : 'Add restaurant'} size="xl">
      <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
        <Input label="Name" value={form.name} onChange={set('name')} placeholder="Restaurant name" />
        <Textarea label="Description" value={form.description} onChange={set('description')} rows={3} />

        <ChipMulti
          label="Cuisines"
          options={meta?.cuisines || []}
          value={form.cuisines}
          onToggle={toggleIn('cuisines')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Price level"
            value={form.priceLevel}
            onChange={set('priceLevel')}
            placeholder="Select"
            options={(meta?.priceLevels || []).map((p) => ({ value: p, label: p }))}
          />
          <Input label="Average price (₼)" type="number" value={form.avgPrice} onChange={set('avgPrice')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            placeholder="Select"
            options={(meta?.statuses || []).map((s) => ({ value: s, label: s }))}
          />
          <Input label="Discount %" type="number" value={form.discountPercent} onChange={set('discountPercent')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Address" value={form.address} onChange={set('address')} />
          <Input label="City" value={form.city} onChange={set('city')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Longitude" type="number" value={form.lng} onChange={set('lng')} />
          <Input label="Latitude" type="number" value={form.lat} onChange={set('lat')} />
        </div>

        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+994 ..." />

        <ChipMulti
          label="Features"
          options={meta?.features || []}
          value={form.features}
          onToggle={toggleIn('features')}
        />

        <Input label="Tags (comma-separated)" value={form.tags} onChange={set('tags')} placeholder="Local dishes, Trendy, Halal" />
        <Textarea
          label="Cover image URLs (one per line)"
          value={form.coverImages}
          onChange={set('coverImages')}
          rows={3}
          placeholder="https://...\nhttps://..."
        />
      </div>

      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="success" onClick={submit} disabled={creating || updating}>
          {isEdit ? 'Save changes' : 'Create restaurant'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
