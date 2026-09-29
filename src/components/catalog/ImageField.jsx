import { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { useBanner } from '../feedback/context'
import { errorMessage } from '../feedback/errorMessage'
import { useUploadImagesMutation } from '@store/api'
import { getImageUrl } from '@utils'

/**
 * Single-image upload field for catalog / content records.
 * Uploads to /uploads/:kind and hands the stored relative path
 * ("uploads/catalog/...") to onChange; the remove button sets it to null.
 * Upload errors show as a useBanner() error (inside the open modal).
 */
export const ImageField = ({ label, value, onChange, kind = 'catalog', hint, disabled = false }) => {
  const [uploadImages, { isLoading: uploading }] = useUploadImagesMutation()
  const inputRef = useRef(null)
  const banner = useBanner()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('files', file)
      const res = await uploadImages({ kind, formData }).unwrap()
      if (res.data.urls?.length) onChange(res.data.urls[0])
    } catch (err) {
      banner.error(errorMessage(err, 'Upload failed'))
    }
  }

  return (
    <div>
      {label && <label className="mb-2 block text-sm leading-[18px] text-ink-tertiary">{label}</label>}
      <div className="flex items-center gap-3">
        {value && (
          <div className="relative">
            <img src={getImageUrl(value)} alt="" className="h-20 w-20 rounded-lg border border-line object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
              title="Remove image"
              aria-label="Remove image"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white hover:bg-danger-hover disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          loading={uploading}
          onClick={() => inputRef.current?.click()}
          leftIcon={Upload}
        >
          {value ? 'Replace image' : 'Upload image'}
        </Button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  )
}
