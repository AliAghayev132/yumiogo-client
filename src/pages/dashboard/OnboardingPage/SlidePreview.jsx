import { clsx } from 'clsx'
import { IonIcon, ionToLucide } from '@components'
import { getImageUrl } from '@utils'

/**
 * Rough phone preview of one onboarding slide: the uploaded illustration (object-contain,
 * like the app) or a circle with its icon — the closest lucide glyph to the Ionicons one the
 * app draws (ionToLucide), or the icon's name when there is no match.
 */
export const SlidePreview = ({ slide, compact = false }) => {
  const hasIcon = !!slide.icon && !!ionToLucide(slide.icon)
  return (
    <div
      className={clsx(
        'border border-line bg-surface text-center',
        compact ? 'inline-block rounded-lg p-1.5' : 'rounded-2xl p-4'
      )}
    >
      <div
        className={clsx(
          'mx-auto flex items-center justify-center overflow-hidden bg-brand-soft',
          compact ? 'h-12 w-12 rounded-md' : 'h-36 w-full rounded-xl'
        )}
      >
        {slide.image ? (
          <img src={getImageUrl(slide.image)} alt="" className="h-full w-full object-contain" />
        ) : (
          <div
            className={clsx(
              'flex flex-col items-center justify-center rounded-full border border-mint-line bg-surface text-brand-hover',
              compact ? 'h-9 w-9' : 'h-20 w-20'
            )}
          >
            {hasIcon ? (
              <IonIcon
                name={slide.icon}
                className={compact ? 'h-4 w-4' : 'h-9 w-9'}
                strokeWidth={1.75}
                aria-label={`Ionicons: ${slide.icon}`}
              />
            ) : (
              <span className={clsx('break-all px-1 font-mono leading-tight', compact ? 'text-[8px]' : 'text-[11px]')}>
                {slide.icon || 'icon'}
              </span>
            )}
          </div>
        )}
      </div>
      {!compact && (
        <>
          <p className="mt-4 text-sm font-bold leading-snug text-ink">{slide.title || 'Slide title'}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{slide.subtitle || 'Subtitle'}</p>
          <div className="mt-4 rounded-full bg-primary py-2 text-xs font-semibold text-canvas">Continue</div>
        </>
      )}
    </div>
  )
}
