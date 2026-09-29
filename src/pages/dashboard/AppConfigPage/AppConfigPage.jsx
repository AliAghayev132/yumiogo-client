import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  LifeBuoy,
  LayoutList,
  Sparkles,
  SlidersHorizontal,
  ArrowDownUp,
  Coins,
  Bell,
  Smile,
  TrendingUp,
  ThumbsUp,
  Smartphone,
  Settings as SettingsIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  Button,
  Card,
  EmptyState,
  ImageField,
  Input,
  OrderButtons,
  Skeleton,
  Switch,
  Textarea,
  UnsavedBar,
  moveItem,
  useBanner,
  errorMessage,
} from '@components'
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from '@store/api'
import { ConfigCard, SubHeading, KeyChip, NumberListField, VisibilityLabel } from './ConfigFields'
import {
  HOME_SECTION_META,
  SORT_KEY_HINTS,
  TRENDING_KEY_HINTS,
  RECOMMENDATION_KEY_HINTS,
  NOTIFICATION_KEY_HINTS,
  SENTIMENT_KEY_HINTS,
  SURPRISE_GROUPS,
  APP_LINK_KEYS,
  formatMetres,
  toNum,
  toForm,
  toPayload,
  changedFields,
  validate,
} from './settingsForm'

// IANA zones for the timezone suggestions (older browsers just get a text field).
const TIMEZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []

const SECTIONS = [
  { id: 'support', label: 'Support & contacts' },
  { id: 'app', label: 'App stores & invites' },
  { id: 'home', label: 'Home layout' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'surprise', label: 'Surprise me' },
  { id: 'filters', label: 'Search & filters' },
  { id: 'sort', label: 'Sort options' },
  { id: 'trending', label: 'Trending this month' },
  { id: 'price-levels', label: 'Price levels' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'sentiments', label: 'Review sentiments' },
]

// Store link fields (Settings.appLinks).
const APP_LINK_META = {
  ios: { label: 'App Store link', placeholder: 'https://apps.apple.com/app/yumio/id…' },
  android: { label: 'Google Play link', placeholder: 'https://play.google.com/store/apps/details?id=…' },
}

const FILTER_LABELS = {
  priceMin: 'Minimum price',
  priceMax: 'Maximum price',
  priceStep: 'Price step',
  defaultRadius: 'Default radius',
  maxRadius: 'Maximum radius',
}

// "homeSections.3.limit" → "Home layout · Top this week" (for the error banner).
const describePath = (path, form) => {
  const [group, index, field] = path.split('.')
  const row = form[group]?.[index]
  switch (group) {
    case 'timezone':
      return 'Timezone'
    case 'filters':
      return index === 'distanceLabels'
        ? `Search & filters · label for ${formatMetres(field)}`
        : `Search & filters · ${FILTER_LABELS[index] || index}`
    case 'eta':
      return index === 'speedKmh' ? 'Travel time · Speed' : 'Travel time · Road factor'
    case 'appLinks':
      return `App stores · ${APP_LINK_META[index]?.label || index}`
    case 'inviteGoal':
      return 'Invites · Friends to invite'
    case 'surprise':
      return 'Surprise me copy'
    case 'homeSections':
      return `Home layout · ${HOME_SECTION_META[row?.key]?.label || row?.key}${field === 'limit' ? ' (items)' : ''}`
    case 'sortOptions':
      return row ? `Sort options · ${row.key}` : 'Sort options'
    case 'trendingOptions':
      return `Trending this month · ${row?.key}`
    case 'recommendations':
      return `Recommendations · ${row?.key}`
    case 'priceLevels':
      return `Price levels · ${row?.key}${field === 'maxPrice' ? ' (up to)' : ''}`
    case 'notificationOptions':
      return `Notification settings · ${NOTIFICATION_KEY_HINTS[row?.key] || row?.key}`
    case 'sentiments':
      return `Review sentiments · ${row?.key}`
    default:
      return path
  }
}

const LoadingState = () => (
  <div className="flex max-w-5xl flex-col gap-6">
    {[0, 1, 2].map((i) => (
      <Card key={i} padding="none">
        <div className="border-b border-line px-[18px] py-5">
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-[18px] sm:grid-cols-2">
          {[0, 1, 2, 3].map((j) => (
            <Skeleton key={j} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    ))}
  </div>
)

/**
 * App config & Home — the Settings fields the mobile app reads from GET /api/catalog: support
 * contacts, Home sections, recommendation tiles, Surprise me copy, search filters and travel
 * times, sort options (with their explanations), the Trending sheet, price levels (with their
 * price bands), notification copy and review sentiments. Keys are fixed; only labels / order /
 * visibility change. Platform name and support email are edited in Settings.
 */
export const AppConfigPage = () => {
  const { data, isLoading, isError, refetch } = useGetAdminSettingsQuery()
  const settings = data?.data?.settings

  if (isLoading) return <LoadingState />
  if (isError || !settings) {
    return (
      <Card className="max-w-lg">
        <EmptyState
          icon={SettingsIcon}
          title="Could not load the app settings"
          action={
            <Button size="sm" variant="outline" onClick={refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  // Re-mount with fresh state whenever a newer version of the settings is loaded.
  return <AppConfigForm key={settings.updatedAt} settings={settings} />
}

const AppConfigForm = ({ settings }) => {
  const [updateSettings, { isLoading: saving }] = useUpdateAdminSettingsMutation()
  const [form, setForm] = useState(() => toForm(settings))
  const banner = useBanner()
  // The "fix these fields" banner is sticky: replace it on the next save attempt.
  const errorBanner = useRef(null)

  const original = useMemo(() => toPayload(toForm(settings)), [settings])
  const changes = useMemo(() => changedFields(toPayload(form), original), [form, original])
  const errors = useMemo(() => validate(form), [form])
  const dirty = Object.keys(changes).length > 0

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // ----- updaters -----
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setGroup = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }))
  const setDistanceLabel = (metres, label) =>
    setForm((f) => ({
      ...f,
      filters: { ...f.filters, distanceLabels: { ...f.filters.distanceLabels, [String(metres)]: label } },
    }))
  const setRow = (list, index, patch) =>
    setForm((f) => ({
      ...f,
      [list]: f[list].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }))
  const moveRow = (list) => (from, to) => setForm((f) => ({ ...f, [list]: moveItem(f[list], from, to) }))

  const discard = () => setForm(toForm(settings))

  const save = async () => {
    // Only problems in the sections being saved block the save (the server
    // validates just the fields it receives).
    const blocking = Object.entries(errors).filter(([path]) => path.split('.')[0] in changes)
    if (errorBanner.current) banner.dismiss(errorBanner.current)
    errorBanner.current = null
    if (blocking.length) {
      errorBanner.current = banner.error(
        <ul className="list-disc pl-5">
          {blocking.slice(0, 8).map(([path, message]) => (
            <li key={path}>
              <b>{describePath(path, form)}</b>: {message}
            </li>
          ))}
        </ul>,
        { title: 'Please fix these fields' }
      )
      return
    }
    try {
      await updateSettings(changes).unwrap()
      banner.success('The app shows the new values the next time it loads the catalog.', {
        title: 'App config saved',
      })
    } catch (err) {
      errorBanner.current = banner.error(errorMessage(err, 'Save failed'), { title: 'Could not save' })
    }
  }

  const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const f = form.filters

  return (
    <div className={clsx('flex max-w-5xl flex-col gap-6', dirty && 'pb-20')}>
      {/* Jump links */}
      <nav aria-label="Sections" className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => jumpTo(s.id)}
            className="h-8 rounded-md border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-subtle"
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ───────── Support & contacts ───────── */}
      <ConfigCard
        id="support"
        icon={LifeBuoy}
        title="Support & contacts"
        description="Shown on the app's Help & support screen and the website."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-ink-secondary sm:col-span-2">
            <span className="font-semibold text-ink">{settings.appName}</span> · {settings.supportEmail}
            <span className="text-ink-muted">
              {' '}
              — the platform name and support email are edited in{' '}
              <Link to="/dashboard/settings" className="font-semibold text-brand-hover hover:underline">
                Settings
              </Link>
              .
            </span>
          </div>
          <Input
            label="Support phone"
            value={form.supportPhone}
            onChange={setField('supportPhone')}
            placeholder="+994 12 345 67 89"
            helperText="Optional — hidden in the app when empty."
          />
          <Input label="Company address" value={form.companyAddress} onChange={setField('companyAddress')} />
          <div className="sm:col-span-2">
            <Input
              label="Reply time note"
              value={form.supportReplyNote}
              onChange={setField('supportReplyNote')}
              placeholder="We usually reply within a day."
              helperText="Shown next to the contact options."
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Timezone"
              list="app-config-timezones"
              value={form.timezone}
              onChange={setField('timezone')}
              error={errors.timezone}
              helperText="IANA name, e.g. Asia/Baku. Used to work out “Open now” from opening hours."
            />
            <datalist id="app-config-timezones">
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
          </div>
        </div>
      </ConfigCard>

      {/* ───────── App stores & invites ───────── */}
      <ConfigCard
        id="app"
        icon={Smartphone}
        title="App stores & invites"
        description="Store listings used by the website's download buttons and the Cookies page badges, and the Feed invite goal."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {APP_LINK_KEYS.map((key) => (
            <Input
              key={key}
              type="url"
              label={APP_LINK_META[key].label}
              value={form.appLinks[key]}
              onChange={(e) => setGroup('appLinks', key, e.target.value)}
              placeholder={APP_LINK_META[key].placeholder}
              error={errors[`appLinks.${key}`]}
              helperText="Leave empty until the app is published — the website then shows “Coming soon”."
            />
          ))}
          <Input
            type="number"
            min={1}
            max={20}
            step={1}
            label="Friends to invite"
            value={form.inviteGoal}
            onChange={setField('inviteGoal')}
            error={errors.inviteGoal}
            helperText="The goal of the Feed “Invite friends 0/3” card (1–20)."
          />
        </div>
      </ConfigCard>

      {/* ───────── Home layout ───────── */}
      <ConfigCard
        id="home"
        icon={LayoutList}
        title="Home layout"
        description={
          <>
            The sections of the app's Home screen, top to bottom. Hidden sections are skipped. Put{' '}
            <KeyChip>{'{maxDiscount}'}</KeyChip> in a title to show the biggest current discount — “Up to{' '}
            {'{maxDiscount}'}% off” appears as “Up to 50% off”.
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {form.homeSections.map((section, i) => {
            const meta = HOME_SECTION_META[section.key] || { label: section.key }
            const path = `homeSections.${i}`
            return (
              <div
                key={section.key}
                className={clsx(
                  'rounded-xl border p-4 transition-colors',
                  section.isActive ? 'border-line bg-surface' : 'border-dashed border-line bg-canvas'
                )}
              >
                <div className="flex items-center gap-3">
                  <OrderButtons index={i} count={form.homeSections.length} onMove={moveRow('homeSections')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {meta.label} <KeyChip>{section.key}</KeyChip>
                    </p>
                    {meta.hint && <p className="text-xs text-ink-muted">{meta.hint}</p>}
                  </div>
                  <VisibilityLabel active={section.isActive} />
                  <Switch
                    checked={section.isActive}
                    onChange={(isActive) => setRow('homeSections', i, { isActive })}
                    label={`Show ${meta.label}`}
                  />
                </div>

                <div className={clsx('mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2', !section.isActive && 'opacity-60')}>
                  <div className="sm:col-span-2">
                    <Input
                      label="Title"
                      value={section.title}
                      onChange={(e) => setRow('homeSections', i, { title: e.target.value })}
                      error={errors[`${path}.title`]}
                    />
                  </div>
                  <Input
                    label="Subtitle"
                    value={section.subtitle}
                    onChange={(e) => setRow('homeSections', i, { subtitle: e.target.value })}
                    placeholder="Optional"
                  />
                  <Input
                    label="Button label"
                    value={section.ctaLabel}
                    onChange={(e) => setRow('homeSections', i, { ctaLabel: e.target.value })}
                    placeholder="Optional"
                  />
                  {meta.tabs?.map((tabLabel, t) => (
                    <Input
                      key={tabLabel}
                      label={tabLabel}
                      value={section.tabLabels[t] ?? ''}
                      onChange={(e) =>
                        setRow('homeSections', i, {
                          tabLabels: meta.tabs.map((_, k) => (k === t ? e.target.value : section.tabLabels[k] ?? '')),
                        })
                      }
                      error={errors[`${path}.tabLabels.${t}`]}
                    />
                  ))}
                  {!meta.noLimit && (
                    <Input
                      label="Items shown"
                      type="number"
                      min="1"
                      max="50"
                      step="1"
                      value={section.limit}
                      onChange={(e) => setRow('homeSections', i, { limit: e.target.value })}
                      error={errors[`${path}.limit`]}
                      helperText="1–50"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ConfigCard>

      {/* ───────── Recommendations ───────── */}
      <ConfigCard
        id="recommendations"
        icon={ThumbsUp}
        title="Recommendations"
        description="The tiles of the Home “Recommends” rail and Search “Popular also search for”, in this order. Each opens its restaurant collection; empty collections are skipped."
      >
        <div className="flex flex-col gap-3">
          {form.recommendations.map((tile, i) => (
            <div
              key={tile.key}
              className={clsx(
                'rounded-xl border p-4',
                tile.isActive ? 'border-line bg-surface' : 'border-dashed border-line bg-canvas'
              )}
            >
              <div className="flex items-center gap-3">
                <OrderButtons index={i} count={form.recommendations.length} onMove={moveRow('recommendations')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {tile.title || tile.key} <KeyChip>{tile.key}</KeyChip>
                  </p>
                  <p className="text-xs text-ink-muted">{RECOMMENDATION_KEY_HINTS[tile.key]}</p>
                </div>
                <VisibilityLabel active={tile.isActive} />
                <Switch
                  checked={tile.isActive}
                  onChange={(isActive) => setRow('recommendations', i, { isActive })}
                  label={`Show ${tile.title || tile.key}`}
                />
              </div>
              <div
                className={clsx(
                  'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]',
                  !tile.isActive && 'opacity-60'
                )}
              >
                <div className="flex flex-col gap-3">
                  <Input
                    label="Title"
                    value={tile.title}
                    onChange={(e) => setRow('recommendations', i, { title: e.target.value })}
                    error={errors[`recommendations.${i}.title`]}
                  />
                  <Textarea
                    label="Description"
                    rows={2}
                    value={tile.description}
                    onChange={(e) => setRow('recommendations', i, { description: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <ImageField
                  label="Image"
                  value={tile.image}
                  onChange={(image) => setRow('recommendations', i, { image })}
                  kind="catalog"
                  hint={tile.key === 'trending' ? 'Optional — a live collage is used when empty.' : 'Tile photo.'}
                />
              </div>
            </div>
          ))}
        </div>
      </ConfigCard>

      {/* ───────── Surprise me ───────── */}
      <ConfigCard
        id="surprise"
        icon={Sparkles}
        title="Surprise me copy"
        description="Text on the Surprise me screen. The Home card's text is edited in Home layout above."
      >
        <div className="flex flex-col gap-6">
          {SURPRISE_GROUPS.map((group) => (
            <div key={group.title}>
              <SubHeading>{group.title}</SubHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.fields.map((field) => {
                  const props = {
                    label: field.label,
                    value: form.surprise[field.key],
                    onChange: (e) => setGroup('surprise', field.key, e.target.value),
                    error: errors[`surprise.${field.key}`],
                    helperText: field.hint,
                  }
                  return field.multiline ? (
                    <div key={field.key} className="sm:col-span-2">
                      <Textarea {...props} rows={2} />
                    </div>
                  ) : (
                    <Input key={field.key} {...props} />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ConfigCard>

      {/* ───────── Search & filters ───────── */}
      <ConfigCard
        id="filters"
        icon={SlidersHorizontal}
        title="Search & filters"
        description="Options on the Filter screen, the price slider, the search radius and travel times."
      >
        <div className="flex flex-col gap-6">
          <div>
            <SubHeading>Filter screen options</SubHeading>
            <div className="flex flex-col gap-4">
              <NumberListField
                label="Distance (metres)"
                values={f.distanceOptions}
                onChange={(list) => setGroup('filters', 'distanceOptions', list)}
                format={formatMetres}
                step="100"
                placeholder="e.g. 3000"
                hint="“Any” is always offered first."
              />
              {f.distanceOptions.length > 0 && (
                <div>
                  <p className="mb-2 text-sm leading-[18px] text-ink-tertiary">Distance labels</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {f.distanceOptions.map((metres) => (
                      <Input
                        key={metres}
                        value={f.distanceLabels[String(metres)] ?? ''}
                        onChange={(e) => setDistanceLabel(metres, e.target.value)}
                        placeholder={`${formatMetres(metres)} (default)`}
                        maxLength={30}
                        aria-label={`Label for ${formatMetres(metres)}`}
                        error={errors[`filters.distanceLabels.${metres}`]}
                        helperText={formatMetres(metres)}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    Optional wording for each distance chip, e.g. “Walking distance”. Empty = the distance itself.
                  </p>
                </div>
              )}
              <NumberListField
                label="Minimum rating"
                values={f.ratingOptions}
                onChange={(list) => setGroup('filters', 'ratingOptions', list)}
                format={(v) => `${v}★+`}
                step="0.1"
                placeholder="e.g. 4.5"
              />
              <NumberListField
                label="Minimum number of reviews"
                values={f.reviewCountOptions}
                onChange={(list) => setGroup('filters', 'reviewCountOptions', list)}
                format={(v) => `${v}+`}
                step="1"
                placeholder="e.g. 250"
              />
            </div>
          </div>

          <div>
            <SubHeading>Average price slider (₼)</SubHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {['priceMin', 'priceMax', 'priceStep'].map((key) => (
                <Input
                  key={key}
                  label={FILTER_LABELS[key]}
                  type="number"
                  min="0"
                  value={f[key]}
                  onChange={(e) => setGroup('filters', key, e.target.value)}
                  error={errors[`filters.${key}`]}
                />
              ))}
            </div>
          </div>

          <div>
            <SubHeading>Search radius (metres)</SubHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={FILTER_LABELS.defaultRadius}
                type="number"
                min="0"
                step="100"
                value={f.defaultRadius}
                onChange={(e) => setGroup('filters', 'defaultRadius', e.target.value)}
                error={errors['filters.defaultRadius']}
                helperText={`${formatMetres(toNum(f.defaultRadius) ?? '')} · used by Home, Search and Surprise me`}
              />
              <Input
                label={FILTER_LABELS.maxRadius}
                type="number"
                min="0"
                step="100"
                value={f.maxRadius}
                onChange={(e) => setGroup('filters', 'maxRadius', e.target.value)}
                error={errors['filters.maxRadius']}
                helperText={`${formatMetres(toNum(f.maxRadius) ?? '')} · the largest radius a search may ask for`}
              />
            </div>
          </div>

          <div>
            <SubHeading>Travel time on cards</SubHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Speed (km/h)"
                type="number"
                min="0"
                max="200"
                step="0.5"
                value={form.eta.speedKmh}
                onChange={(e) => setGroup('eta', 'speedKmh', e.target.value)}
                error={errors['eta.speedKmh']}
                helperText="Average travel speed. 5 km/h ≈ walking."
              />
              <Input
                label="Road factor"
                type="number"
                min="1"
                max="3"
                step="0.05"
                value={form.eta.roadFactor}
                onChange={(e) => setGroup('eta', 'roadFactor', e.target.value)}
                error={errors['eta.roadFactor']}
                helperText="Straight-line distance × this factor ≈ the real route (1–3)."
              />
            </div>
          </div>

          <div>
            <SubHeading>Quick filter chips</SubHeading>
            <p className="-mt-1 mb-3 text-sm text-ink-muted">
              The chips under the search bar. Each tap moves to the next value; after the last one the filter turns off.
            </p>
            <div className="flex flex-col gap-4">
              <NumberListField
                label="Distance chip (metres)"
                values={form.quickFilters.distance}
                onChange={(list) => setGroup('quickFilters', 'distance', list)}
                format={formatMetres}
                step="100"
                placeholder="e.g. 1500"
              />
              <NumberListField
                label="Rating chip (minimum rating)"
                values={form.quickFilters.rating}
                onChange={(list) => setGroup('quickFilters', 'rating', list)}
                format={(v) => `${v}★`}
                step="0.1"
                placeholder="e.g. 4"
              />
              <NumberListField
                label="Price chip (maximum average price, ₼)"
                values={form.quickFilters.price}
                onChange={(list) => setGroup('quickFilters', 'price', list)}
                format={(v) => `≤ ${v} ₼`}
                step="1"
                placeholder="e.g. 40"
              />
            </div>
          </div>
        </div>
      </ConfigCard>

      {/* ───────── Sort options ───────── */}
      <ConfigCard
        id="sort"
        icon={ArrowDownUp}
        title="Sort options"
        description="The “Sort by” choices, in this order. Hidden options are not offered. The explanation is shown when the (?) next to an option is tapped."
      >
        {errors.sortOptions && <p className="mb-3 text-sm text-error">{errors.sortOptions}</p>}
        <div className="divide-y divide-line">
          {form.sortOptions.map((option, i) => (
            <div key={option.key} className="flex flex-wrap items-start gap-3 py-3 sm:flex-nowrap">
              <div className="pt-2.5">
                <OrderButtons index={i} count={form.sortOptions.length} onMove={moveRow('sortOptions')} />
              </div>
              <div className="w-40 shrink-0 pt-3">
                <KeyChip>{option.key}</KeyChip>
                <p className="mt-1 text-xs text-ink-muted">{SORT_KEY_HINTS[option.key]}</p>
              </div>
              <div className={clsx('flex min-w-[220px] flex-1 flex-col gap-2', !option.isActive && 'opacity-60')}>
                <Input
                  value={option.label}
                  onChange={(e) => setRow('sortOptions', i, { label: e.target.value })}
                  error={errors[`sortOptions.${i}.label`]}
                  aria-label={`${option.key} label`}
                />
                <Textarea
                  value={option.description}
                  onChange={(e) => setRow('sortOptions', i, { description: e.target.value })}
                  rows={2}
                  placeholder="Explanation (optional)"
                  aria-label={`${option.key} explanation`}
                />
              </div>
              <div className="flex items-center gap-2 pt-3">
                <VisibilityLabel active={option.isActive} />
                <Switch
                  checked={option.isActive}
                  onChange={(isActive) => setRow('sortOptions', i, { isActive })}
                  label={`Show ${option.label || option.key}`}
                />
              </div>
            </div>
          ))}
        </div>
      </ConfigCard>

      {/* ───────── Trending this month ───────── */}
      <ConfigCard
        id="trending"
        icon={TrendingUp}
        title="Trending this month"
        description="The choices of the “Trending this month” sheet in Search, in this order."
      >
        <div className="divide-y divide-line">
          {form.trendingOptions.map((option, i) => (
            <div key={option.key} className="flex flex-wrap items-start gap-3 py-3 sm:flex-nowrap">
              <div className="pt-2.5">
                <OrderButtons index={i} count={form.trendingOptions.length} onMove={moveRow('trendingOptions')} />
              </div>
              <div className="w-40 shrink-0 pt-3">
                <KeyChip>{option.key}</KeyChip>
                <p className="mt-1 text-xs text-ink-muted">{TRENDING_KEY_HINTS[option.key]}</p>
              </div>
              <div className={clsx('flex min-w-[220px] flex-1 flex-col gap-2', !option.isActive && 'opacity-60')}>
                <Input
                  value={option.label}
                  onChange={(e) => setRow('trendingOptions', i, { label: e.target.value })}
                  error={errors[`trendingOptions.${i}.label`]}
                  aria-label={`${option.key} label`}
                />
                <Textarea
                  value={option.description}
                  onChange={(e) => setRow('trendingOptions', i, { description: e.target.value })}
                  rows={2}
                  placeholder="Description (optional)"
                  aria-label={`${option.key} description`}
                />
              </div>
              <div className="flex items-center gap-2 pt-3">
                <VisibilityLabel active={option.isActive} />
                <Switch
                  checked={option.isActive}
                  onChange={(isActive) => setRow('trendingOptions', i, { isActive })}
                  label={`Show ${option.label || option.key}`}
                />
              </div>
            </div>
          ))}
        </div>
      </ConfigCard>

      {/* ───────── Price levels ───────── */}
      <ConfigCard
        id="price-levels"
        icon={Coins}
        title="Price levels"
        description={
          <>
            How each price level is shown, and the average-price band that decides a restaurant's level (
            <KeyChip>$</KeyChip> … <KeyChip>$$$$</KeyChip>). Leave “Up to” empty on the last level for “and above”.
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="hidden grid-cols-[4rem_1fr_1fr_9rem] gap-3 text-xs text-ink-muted sm:grid">
            <span>Key</span>
            <span>Label</span>
            <span>Hint</span>
            <span>Up to (₼ average)</span>
          </div>
          {form.priceLevels.map((level, i) => (
            <div key={level.key} className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[4rem_1fr_1fr_9rem]">
              <div className="pt-3">
                <KeyChip>{level.key}</KeyChip>
              </div>
              <Input
                value={level.label}
                onChange={(e) => setRow('priceLevels', i, { label: e.target.value })}
                placeholder="Label, e.g. ₼₼"
                error={errors[`priceLevels.${i}.label`]}
                aria-label={`${level.key} label`}
              />
              <Input
                value={level.hint}
                onChange={(e) => setRow('priceLevels', i, { hint: e.target.value })}
                placeholder="Hint, e.g. Moderate"
                aria-label={`${level.key} hint`}
              />
              <Input
                type="number"
                min="0"
                step="1"
                value={level.maxPrice}
                onChange={(e) => setRow('priceLevels', i, { maxPrice: e.target.value })}
                placeholder={i === form.priceLevels.length - 1 ? 'and above' : 'e.g. 35'}
                error={errors[`priceLevels.${i}.maxPrice`]}
                aria-label={`${level.key} maximum average price`}
              />
            </div>
          ))}
        </div>
      </ConfigCard>

      {/* ───────── Notification settings copy ───────── */}
      <ConfigCard
        id="notifications"
        icon={Bell}
        title="Notification settings"
        description="Labels of the notification switches in the app's Settings screen."
      >
        <div className="flex flex-col gap-3">
          {form.notificationOptions.map((option, i) => (
            <div key={option.key} className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[9rem_1fr_1.5fr]">
              <div className="pt-2">
                <KeyChip>{option.key}</KeyChip>
                <p className="mt-1 text-xs text-ink-muted">{NOTIFICATION_KEY_HINTS[option.key]}</p>
              </div>
              <Input
                value={option.label}
                onChange={(e) => setRow('notificationOptions', i, { label: e.target.value })}
                placeholder="Label"
                error={errors[`notificationOptions.${i}.label`]}
                aria-label={`${option.key} label`}
              />
              <Input
                value={option.description}
                onChange={(e) => setRow('notificationOptions', i, { description: e.target.value })}
                placeholder="Description"
                aria-label={`${option.key} description`}
              />
            </div>
          ))}
        </div>
      </ConfigCard>

      {/* ───────── Review sentiments ───────── */}
      <ConfigCard
        id="sentiments"
        icon={Smile}
        title="Review sentiments"
        description="The three reactions people pick when they review a visit. Also used for the charts in this panel."
      >
        <div className="flex flex-col gap-4">
          {form.sentiments.map((s, i) => {
            const swatch = /^#[0-9a-fA-F]{6}$/.test(s.color) ? s.color : '#cccccc'
            return (
              <div key={s.key} className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[9rem_5rem_1fr_11rem]">
                <div className="pt-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
                    style={s.color ? { borderColor: s.color } : undefined}
                  >
                    <span>{s.emoji}</span>
                    <span className="max-w-[6rem] truncate">{s.label || s.key}</span>
                  </span>
                  <p className="mt-1 text-xs text-ink-muted">
                    <KeyChip>{s.key}</KeyChip> {SENTIMENT_KEY_HINTS[s.key]}
                  </p>
                </div>
                <Input
                  value={s.emoji}
                  onChange={(e) => setRow('sentiments', i, { emoji: e.target.value })}
                  placeholder="😊"
                  maxLength={8}
                  className="text-center"
                  aria-label={`${s.key} emoji`}
                />
                <Input
                  value={s.label}
                  onChange={(e) => setRow('sentiments', i, { label: e.target.value })}
                  placeholder="Label"
                  error={errors[`sentiments.${i}.label`]}
                  aria-label={`${s.key} label`}
                />
                <div className="flex items-start gap-2">
                  <input
                    type="color"
                    value={swatch}
                    onChange={(e) => setRow('sentiments', i, { color: e.target.value.toUpperCase() })}
                    className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-canvas p-1"
                    aria-label={`${s.key} colour picker`}
                  />
                  <Input
                    value={s.color}
                    onChange={(e) => setRow('sentiments', i, { color: e.target.value })}
                    placeholder="#22C55E"
                    error={errors[`sentiments.${i}.color`]}
                    aria-label={`${s.key} colour`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </ConfigCard>

      <p className="text-sm text-ink-muted">
        Moderation switches and the platform name live in{' '}
        <Link to="/dashboard/settings" className="font-semibold text-brand-hover hover:underline">
          Settings
        </Link>
        ; cities (and the default city) in{' '}
        <Link to="/dashboard/cities" className="font-semibold text-brand-hover hover:underline">
          Catalog → Cities
        </Link>
        ; review labels in{' '}
        <Link to="/dashboard/catalog/reviewLabel" className="font-semibold text-brand-hover hover:underline">
          Catalog → Review labels
        </Link>
        .
      </p>

      <UnsavedBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  )
}
