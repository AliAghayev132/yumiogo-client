import { useParams } from 'react-router'
import { BadgePercent, Clock, MapPin, Star, UtensilsCrossed, Wallet } from 'lucide-react'
import { clsx } from 'clsx'
import { SEO } from '@components'
import { AppCta, Chip, LandingShell, LandingSkeleton, LandingState } from './LandingShell'
import { useGetLandingRestaurantQuery } from './landingApi'
import { clip, countLabel, coverOf, deepLinks, errorKind, priceLabelOf, ratingLabel } from './landingUtils'

/** "Khagani Rustamov str. 5, Baku" — the city is added when the address leaves it out. */
const fullAddress = (r) => {
  const address = String(r.address || '').trim()
  if (!r.city || address.toLowerCase().includes(String(r.city).toLowerCase())) return address
  return [address, r.city].filter(Boolean).join(', ')
}

/**
 * /restaurant/:idOrSlug — public restaurant card of a shared restaurant link
 * (GET /restaurants/:id, which accepts an id or a slug).
 */
export const RestaurantLandingPage = () => {
  const { idOrSlug } = useParams()
  const { data, isLoading, isFetching, error, refetch } = useGetLandingRestaurantQuery(idOrSlug)
  const r = data?.data?.restaurant
  const path = `/restaurant/${idOrSlug}`

  if (isLoading) {
    return (
      <LandingShell>
        <SEO title="Restaurant" path={path} noindex />
        <LandingSkeleton />
      </LandingShell>
    )
  }

  if (error || !r) {
    const kind = errorKind(error)
    return (
      <LandingShell>
        <SEO title={kind === 'notFound' ? 'Restaurant not found' : 'Restaurant'} path={path} noindex />
        <LandingState
          kind={kind}
          title={kind === 'notFound' ? 'This restaurant is not on Yumio' : 'Could not load this restaurant'}
          description={
            kind === 'notFound'
              ? 'It may have been removed or the link is incomplete. Discover other places near you in the Yumio app.'
              : 'Check your connection and try again.'
          }
          onRetry={kind === 'error' ? refetch : undefined}
          retrying={isFetching}
        >
          {kind === 'notFound' && <AppCta />}
        </LandingState>
      </LandingShell>
    )
  }

  const cover = coverOf(r)
  const rating = ratingLabel(r.rating)
  const reviews = Number(r.reviewCount) || 0
  const price = priceLabelOf(r)
  const status = r.openStatus
  const address = fullAddress(r)
  const cuisines = r.cuisines || []
  const about = String(r.description || '').trim()

  return (
    <LandingShell>
      <SEO
        title={r.name}
        description={clip(about || `${r.name} on Yumio${cuisines.length ? ` — ${cuisines.join(', ')}` : ''}${address ? ` · ${address}` : ''}`)}
        image={cover || undefined}
        path={`/restaurant/${r.slug || idOrSlug}`}
      />

      <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="relative aspect-[16/10] bg-subtle sm:aspect-[2/1]">
          {cover ? (
            <img src={cover} alt={r.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-mint to-mint-line">
              <UtensilsCrossed className="h-12 w-12 text-mint-ink" strokeWidth={1.75} />
            </div>
          )}
          {r.hasDiscount && Number(r.discountPercent) > 0 && (
            <Chip icon={BadgePercent} tone="orange" className="absolute left-3 top-3 bg-surface! shadow-sm">
              {r.discountPercent}% off
            </Chip>
          )}
        </div>

        <div className="p-5 sm:p-7">
          <h1 className="break-words font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">{r.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <Star className={clsx('h-4 w-4', rating ? 'fill-star text-star' : 'text-ink-placeholder')} />
              {rating ? (
                <>
                  <span className="font-semibold text-ink">{rating}</span>
                  <span className="text-ink-muted">· {countLabel(reviews, 'review')}</span>
                </>
              ) : (
                <span className="text-ink-muted">No reviews yet</span>
              )}
            </span>
            {price && (
              <span className="inline-flex items-center gap-1 text-ink-tertiary">
                <Wallet className="h-4 w-4 text-ink-muted" /> {price}
              </span>
            )}
          </div>

          {status?.label && (
            <p
              className={clsx(
                'mt-2 inline-flex items-center gap-1.5 text-sm font-semibold',
                status.isOpen ? 'text-success' : 'text-error'
              )}
            >
              <Clock className="h-4 w-4" /> {status.label}
            </p>
          )}

          {cuisines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cuisines.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </div>
          )}

          {address && (
            <p className="mt-4 flex items-start gap-2 text-sm leading-5 text-ink-secondary">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {address}
            </p>
          )}

          <AppCta
            className="mt-6"
            deepLink={deepLinks.restaurant(r._id || idOrSlug)}
            hint="See the menu, photos and reviews, and save it to your lists in the app."
          />
        </div>
      </article>

      {about && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7" aria-labelledby="restaurant-about">
          <h2 id="restaurant-about" className="font-display text-lg font-bold text-ink">
            About
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-secondary">{about}</p>
        </section>
      )}
    </LandingShell>
  )
}
