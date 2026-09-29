import { useRef } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react'
import { Button } from '@components'
import { getImageUrl } from '@utils'

/**
 * Ordered photo grid with move left / right, remove and an upload button (cover images,
 * menu photos). `photos` = stored paths; the first gets `firstLabel` ("Cover").
 */
export const PhotoGrid = ({
  photos = [],
  onMove,
  onRemove,
  onUpload,
  uploading = false,
  disabled = false,
  firstLabel,
  uploadLabel = 'Upload photos',
  emptyText = 'No photos yet.',
  multiple = true,
  max,
}) => {
  const inputRef = useRef(null)
  const full = max !== undefined && photos.length >= max

  return (
    <div className="flex flex-col gap-3">
      {photos.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
          {photos.map((src, i) => (
            <figure key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-subtle">
              <img src={getImageUrl(src)} alt="" className="h-full w-full object-cover" loading="lazy" />
              {i === 0 && firstLabel && (
                <span className="absolute left-1.5 top-1.5 rounded-sm bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-canvas">
                  {firstLabel}
                </span>
              )}
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-canvas transition-colors hover:bg-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {onMove && photos.length > 1 && (
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => onMove(i, i - 1)}
                        disabled={i === 0}
                        aria-label="Move left"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm disabled:opacity-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(i, i + 1)}
                        disabled={i === photos.length - 1}
                        aria-label="Move right"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm disabled:opacity-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">{emptyText}</p>
      )}
      {onUpload && (
        <div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={ImagePlus}
            loading={uploading}
            disabled={disabled || full}
            onClick={() => inputRef.current?.click()}
          >
            {uploadLabel}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              e.target.value = ''
              if (files.length) onUpload(files)
            }}
          />
        </div>
      )}
    </div>
  )
}
