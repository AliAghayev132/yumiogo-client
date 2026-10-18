import { useRef, useState } from 'react'
import { clsx } from 'clsx'
import { AlertTriangle, Database, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Input,
  LanguageTabs,
  LocalizedTextarea,
  Select,
  Skeleton,
  SwitchRow,
  TranslateButton,
  localizedTexts,
  formatNumber,
  languageNote,
  toTranslationForm,
  toTranslationPayload,
  translationEntries,
  translationStatus,
  withTranslation,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useSeedDemoDataMutation,
  useClearDemoDataMutation,
  useWipeAllDataMutation,
} from '@store/api'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAINTENANCE_MESSAGE_MAX = 300
// Same rule as the server (CatalogService APP_VERSION): "1", "1.4" or "1.4.0".
const APP_VERSION = /^\d{1,4}(\.\d{1,4}){0,2}$/

/** -1 / 0 / 1 for two "x.y.z" versions (missing parts count as 0) — mirrors the server. */
const compareVersions = (a, b) => {
  const parts = (v) => String(v || '0').split('.').map((n) => parseInt(n, 10) || 0)
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < 3; i += 1) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0) ? -1 : 1
  }
  return 0
}

// Moderation switches (Figma 1296:29345) — saved as soon as they are flipped.
const MODERATION_TOGGLES = [
  { key: 'autoFlagReviews', label: 'Auto-flag reviews', description: 'Flag low-rated reviews automatically' },
  { key: 'autoApproveReviews', label: 'Auto-approve reviews', description: 'Publish new reviews without manual review' },
  { key: 'newUserApproval', label: 'New user approval', description: 'New accounts wait for admin approval' },
  { key: 'restaurantApproval', label: 'Restaurant approval', description: 'Manual review before publishing' },
]

const ALERT_TOGGLES = [
  { key: 'newUserAlerts', label: 'New user alerts', description: 'Notify admins when someone signs up' },
  { key: 'reportAlerts', label: 'Report alerts', description: 'Notify admins about new reports' },
]

// Pieces of the Data card summaries (current demo data / what an action created or deleted).
const DATA_COUNTS = [
  ['restaurants', 'restaurants'],
  ['menuItems', 'menu items'],
  ['users', 'users'],
  ['reviews', 'reviews'],
  ['comments', 'comments'],
  ['lists', 'lists'],
  ['notifications', 'notifications'],
  ['reports', 'reports'],
  ['views', 'views'],
  ['files', 'files'],
]

/** Figma settings card: bold title row + full-width divider + padded body (24px under the divider). */
const SettingsCard = ({ title, description, children, className }) => (
  <Card padding="none" className={className}>
    <div className="border-b border-line px-[18px] py-[21px]">
      <h2 className="text-sm font-bold leading-[18px] text-ink">{title}</h2>
      {description && <p className="mt-1 font-chart text-xs leading-4 text-ink-muted">{description}</p>}
    </div>
    <div className="px-[18px] pb-[18px] pt-6">{children}</div>
  </Card>
)

// ---------------------------------------------------------------- General settings

const GeneralSettings = ({ settings, languages }) => {
  const [updateSettings, { isLoading: saving }] = useUpdateAdminSettingsMutation()
  const banner = useBanner()
  const [form, setForm] = useState({
    appName: settings.appName || '',
    supportEmail: settings.supportEmail || '',
    defaultLanguage: settings.defaultLanguage || 'en',
  })
  const [touched, setTouched] = useState(false)

  const errors = {
    appName: form.appName.trim() ? undefined : 'Platform name is required',
    supportEmail: !form.supportEmail.trim()
      ? 'Support email is required'
      : EMAIL.test(form.supportEmail.trim())
        ? undefined
        : 'Enter a valid email address',
  }
  const invalid = Object.values(errors).some(Boolean)
  const dirty =
    form.appName.trim() !== (settings.appName || '') ||
    form.supportEmail.trim() !== (settings.supportEmail || '') ||
    form.defaultLanguage !== (settings.defaultLanguage || 'en')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (invalid) return
    // Nothing changed: the saved values are already live.
    if (!dirty) {
      banner.success('Settings saved successfully')
      return
    }
    try {
      await updateSettings({
        appName: form.appName.trim(),
        supportEmail: form.supportEmail.trim(),
        defaultLanguage: form.defaultLanguage,
      }).unwrap()
      banner.success('Settings saved successfully')
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the settings'))
    }
  }

  return (
    <SettingsCard title="General settings">
      {/* Figma: 16px between the fields. */}
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <Input
          label="Platform name"
          value={form.appName}
          onChange={set('appName')}
          maxLength={60}
          error={touched ? errors.appName : undefined}
        />
        <Input
          label="Support email"
          type="email"
          value={form.supportEmail}
          onChange={set('supportEmail')}
          error={touched ? errors.supportEmail : undefined}
        />
        <Select
          label="Default language"
          value={form.defaultLanguage}
          onValueChange={(defaultLanguage) => setForm((f) => ({ ...f, defaultLanguage }))}
          options={languages.map((l) => ({ value: l.code, label: l.label }))}
        />
        <div className="pt-2">
          <Button type="submit" size="sm" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------- app version

/**
 * Minimum supported / latest app version (Settings.appVersion, public in /api/catalog). The app
 * compares its own version: below the minimum it shows the forced-update screen, below the latest
 * it offers an optional update. Empty = no check.
 */
const AppVersionSettings = ({ settings }) => {
  const [updateSettings, { isLoading: saving }] = useUpdateAdminSettingsMutation()
  const banner = useBanner()
  const saved = { minSupported: settings.appVersion?.minSupported || '', latest: settings.appVersion?.latest || '' }
  const [form, setForm] = useState(saved)
  const [touched, setTouched] = useState(false)

  const min = form.minSupported.trim()
  const latest = form.latest.trim()
  const errors = {
    minSupported: min && !APP_VERSION.test(min) ? 'Use a version like 1.4.0' : undefined,
    latest:
      latest && !APP_VERSION.test(latest)
        ? 'Use a version like 1.4.0'
        : min && latest && APP_VERSION.test(min) && compareVersions(latest, min) < 0
          ? 'The latest version cannot be lower than the minimum'
          : undefined,
  }
  const invalid = Object.values(errors).some(Boolean)
  const dirty = min !== saved.minSupported || latest !== saved.latest

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (invalid || !dirty) return
    try {
      await updateSettings({ appVersion: { minSupported: min, latest } }).unwrap()
      banner.success('App version saved')
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the app version'))
    }
  }

  return (
    <SettingsCard
      title="App version"
      description="Apps older than the minimum get a forced-update screen; apps older than the latest are offered an optional update. Leave a field empty to skip that check."
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Minimum supported"
            value={form.minSupported}
            onChange={set('minSupported')}
            placeholder="e.g. 1.2.0"
            inputMode="decimal"
            maxLength={14}
            error={touched || form.minSupported ? errors.minSupported : undefined}
          />
          <Input
            label="Latest"
            value={form.latest}
            onChange={set('latest')}
            placeholder="e.g. 1.4.0"
            inputMode="decimal"
            maxLength={14}
            error={touched || form.latest ? errors.latest : undefined}
          />
        </div>
        <div className="pt-3">
          <Button type="submit" size="sm" loading={saving} disabled={!dirty}>
            Save version
          </Button>
        </div>
      </form>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------- switches

/**
 * Saves one boolean setting on flip. The switch moves at once (optimistic) and falls back to
 * the saved value if the request fails.
 */
const useSettingToggle = (settings) => {
  const [updateSettings] = useUpdateAdminSettingsMutation()
  const [pending, setPending] = useState({})
  const banner = useBanner()
  // One result banner at a time: flipping switches quickly replaces it instead of stacking.
  const lastBanner = useRef(null)

  const valueOf = (key) => (key in pending ? pending[key] : !!settings[key])

  const save = async (key, value, { successMessage } = {}) => {
    setPending((p) => ({ ...p, [key]: value }))
    try {
      const res = await updateSettings({ [key]: value }).unwrap()
      if (lastBanner.current) banner.dismiss(lastBanner.current)
      lastBanner.current = successMessage
        ? successMessage(res)
        : banner.success(res?.message || 'Settings saved successfully')
      return true
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the setting'))
      return false
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[key]
        return next
      })
    }
  }

  return { valueOf, save, isPending: (key) => key in pending }
}

// The maintenance message also has az / ru versions (Settings.translations; the other root
// texts there are edited in App config, and the server merges per field).
const MAINTENANCE_TEXTS = ['maintenanceMessage']
const MAINTENANCE_TRANSLATE = localizedTexts(MAINTENANCE_TEXTS)
// Remount key: the saved message in every language.
const maintenanceKey = (settings) =>
  JSON.stringify([settings.maintenanceMessage || '', toTranslationForm(settings.translations, MAINTENANCE_TEXTS)])

const MaintenanceMessage = ({ settings }) => {
  const [updateSettings, { isLoading: saving }] = useUpdateAdminSettingsMutation()
  const banner = useBanner()
  const saved = settings.maintenanceMessage || ''
  const savedTranslations = toTranslationForm(settings.translations, MAINTENANCE_TEXTS)
  const [form, setForm] = useState({ maintenanceMessage: saved, translations: savedTranslations })
  const { maintenanceMessage: message, translations } = form
  const [lang, setLang] = useState('en')
  const translationPayload = toTranslationPayload(translations, MAINTENANCE_TEXTS)
  const dirty =
    message.trim() !== saved ||
    JSON.stringify(translationPayload) !== JSON.stringify(toTranslationPayload(savedTranslations, MAINTENANCE_TEXTS))

  const cancel = () => setForm({ maintenanceMessage: saved, translations: savedTranslations })

  const save = async () => {
    try {
      await updateSettings({ maintenanceMessage: message.trim(), translations: translationPayload }).unwrap()
      banner.success('Maintenance message saved')
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the message'))
    }
  }

  return (
    <div className="flex flex-col gap-2 px-3 pb-1.5 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-4 text-ink-muted">{languageNote(lang)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <TranslateButton form={form} setForm={setForm} texts={MAINTENANCE_TRANSLATE} onLanguageChange={setLang} />
          <LanguageTabs
            value={lang}
            onChange={setLang}
            status={translationStatus(translationEntries(form, translations, MAINTENANCE_TEXTS))}
          />
        </div>
      </div>
      <LocalizedTextarea
        lang={lang}
        translation={translations[lang]?.maintenanceMessage}
        onTranslationChange={(value) =>
          setForm((f) => ({ ...f, translations: withTranslation(f.translations, lang, 'maintenanceMessage', value) }))
        }
        translationHint="Optional — empty uses English. Shown on the app's maintenance screen."
        label="Maintenance message"
        value={message}
        onChange={(e) => {
          const value = e.target.value
          setForm((f) => ({ ...f, maintenanceMessage: value }))
        }}
        rows={2}
        maxLength={MAINTENANCE_MESSAGE_MAX}
        showCount
        placeholder="Yumio is getting a few improvements. Please check back soon."
        helperText="Shown on the app's maintenance screen."
      />
      {dirty && (
        <div className="flex gap-2">
          <Button size="sm" onClick={save} loading={saving}>
            Save message
          </Button>
          <Button size="sm" variant="outline" onClick={cancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

const ModerationSettings = ({ settings }) => {
  const toggle = useSettingToggle(settings)
  const confirm = useConfirm()
  const banner = useBanner()

  const setMaintenance = async (enabled) => {
    if (enabled) {
      // Figma modalBox 1353:11040.
      const ok = await confirm({
        tone: 'warning',
        icon: AlertTriangle,
        title: 'Enable maintenance mode?',
        message: 'The platform will go offline for all users immediately.',
        notice: 'All active users will be logged out and see a maintenance screen.',
        confirmText: 'Enable maintenance',
      })
      if (!ok) return
    }
    await toggle.save('maintenanceMode', enabled, {
      // Figma 1353:11111 (amber) / 1353:11546 (green).
      successMessage: () =>
        enabled ? banner.warning('Maintenance mode enabled') : banner.success('Maintenance mode disabled'),
    })
  }

  return (
    <SettingsCard title="Moderation settings">
      <div className="mx-1 -my-1.5 flex flex-col">
        {MODERATION_TOGGLES.map((t) => (
          <SwitchRow
            key={t.key}
            label={t.label}
            description={t.description}
            checked={toggle.valueOf(t.key)}
            disabled={toggle.isPending(t.key)}
            onChange={(value) => toggle.save(t.key, value)}
          />
        ))}
        <SwitchRow
          label="Maintenance mode"
          description="Platform goes offline"
          danger
          checked={toggle.valueOf('maintenanceMode')}
          disabled={toggle.isPending('maintenanceMode')}
          onChange={setMaintenance}
        />
        <MaintenanceMessage key={maintenanceKey(settings)} settings={settings} />
      </div>
    </SettingsCard>
  )
}

const AlertSettings = ({ settings }) => {
  const toggle = useSettingToggle(settings)
  return (
    <SettingsCard title="Admin alerts" description="Alerts appear in the notifications bell of every admin.">
      <div className="mx-1 -my-1.5 flex flex-col">
        {ALERT_TOGGLES.map((t) => (
          <SwitchRow
            key={t.key}
            label={t.label}
            description={t.description}
            checked={toggle.valueOf(t.key)}
            disabled={toggle.isPending(t.key)}
            onChange={(value) => toggle.save(t.key, value)}
          />
        ))}
      </div>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------- data

const countSummary = (counts = {}) =>
  DATA_COUNTS.filter(([key]) => counts[key])
    .map(([key, label]) => `${formatNumber(counts[key])} ${label}`)
    .join(' · ')

// Typed confirmation: the admin types the exact phrase the server expects.
const typedField = (phrase) => ({
  label: `Type “${phrase}” to confirm`,
  placeholder: phrase,
  required: true,
  requiredMessage: `Type “${phrase}” to confirm`,
})
const checkPhrase = (value, phrase) => {
  if (value !== phrase) throw new Error(`Type “${phrase}” exactly (capital letters) to confirm.`)
}

/** Settings row with trailing actions — the type scale of the moderation switch rows. */
const DataRow = ({ label, description, danger = false, children }) => (
  <div className="flex flex-col gap-3 rounded-sm p-3 sm:flex-row sm:items-center">
    <div className="min-w-0 flex-1">
      <span className={clsx('block text-sm font-medium leading-5', danger ? 'text-danger' : 'text-ink')}>
        {label}
      </span>
      {description && (
        <span className={clsx('block text-xs leading-4', danger ? 'text-danger' : 'text-ink-tertiary')}>
          {description}
        </span>
      )}
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
  </div>
)

/**
 * "Delete all data" confirmation: typed phrase + the optional catalog / settings reset.
 * Stays open with the server error inside when the request fails.
 */
const WipeDialog = ({ isOpen, phrase, onClose, onDone }) => {
  const [wipeAllData] = useWipeAllDataMutation()
  const [resetCatalog, setResetCatalog] = useState(false)

  const close = () => {
    setResetCatalog(false)
    onClose()
  }

  const wipe = async (value) => {
    checkPhrase(value, phrase)
    const res = await wipeAllData({ confirm: value, includeCatalog: resetCatalog }).unwrap()
    setResetCatalog(false)
    onDone(res?.data)
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={close}
      tone="danger"
      icon={AlertTriangle}
      title="Delete all data?"
      message="Every account except admins and everything in the app — restaurants, menus, reviews, comments, lists, notifications, reports, views, search history and uploaded files — will be permanently deleted."
      notice="This cannot be undone. Admin accounts are kept and stay signed in."
      noticeTone="error"
      confirmText="Delete all data"
      reasonField={typedField(phrase)}
      onConfirm={wipe}
    >
      <div className="rounded-sm border border-line bg-surface p-3">
        <Checkbox
          label="Also reset catalog & settings"
          checked={resetCatalog}
          onChange={(e) => setResetCatalog(e.target.checked)}
        />
        <p className="mt-1 pl-6 text-xs leading-4 text-ink-tertiary">
          Cuisines, features, cities, FAQs, legal pages, onboarding and every setting go back to the
          defaults. Leave it off to keep your catalog and settings.
        </p>
      </div>
    </ConfirmDialog>
  )
}

/**
 * Data card: load / delete the mock data (development tool) and the "Delete all data" danger
 * zone. Each part only shows while the server allows it (demoData.enabled / demoData.wipe).
 */
const DataSettings = ({ demoData }) => {
  const [seedDemoData, { isLoading: seeding }] = useSeedDemoDataMutation()
  const [clearDemoData, { isLoading: clearing }] = useClearDemoDataMutation()
  const [wipeOpen, setWipeOpen] = useState(false)
  const [wipeKey, setWipeKey] = useState(0)
  const confirm = useConfirm()
  const banner = useBanner()
  const counts = demoData.counts || {}
  const hasDemo = DATA_COUNTS.some(([key]) => counts[key] > 0)
  const phrases = demoData.confirmations || {}

  const load = async () => {
    const phrase = phrases.seed || 'SEED DEMO DATA'
    const ok = await confirm({
      tone: 'primary',
      icon: Database,
      title: 'Load mock data?',
      message:
        'Fills every part of the app with Baku demo data: restaurants with menus and photos, people, reviews with comments, favourite lists, notifications, reports and 90 days of activity. Loading again replaces the previous demo data; real data is never touched.',
      confirmText: 'Load mock data',
      reasonField: typedField(phrase),
      onConfirm: (value) => {
        checkPhrase(value, phrase)
        return seedDemoData({ confirm: value }).unwrap()
      },
    })
    if (ok) banner.success(countSummary(ok.result?.data?.counts) || 'Done', { title: 'Mock data loaded' })
  }

  const clear = async () => {
    const phrase = phrases.reset || 'DELETE DEMO DATA'
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Delete demo data?',
      message:
        'Removes every demo document and the references real data has to it. Real users, restaurants and reviews stay.',
      notice: 'This action cannot be undone.',
      confirmText: 'Delete demo data',
      reasonField: typedField(phrase),
      onConfirm: (value) => {
        checkPhrase(value, phrase)
        return clearDemoData({ confirm: value }).unwrap()
      },
    })
    if (ok) banner.success(countSummary(ok.result?.data?.counts) || 'Nothing to delete', { title: 'Demo data deleted' })
  }

  const openWipe = () => {
    setWipeKey((k) => k + 1)
    setWipeOpen(true)
  }

  const wiped = (data) => {
    setWipeOpen(false)
    const summary = countSummary(data?.counts) || 'Nothing to delete'
    banner.success(data?.includeCatalog ? `${summary} · catalog and settings reset` : summary, {
      title: 'All data deleted',
    })
  }

  const busy = seeding || clearing

  return (
    <SettingsCard title="Data" description="Mock data for testing and a full reset — shown while the server allows them.">
      <div className="mx-1 -my-1.5 flex flex-col">
        {demoData.enabled && (
          <>
            <DataRow
              label="Load mock data"
              description="Baku restaurants, menus, people, reviews, lists and activity for every feature. Loading again replaces the previous batch."
            >
              <Button size="sm" leftIcon={Database} loading={seeding} disabled={clearing} onClick={load}>
                Load mock data
              </Button>
            </DataRow>
            <DataRow
              label="Delete demo data"
              description={hasDemo ? `Currently: ${countSummary(counts)}.` : 'There is no demo data in the database.'}
            >
              <Button
                size="sm"
                variant="soft-danger"
                leftIcon={Trash2}
                loading={clearing}
                disabled={seeding || !hasDemo}
                onClick={clear}
              >
                Delete demo data
              </Button>
            </DataRow>
          </>
        )}
        {demoData.wipe && (
          <div className={clsx('rounded-sm border border-danger/30 bg-danger-soft/40', demoData.enabled && 'mt-3')}>
            <DataRow
              danger
              label="Delete all data"
              description="Deletes every non-admin account and all restaurants, menus, reviews, lists, notifications, reports and uploaded files. Admin accounts are kept."
            >
              <Button size="sm" variant="danger" leftIcon={AlertTriangle} disabled={busy} onClick={openWipe}>
                Delete all data
              </Button>
            </DataRow>
          </div>
        )}
      </div>
      {demoData.wipe && (
        <WipeDialog
          key={wipeKey}
          isOpen={wipeOpen}
          phrase={phrases.wipe || 'DELETE ALL DATA'}
          onClose={() => setWipeOpen(false)}
          onDone={wiped}
        />
      )}
    </SettingsCard>
  )
}

// ---------------------------------------------------------------- page

const SettingsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {[0, 1].map((i) => (
      <Card key={i} padding="none">
        <div className="border-b border-line px-[18px] py-[21px]">
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-col gap-5 p-[18px]">
          {[0, 1, 2].map((j) => (
            <Skeleton key={j} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    ))}
  </div>
)

/**
 * Settings (Figma 1296:29345 + 1353:8589 / 1353:11111 / 1353:11546 / modalBox 1353:11040):
 * General settings (platform name, support email, default language, Save changes) next to
 * Moderation settings (switches saved on flip; maintenance mode with its confirmation and
 * banners), plus the app version check, admin alerts and — only when the server allows it — the
 * Data card (load / delete mock data, "Delete all data").
 */
export const SettingsPage = () => {
  const { data, isLoading, isError, refetch } = useGetAdminSettingsQuery()
  const settings = data?.data?.settings
  const languages = data?.data?.languages || [{ code: 'en', label: 'English' }]
  const demoData = data?.data?.demoData

  if (isLoading) return <SettingsSkeleton />
  if (isError || !settings) {
    return (
      <Card>
        <EmptyState
          icon={SettingsIcon}
          title="Could not load the settings"
          action={
            <Button size="sm" variant="outline" onClick={refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  // The forms restart only when their saved values change (not on every switch flip).
  const generalKey = [settings.appName, settings.supportEmail, settings.defaultLanguage].join('|')
  const versionKey = [settings.appVersion?.minSupported, settings.appVersion?.latest].join('|')

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <GeneralSettings key={generalKey} settings={settings} languages={languages} />
        <AppVersionSettings key={versionKey} settings={settings} />
        {(demoData?.enabled || demoData?.wipe) && <DataSettings demoData={demoData} />}
      </div>
      <div className="flex flex-col gap-6">
        <ModerationSettings settings={settings} />
        <AlertSettings settings={settings} />
      </div>
    </div>
  )
}
