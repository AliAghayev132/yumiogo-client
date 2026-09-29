import { useState } from 'react'
import { moveItem, useBanner, errorMessage } from '@components'
import { useUploadImagesMutation } from '@store/api'
import { PhotoGrid } from './PhotoGrid'
import { EditorSection } from './EditorSection'

const MAX_COVERS = 20

/**
 * Media tab of the restaurant editor: cover images (profile header carousel; the first one
 * is the card photo) and the logo. Files upload at once; the list is saved with the form.
 * Menu photos live on the Menu tab.
 */
export const MediaTab = ({ form, setForm, disabled }) => {
  const banner = useBanner()
  const [uploadImages] = useUploadImagesMutation()
  const [uploading, setUploading] = useState(null) // 'cover' | 'logo'

  const upload = async (files, target) => {
    setUploading(target)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      const res = await uploadImages({ kind: 'restaurants', formData }).unwrap()
      return res?.data?.urls || []
    } catch (err) {
      banner.error(errorMessage(err, 'Upload failed'))
      return []
    } finally {
      setUploading(null)
    }
  }

  const addCovers = async (files) => {
    const room = MAX_COVERS - form.coverImages.length
    const urls = await upload(files.slice(0, room), 'cover')
    if (urls.length) setForm((f) => ({ ...f, coverImages: [...f.coverImages, ...urls].slice(0, MAX_COVERS) }))
  }

  const setLogo = async (files) => {
    const [url] = await upload(files.slice(0, 1), 'logo')
    if (url) setForm((f) => ({ ...f, logo: url }))
  }

  return (
    <div className="flex flex-col gap-6">
      <EditorSection
        title="Cover images"
        description={`Shown in the restaurant header carousel; the first one is the card photo. Up to ${MAX_COVERS}.`}
      >
        <PhotoGrid
          photos={form.coverImages}
          firstLabel="Cover"
          disabled={disabled}
          uploading={uploading === 'cover'}
          max={MAX_COVERS}
          onUpload={addCovers}
          onRemove={(i) => setForm((f) => ({ ...f, coverImages: f.coverImages.filter((_, idx) => idx !== i) }))}
          onMove={(from, to) => setForm((f) => ({ ...f, coverImages: moveItem(f.coverImages, from, to) }))}
          emptyText="No cover images yet — the app shows a placeholder."
        />
      </EditorSection>

      <EditorSection title="Logo" description="Optional. Square images work best.">
        <PhotoGrid
          photos={form.logo ? [form.logo] : []}
          disabled={disabled}
          uploading={uploading === 'logo'}
          multiple={false}
          uploadLabel={form.logo ? 'Replace logo' : 'Upload logo'}
          onUpload={setLogo}
          onRemove={() => setForm((f) => ({ ...f, logo: '' }))}
          emptyText="No logo."
        />
      </EditorSection>
    </div>
  )
}
