import { useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { Upload, Loader2, X, Plus, Trash2 } from 'lucide-react'
import { Modal, Input, Textarea, Select, Button } from '@components'
import {
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useUploadImagesMutation,
} from '@store/api'
import { getImageUrl } from '@utils'

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
  const [uploadImages, { isLoading: uploading }] = useUploadImagesMutation()

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
  })
  const [coverImages, setCoverImages] = useState(restaurant?.coverImages || [])
  const [logo, setLogo] = useState(restaurant?.logo || '')
  const [dishes, setDishes] = useState(
    (restaurant?.popularDishes || []).map((d) => ({
      name: d.name || '',
      price: d.price ?? '',
      image: d.image || '',
    }))
  )

  // Which upload triggered the spinner: 'cover' | 'logo' | `dish-${index}`
  const [uploadTarget, setUploadTarget] = useState(null)
  const coverInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const dishInputRef = useRef(null)
  const dishIndexRef = useRef(0)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleIn = (key) => (item) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(item) ? f[key].filter((x) => x !== item) : [...f[key], item],
    }))

  /** Upload files to /uploads/restaurants and return the relative paths (or null on failure). */
  const uploadFiles = async (files, target) => {
    if (!files?.length) return null
    setUploadTarget(target)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('files', file))
      const res = await uploadImages({ kind: 'restaurants', formData }).unwrap()
      return res.data.urls
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Upload failed' })
      return null
    } finally {
      setUploadTarget(null)
    }
  }

  const onCoverFiles = async (e) => {
    const urls = await uploadFiles(e.target.files, 'cover')
    e.target.value = ''
    if (urls) setCoverImages((imgs) => [...imgs, ...urls])
  }

  const onLogoFile = async (e) => {
    const urls = await uploadFiles(e.target.files, 'logo')
    e.target.value = ''
    if (urls?.length) setLogo(urls[0])
  }

  const onDishFile = async (e) => {
    const idx = dishIndexRef.current
    const urls = await uploadFiles(e.target.files, `dish-${idx}`)
    e.target.value = ''
    if (urls?.length)
      setDishes((rows) => rows.map((d, i) => (i === idx ? { ...d, image: urls[0] } : d)))
  }

  const setDish = (idx, key) => (e) =>
    setDishes((rows) => rows.map((d, i) => (i === idx ? { ...d, [key]: e.target.value } : d)))
  const addDish = () => setDishes((rows) => [...rows, { name: '', price: '', image: '' }])
  const removeDish = (idx) => setDishes((rows) => rows.filter((_, i) => i !== idx))

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
      coverImages,
      logo: logo || null,
      popularDishes: dishes
        .filter((d) => d.name.trim())
        .map((d) => ({ name: d.name.trim(), price: Number(d.price) || 0, image: d.image })),
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

        {/* Cover images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cover images</label>
          {!!coverImages.length && (
            <div className="flex flex-wrap gap-3 mb-3">
              {coverImages.map((img, idx) => (
                <div key={`${img}-${idx}`} className="relative">
                  <img
                    src={getImageUrl(img)}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCoverImages((imgs) => imgs.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => coverInputRef.current?.click()}
            leftIcon={
              uploadTarget === 'cover' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )
            }
          >
            Upload images
          </Button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onCoverFiles}
          />
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo (optional)</label>
          <div className="flex items-center gap-3">
            {logo && (
              <div className="relative">
                <img
                  src={getImageUrl(logo)}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setLogo('')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => logoInputRef.current?.click()}
              leftIcon={
                uploadTarget === 'logo' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )
              }
            >
              {logo ? 'Replace logo' : 'Upload logo'}
            </Button>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onLogoFile}
          />
        </div>

        {/* Popular dishes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Popular dishes</label>
          <div className="space-y-2">
            {dishes.map((dish, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input value={dish.name} onChange={setDish(idx, 'name')} placeholder="Dish name" />
                </div>
                <div className="w-24">
                  <Input type="number" value={dish.price} onChange={setDish(idx, 'price')} placeholder="₼" />
                </div>
                {dish.image && (
                  <img
                    src={getImageUrl(dish.image)}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={() => {
                    dishIndexRef.current = idx
                    dishInputRef.current?.click()
                  }}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  {uploadTarget === `dish-${idx}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDish(idx)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addDish}
            leftIcon={<Plus className="w-4 h-4" />}
            className={dishes.length ? 'mt-3' : undefined}
          >
            Add dish
          </Button>
          <input
            ref={dishInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onDishFile}
          />
        </div>
      </div>

      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="success" onClick={submit} disabled={creating || updating || uploading}>
          {isEdit ? 'Save changes' : 'Create restaurant'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
