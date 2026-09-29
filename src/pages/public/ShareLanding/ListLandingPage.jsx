import { Link, useParams } from 'react-router'
import { ChevronRight, Globe, ListChecks, Lock, MapPin, Star, Users, UtensilsCrossed } from 'lucide-react'
import { clsx } from 'clsx'
import { SEO, Avatar } from '@components'
import { getImageUrl } from '@utils'
import { AppCta, Chip, LandingShell, LandingSkeleton, LandingState } from './LandingShell'
import { useGetLandingListQuery } from './landingApi'
import {
  clip,
  countLabel,
  coverOf,
  dateLabel,
  deepLinks,
  errorKind,
  personName,
  priceLabelOf,
  ratingLabel,
} from './landingUtils'

const PRIVACY = {
  public: { label: 'Public list', icon: Globe, tone: 'brand' },
  collaborative: { label: 'Collaborative list', icon: Users, tone: 'info' },
  private: { label: 'Private list', icon: Lock, tone: 'neutral' },
}

// Grid position of each thumbnail for 1–4 pictures (one big tile, halves, big + two, 2×2).
const tileClass = (count, index) =>
  count === 1 ? 'col-span-2 row-span-2' : count === 2 || (count === 3 && index === 0) ? 'row-span-2' : ''

/** Cover mosaic of the first (up to 4) restaurant photos of the list. */
const Mosaic = ({ images }) => {
  const pictures = images.filter(Boolean).slice(0, 4)
  if (!pictures.length) {
    return (
      <div className="flex aspect-[2/1] items-center justify-center bg-linear-to-br from-mint to-mint-line">
        <ListChecks className="h-12 w-12 text-mint-ink" strokeWidth={1.75} />
      </div>
    )
  }
  return (
    <div className="grid aspect-[2/1] grid-cols-2 grid-rows-2 gap-0.5 bg-line">
      {pictures.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={getImageUrl(src)}
          alt=""
          loading={i ? 'lazy' : 'eager'}
          className={clsx('h-full w-full object-cover', tileClass(pictures.length, i))}
        />
      ))}
    </div>
  )
}

/** One restaurant of the list → its own landing page. */
const PlaceRow = ({ restaurant: r }) => {
  const cover = coverOf(r)
  const rating = ratingLabel(r.rating)
  const meta = [(r.cuisines || []).slice(0, 2).join(', '), priceLabelOf(r)].filter(Boolean).join(' · ')

  return (
    <li>
      <Link
        to={`/restaurant/${r.slug || r._id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none sm:px-5"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-subtle">
          {cover ? (
            <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <UtensilsCrossed className="h-6 w-6 text-ink-placeholder" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{r.name}</span>
          <span className="mt-0.5 flex items-center gap-1 text-sm">
            {rating ? (
              <>
                <Star className="h-4 w-4 fill-star text-star" />
                <span className="font-semibold text-ink-secondary">{rating}</span>
                <span className="text-ink-muted">({r.reviewCount || 0})</span>
              </>
            ) : (
              <span className="text-ink-muted">No reviews yet</span>
            )}
          </span>
          {meta && <span className="mt-0.5 block truncate text-sm text-ink-muted">{meta}</span>}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-placeholder" />
      </Link>
    </li>
  )
}

/**
 * /list/:slug — public preview of a shared favourite list (GET /favorites/share/:slug).
 * Private and deleted lists answer 404 → "private or no longer exists".
 */
export const ListLandingPage = () => {
  const { slug } = useParams()
  const { data, isLoading, isFetching, error, refetch } = useGetLandingListQuery(slug)
  const list = data?.data?.list
  const path = `/list/${slug}`

  if (isLoading) {
    return (
      <LandingShell>
        <SEO title="Shared list" path={path} noindex />
        <LandingSkeleton />
      </LandingShell>
    )
  }

  if (error || !list) {
    const kind = errorKind(error)
    return (
      <LandingShell>
        <SEO title={kind === 'notFound' ? 'List not found' : 'Shared list'} path={path} noindex />
        <LandingState
          kind={kind}
          title={kind === 'notFound' ? 'This list is private or no longer exists' : 'Could not load this list'}
          description={
            kind === 'notFound'
              ? 'Ask the person who shared it to make it public, or discover more places in the Yumio app.'
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

  const privacy = PRIVACY[list.privacy] || PRIVACY.public
  const places = (list.items || []).map((item) => item?.restaurant).filter(Boolean)
  const itemCount = Number.isFinite(list.itemCount) ? list.itemCount : places.length
  const ownerName = personName(list.owner)
  const collaborators = list.collaboratorCount || 0
  const thumbnails = list.thumbnails?.length ? list.thumbnails : places.map((r) => r.coverImages?.[0])
  const cities = [...new Set(places.map((r) => r.city).filter(Boolean))]

  return (
    <LandingShell>
      <SEO
        title={list.name}
        description={clip(
          `${list.name} — ${countLabel(itemCount, 'place')} on Yumio, a list by ${ownerName}.` +
            (places.length ? ` ${places.slice(0, 3).map((r) => r.name).join(', ')}…` : '')
        )}
        image={thumbnails[0] ? getImageUrl(thumbnails[0]) : undefined}
        path={path}
        noindex={list.privacy === 'private'}
      />

      <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <Mosaic images={thumbnails} />
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Chip icon={privacy.icon} tone={privacy.tone}>
              {privacy.label}
            </Chip>
            <Chip>{countLabel(itemCount, 'place')}</Chip>
            {cities.length === 1 && <Chip icon={MapPin}>{cities[0]}</Chip>}
          </div>

          <h1 className="mt-3 break-words font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {list.name}
          </h1>

          <div className="mt-3 flex items-center gap-2.5 text-sm text-ink-tertiary">
            <Avatar
              src={list.owner?.avatar}
              firstName={list.owner?.firstName}
              lastName={list.owner?.lastName}
              seed={list.owner?._id}
              size="sm"
            />
            <p className="min-w-0">
              by <span className="font-semibold text-ink">{ownerName}</span>
              {collaborators > 0 && ` and ${countLabel(collaborators, 'collaborator')}`}
              {list.updatedAt && (
                <span className="block text-xs text-ink-muted sm:ml-1 sm:inline">
                  <span className="hidden sm:inline">· </span>Updated {dateLabel(list.updatedAt)}
                </span>
              )}
            </p>
          </div>

          <AppCta
            className="mt-6"
            deepLink={deepLinks.list(list.shareSlug || slug)}
            hint={
              list.privacy === 'collaborative'
                ? 'Join the list in the app to add places together.'
                : 'Save the list and see every place on the map in the app.'
            }
          />
        </div>
      </article>

      <section className="mt-8" aria-labelledby="list-places">
        <h2 id="list-places" className="px-1 font-display text-lg font-bold text-ink">
          Places in this list
        </h2>
        {places.length ? (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            {places.map((r) => (
              <PlaceRow key={r._id} restaurant={r} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-line bg-surface px-5 py-8 text-center text-sm text-ink-muted">
            No places in this list yet.
          </p>
        )}
      </section>
    </LandingShell>
  )
}
