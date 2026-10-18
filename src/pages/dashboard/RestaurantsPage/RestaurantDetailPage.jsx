import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Store, Star, Trash2, Ban, CircleAlert, Hourglass, MoreVertical, X } from 'lucide-react'
import {
  Badge,
  Banner,
  Button,
  Card,
  DropdownMenu,
  EmptyState,
  IconButton,
  Skeleton,
  StatusPill,
  Tabs,
  UnsavedBar,
  useBanner,
  errorMessage,
  formatNumber,
} from '@components'
import { useGetAdminRestaurantQuery, useUpdateRestaurantMutation, useGetMetaQuery, useGetCatalogQuery } from '@store/api'
import { getImageUrl, formatDateTime } from '@utils'
import { useRestaurantActions } from './useRestaurantActions'
import { DETAIL_TABS, priceLabel, toPriceLevels } from './restaurantMeta'
import { toForm, toPayload, sameForm } from './restaurantForm'
import { OverviewTab } from './OverviewTab'
import { GeneralTab } from './GeneralTab'
import { HoursTab } from './HoursTab'
import { MediaTab } from './MediaTab'
import { MenuTab } from './MenuTab'

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()

/**
 * ⋮ menu: the transitions the server allows beyond the header buttons
 * (ModerationService.moderateRestaurant: reject pending / active / suspended, suspend active /
 * pending; PATCH /status for "back to pending").
 */
const moreItems = (r, actions) => {
  const items = []
  if (['active', 'suspended'].includes(r.status)) items.push({ label: 'Reject…', icon: X, onSelect: () => actions.reject(r) })
  if (r.status === 'pending') items.push({ label: 'Suspend…', icon: Ban, onSelect: () => actions.suspend(r) })
  if (r.status !== 'pending') items.push({ label: 'Move to pending', icon: Hourglass, onSelect: () => actions.toPending(r) })
  return items
}

const Header = ({ r, actions, onPurged }) => {
  const trash = r.isDeleted
  const reviewed = r.reviewCount > 0
  const more = trash ? [] : moreItems(r, actions)
  return (
    <Card padding="sm" className="flex flex-wrap items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-subtle">
        {r.coverImages?.[0] || r.logo ? (
          <img src={getImageUrl(r.coverImages?.[0] || r.logo)} alt="" className="h-full w-full object-cover" />
        ) : (
          <Store className="h-6 w-6 text-ink-disabled" />
        )}
      </div>
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-medium leading-8 text-ink">{r.name}</h2>
          {trash ? <Badge tone="error" size="sm">In trash</Badge> : <StatusPill status={r.status} entity="restaurant" />}
          {r.temporarilyClosed && !trash && <Badge tone="warning" size="sm">Temporarily closed</Badge>}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
          {r.cuisines?.length > 0 && <span>{r.cuisines.join(', ')}</span>}
          {(r.address || r.city) && <span>· {[r.address, r.city].filter(Boolean).join(', ')}</span>}
          <span className="inline-flex items-center gap-1">
            · <Star className="h-3.5 w-3.5 fill-star text-star" />
            {reviewed ? `${Number(r.rating || 0).toFixed(1)} (${formatNumber(r.reviewCount)})` : 'No reviews'}
          </span>
          {priceLabel(r) && <span>· {priceLabel(r)}</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {trash ? (
          <>
            <Button size="sm" variant="success" onClick={() => actions.restore(r)}>
              Restore
            </Button>
            <Button
              size="sm"
              variant="soft-danger"
              leftIcon={Trash2}
              onClick={async () => {
                if (await actions.purge(r)) onPurged?.()
              }}
            >
              Remove permanently
            </Button>
          </>
        ) : (
          <>
            {r.status === 'pending' && (
              <>
                <Button size="sm" variant="success" onClick={() => actions.approve(r)}>
                  Approve & publish
                </Button>
                <Button size="sm" variant="soft-danger" onClick={() => actions.reject(r)}>
                  Reject
                </Button>
              </>
            )}
            {r.status === 'rejected' && (
              <Button size="sm" variant="success" onClick={() => actions.approve(r)}>
                Approve & publish
              </Button>
            )}
            {['suspended', 'closed'].includes(r.status) && (
              <Button size="sm" variant="success" onClick={() => actions.restore(r)}>
                Restore
              </Button>
            )}
            {r.status === 'active' && (
              <Button size="sm" variant="outline" leftIcon={Ban} onClick={() => actions.suspend(r)}>
                Suspend
              </Button>
            )}
            <IconButton icon={Trash2} label="Remove restaurant" tone="danger" variant="secondary" onClick={() => actions.remove(r)} />
            {more.length > 0 && (
              <DropdownMenu
                trigger={<IconButton icon={MoreVertical} label="More moderation actions" variant="secondary" />}
                items={more}
              />
            )}
          </>
        )}
      </div>
    </Card>
  )
}

/**
 * The editable part (General / Hours / Media tabs) keeps its own form state so edits survive
 * switching tabs; the floating bar saves them in one PUT /restaurants/:id.
 */
const Workspace = ({ data, tab, setTab }) => {
  const { restaurant } = data
  const banner = useBanner()
  const navigate = useNavigate()
  const actions = useRestaurantActions()
  const { data: metaData, isError: metaError, refetch: refetchMeta } = useGetMetaQuery()
  const { data: catalogData } = useGetCatalogQuery()
  const [updateRestaurant, { isLoading: saving }] = useUpdateRestaurantMutation()
  const [initial, setInitial] = useState(() => toForm(restaurant))
  const [form, setForm] = useState(initial)
  // Language of the translatable General fields (en | az | ru).
  const [lang, setLang] = useState('en')

  const meta = metaData?.data
  const catalog = catalogData?.data || null
  const priceLevels = toPriceLevels(meta?.priceLevels || [])
  const trash = !!restaurant.isDeleted
  const dirty = !sameForm(form, initial)

  // Closing / reloading the tab with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = async () => {
    const { payload, error, tab: errorTab } = toPayload(form, { priceLevels })
    if (error) {
      if (errorTab && errorTab !== tab) setTab(errorTab)
      if (!form.name.trim()) setLang('en')
      banner.error(error)
      return
    }
    try {
      const res = await updateRestaurant({ id: restaurant._id, ...payload }).unwrap()
      const next = toForm(res?.data?.restaurant || { ...restaurant, ...payload })
      setInitial(next)
      setForm(next)
      banner.success('Restaurant updated successfully')
    } catch (err) {
      banner.error(errorMessage(err, 'Save failed'))
    }
  }

  const editing = ['general', 'hours', 'media'].includes(tab)
  const reasonTone = restaurant.status === 'rejected' ? 'error' : 'warning'

  return (
    <div className="flex flex-col gap-6">
      <Header
        r={restaurant}
        actions={actions}
        onPurged={() => navigate('/dashboard/restaurants?status=trash', { replace: true })}
      />

      {trash && (
        <Banner tone="error">
          This restaurant is in Trash and hidden from the app. Restore it to edit its details and menu.
        </Banner>
      )}
      {!trash && ['rejected', 'suspended', 'closed'].includes(restaurant.status) && (
        <Banner tone={reasonTone}>
          {{ rejected: 'Rejected', suspended: 'Suspended', closed: 'Closed' }[restaurant.status]}
          {restaurant.moderatedBy ? ` by ${fullName(restaurant.moderatedBy)}` : ''}
          {restaurant.moderatedAt ? ` on ${formatDateTime(restaurant.moderatedAt)}` : ''}
          {restaurant.statusReason ? `. Reason: ${restaurant.statusReason}` : '.'}
        </Banner>
      )}

      <Tabs
        variant="underline"
        items={DETAIL_TABS.map((t) => ({ ...t, disabled: trash && t.value !== 'overview' }))}
        value={tab}
        onChange={setTab}
        aria-label="Restaurant sections"
        className="overflow-x-auto"
      />

      {tab === 'overview' && <OverviewTab {...data} />}

      {editing &&
        (!meta ? (
          metaError ? (
            <Card>
              <EmptyState
                icon={CircleAlert}
                title="Could not load the form options"
                action={
                  <Button size="sm" variant="outline" onClick={refetchMeta}>
                    Retry
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card className="flex flex-col gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Card>
          )
        ) : (
          <>
            {tab === 'general' && (
              <GeneralTab
                form={form}
                setForm={setForm}
                restaurant={restaurant}
                meta={meta}
                catalog={catalog}
                priceLevels={priceLevels}
                disabled={trash}
                lang={lang}
                setLang={setLang}
              />
            )}
            {tab === 'hours' && (
              <HoursTab form={form} setForm={setForm} restaurant={restaurant} timezone={catalog?.config?.timezone} disabled={trash} />
            )}
            {tab === 'media' && <MediaTab form={form} setForm={setForm} disabled={trash} />}
          </>
        ))}

      {tab === 'menu' && <MenuTab restaurantId={restaurant._id} meta={meta} disabled={trash} />}

      <UnsavedBar visible={dirty && !trash} saving={saving} onSave={save} onDiscard={() => setForm(initial)} />
    </div>
  )
}

/**
 * Restaurant page (/dashboard/restaurants/:id?tab=overview|general|hours|media|menu): header
 * with the moderation actions, detail overview and the full editor incl. the menu.
 */
export const RestaurantDetailPage = () => {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab')
  const tab = DETAIL_TABS.some((t) => t.value === rawTab) ? rawTab : 'overview'
  const { data, isLoading, isError, error, refetch } = useGetAdminRestaurantQuery(id)

  const setTab = (value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === 'overview') next.delete('tab')
        else next.set('tab', value)
        return next
      },
      { replace: true }
    )

  const back = (
    <Link to="/dashboard/restaurants" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> All restaurants
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Card padding="sm" className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3.5 w-80" />
          </div>
        </Card>
      </div>
    )
  }

  if (isError || !data?.data?.restaurant) {
    const missing = error?.status === 404 || error?.status === 400
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Card>
          <EmptyState
            icon={missing ? Store : CircleAlert}
            title={missing ? 'Restaurant not found' : 'Could not load this restaurant'}
            description={missing ? 'It may have been deleted.' : 'Check your connection and try again.'}
            action={
              !missing && (
                <Button size="sm" variant="outline" onClick={refetch}>
                  Retry
                </Button>
              )
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {back}
      <Workspace key={id} data={data.data} tab={tab} setTab={setTab} />
    </div>
  )
}
