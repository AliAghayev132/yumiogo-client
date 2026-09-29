import { useState } from 'react'
import { Plus, Pencil, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal, Input, Textarea, SwitchRow, Button, ImageField, useBanner, errorMessage } from '@components'
import { useCreateOnboardingSlideMutation, useUpdateOnboardingSlideMutation } from '@store/api'
import { SlidePreview } from './SlidePreview'

// Ionicons names the default slides use — quick picks for the icon field.
const ICON_SUGGESTIONS = ['restaurant', 'map', 'heart', 'sparkles', 'people', 'star', 'location', 'compass']

/** Create / edit one onboarding slide. `slide` null = create. */
export const SlideFormModal = ({ slide, onClose }) => {
  const isEdit = !!slide
  const [createSlide, { isLoading: creating }] = useCreateOnboardingSlideMutation()
  const [updateSlide, { isLoading: updating }] = useUpdateOnboardingSlideMutation()
  const banner = useBanner()
  const [form, setForm] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    icon: slide?.icon || '',
    image: slide?.image || null,
    isActive: slide?.isActive ?? true,
  })
  const [titleError, setTitleError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      icon: form.icon.trim() || null,
      image: form.image || null,
      isActive: form.isActive,
    }
    if (!payload.title) return setTitleError('Title is required')

    try {
      if (isEdit) await updateSlide({ id: slide._id, ...payload }).unwrap()
      else await createSlide(payload).unwrap()
      banner.success(isEdit ? 'Slide updated' : 'Slide added')
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
      title={isEdit ? 'Edit slide' : 'Add slide'}
      description="Slides are shown in order, once, the first time the app opens."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creating || updating}>
            {isEdit ? 'Save changes' : 'Add slide'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-3">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => {
              set('title')(e)
              setTitleError('')
            }}
            placeholder="Discover your next favourite restaurant"
            error={titleError}
            autoFocus
          />
          <Textarea
            label="Subtitle"
            value={form.subtitle}
            onChange={set('subtitle')}
            rows={3}
            placeholder="One or two short sentences."
          />
          <div>
            <Input
              label="Icon"
              value={form.icon}
              onChange={set('icon')}
              placeholder="e.g. restaurant"
              helperText="Ionicons name, shown when the slide has no image."
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {ICON_SUGGESTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: name }))}
                  aria-pressed={form.icon === name}
                  className={clsx(
                    'h-[22px] rounded-sm border px-2.5 font-mono text-[11px] leading-none transition-colors',
                    form.icon === name
                      ? 'border-mint-line bg-mint text-mint-deep'
                      : 'border-line bg-canvas text-ink-tertiary hover:bg-subtle hover:text-ink'
                  )}
                >
                  {name}
                </button>
              ))}
              <a
                href="https://ionic.io/ionicons"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-1 text-xs font-medium text-brand-hover underline-offset-2 hover:underline"
              >
                All icons
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <ImageField
            label="Illustration"
            value={form.image}
            onChange={(image) => setForm((f) => ({ ...f, image }))}
            kind="content"
            hint="Optional. Replaces the icon when set."
          />
          <div className="rounded-lg border border-line bg-surface">
            <SwitchRow
              label="Active"
              description="Shown in the app's onboarding."
              checked={form.isActive}
              onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm leading-[18px] text-ink-tertiary">Preview</p>
          <SlidePreview slide={form} />
        </div>
      </div>
    </Modal>
  )
}
