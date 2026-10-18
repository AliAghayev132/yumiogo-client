import { useState } from 'react'
import { ArrowLeftRight, LocateFixed, MapPin, Search } from 'lucide-react'
import {
  Input,
  Select,
  Button,
  Field,
  Popover,
  Menu,
  MenuItem,
  LanguageTabs,
  LocalizedInput,
  LocalizedTextarea,
  TranslateButton,
  localizedTexts,
  languageNote,
  translationEntries,
  translationStatus,
  withTranslation,
  useBanner,
  errorMessage,
} from '@components'
import { useLazyGetPlaceSuggestionsQuery } from '@store/api'
import { ChipMulti } from './ChipMulti'
import { EditorSection } from './EditorSection'
import { derivePriceLevel, priceBandsConfigured, priceLabel, findCity } from './restaurantMeta'
import { todayInput } from './restaurantForm'
import { LocationPicker } from './LocationPicker'

// Translated texts per editor card (both cards share one language switch).
const BASIC_TEXTS = ['name', 'description']
const LOCATION_TEXTS = ['address']
// Each card's Translate button handles that card's texts.
const TRANSLATE = { basic: localizedTexts(BASIC_TEXTS), location: localizedTexts(LOCATION_TEXTS) }

// '' → NaN (no coordinate yet) instead of Number('') = 0.
const coord = (value) => (String(value ?? '').trim() === '' ? NaN : Number(value))

// Great-circle distance in km (swap check against the city centre).
const distanceKm = (a, b) => {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
// A point this far from its city is suspicious; if swapping lat/lng lands it near, offer the swap.
const FAR_FROM_CITY_KM = 150

const CHIP_FIELDS = [
  { key: 'cuisines', label: 'Cuisines', catalog: 'Cuisines', helper: 'The first one is the category shown in the admin table.' },
  { key: 'dining', label: 'Dining options', catalog: 'Dining' },
  { key: 'features', label: 'Features', catalog: 'Features' },
  { key: 'tags', label: 'Tags', catalog: 'Tags' },
  { key: 'dietary', label: 'Dietary options', catalog: 'Dietary' },
  { key: 'moods', label: 'Moods (“Perfect for…”)', catalog: 'Moods' },
]

/** Price level picker used only when the admin price bands (Settings) are not configured. */
const PriceLevelPicker = ({ levels, value, onChange, disabled }) => (
  <Field label="Price level">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {levels.map((level) => {
        const active = level.key === value
        return (
          <button
            key={level.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level.key)}
            aria-pressed={active}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${
              active ? 'border-brand bg-brand-soft' : 'border-line bg-canvas hover:bg-subtle'
            }`}
          >
            <span className={`block text-sm font-semibold ${active ? 'text-brand-hover' : 'text-ink'}`}>{level.label}</span>
            {level.hint && <span className="block text-xs text-ink-muted">{level.hint}</span>}
          </button>
        )
      })}
    </div>
  </Field>
)

/**
 * General tab of the restaurant editor: basic info, categories (all from /admin/meta), price
 * (average + card range; the price level is derived from the average with the Settings bands
 * and shown read-only), location (city select, coordinates, city centre / address lookup)
 * and the other catalog lists. Name, description and address also take AZ / RU texts: `lang`
 * (en | az | ru, kept by the editor) picks which language those fields edit.
 */
export const GeneralTab = ({ form, setForm, restaurant, meta, catalog, priceLevels, disabled, lang = 'en', setLang }) => {
  const banner = useBanner()
  const [lookup, { data: placesData, isFetching: searching }] = useLazyGetPlaceSuggestionsQuery()
  const [placesOpen, setPlacesOpen] = useState(false)
  const [lookupAnchor, setLookupAnchor] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  // AZ / RU text of `field` in the selected language.
  const tr = (field) => ({
    lang,
    translation: form.translations[lang]?.[field],
    onTranslationChange: (value) =>
      setForm((f) => ({ ...f, translations: withTranslation(f.translations, lang, field, value) })),
  })
  const languageTabs = (fields, card) => (
    <>
      <TranslateButton form={form} setForm={setForm} texts={TRANSLATE[card]} onLanguageChange={setLang} disabled={disabled} />
      <LanguageTabs
        value={lang}
        onChange={setLang}
        status={translationStatus(translationEntries(form, form.translations, fields))}
      />
    </>
  )
  const toggleIn = (key) => (item) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(item) ? f[key].filter((x) => x !== item) : [...f[key], item] }))

  // Active catalog values + values this restaurant still has that were deactivated since.
  const chipOptions = (key) => {
    const active = meta[key] || []
    const retired = (restaurant?.[key] || []).filter((v) => !active.includes(v))
    return { options: [...active, ...retired], inactive: retired }
  }

  const cityNames = meta.cities || []
  const cityOptions = [
    ...cityNames.map((name) => ({ value: name, label: findCity(catalog, name)?.label || name })),
    ...(restaurant?.city && !cityNames.includes(restaurant.city)
      ? [{ value: restaurant.city, label: `${restaurant.city} (inactive)` }]
      : []),
  ]
  const cityCentre = findCity(catalog, form.city)
  const lat = coord(form.lat)
  const lng = coord(form.lng)
  const centrePoint = cityCentre && { lat: Number(cityCentre.latitude), lng: Number(cityCentre.longitude) }
  const looksSwapped =
    !!centrePoint &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    distanceKm({ lat, lng }, centrePoint) > FAR_FROM_CITY_KM &&
    Math.abs(lng) <= 90 &&
    distanceKm({ lat: lng, lng: lat }, centrePoint) <= FAR_FROM_CITY_KM

  const bands = priceBandsConfigured(priceLevels)
  const derivedKey = bands ? derivePriceLevel(form.avgPrice, priceLevels) : null
  const derived = priceLevels.find((l) => l.key === (derivedKey || form.priceLevel))
  const cardPrice = priceLabel(form)

  const findPlaces = async () => {
    const q = [form.address, form.city].filter(Boolean).join(', ').trim()
    if (!q) {
      banner.info('Enter the address first')
      return
    }
    try {
      await lookup({ q, limit: 6 }, true).unwrap()
      setPlacesOpen(true)
    } catch (err) {
      banner.error(errorMessage(err, 'Address lookup failed'))
    }
  }

  const pickPlace = (place) => {
    const city = cityNames.find((c) => c.toLowerCase() === String(place.city || '').toLowerCase())
    setForm((f) => ({
      ...f,
      lng: String(place.longitude),
      lat: String(place.latitude),
      ...(city ? { city } : {}),
    }))
    setPlacesOpen(false)
  }

  const places = placesData?.data?.places || []

  return (
    <div className="flex flex-col gap-6">
      <EditorSection title="Basic info" description={languageNote(lang)} actions={languageTabs(BASIC_TEXTS, 'basic')}>
        <LocalizedInput {...tr('name')} label="Name" value={form.name} onChange={set('name')} maxLength={120} required disabled={disabled} />
        <LocalizedTextarea
          {...tr('description')}
          label="Description"
          value={form.description}
          onChange={set('description')}
          rows={4}
          maxLength={3000}
          showCount
          disabled={disabled}
        />
        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+994 ..." maxLength={40} disabled={disabled} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Discount %"
            type="number"
            min="0"
            max="100"
            value={form.discountPercent}
            onChange={set('discountPercent')}
            helperText="Above 0 puts the restaurant in the “Up to 50% off” rail."
            disabled={disabled}
          />
          <Input
            label="Discount ends"
            type="date"
            min={todayInput()}
            value={Number(form.discountPercent) > 0 ? form.discountEndsAt : ''}
            onChange={set('discountEndsAt')}
            helperText={
              Number(form.discountPercent) > 0
                ? 'Optional. The discount switches off automatically after this day.'
                : 'Set a discount first.'
            }
            disabled={disabled || !(Number(form.discountPercent) > 0)}
          />
        </div>
      </EditorSection>

      <EditorSection title="Price" description="Amounts in manat (₼).">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Average price per person"
            type="number"
            min="0"
            value={form.avgPrice}
            onChange={set('avgPrice')}
            rightIcon={<span className="text-sm text-ink-muted">₼</span>}
            disabled={disabled}
          />
          <Input
            label="Price range from"
            type="number"
            min="0"
            value={form.priceMin}
            onChange={set('priceMin')}
            placeholder="Min"
            rightIcon={<span className="text-sm text-ink-muted">₼</span>}
            disabled={disabled}
          />
          <Input
            label="Price range to"
            type="number"
            min="0"
            value={form.priceMax}
            onChange={set('priceMax')}
            placeholder="Max"
            rightIcon={<span className="text-sm text-ink-muted">₼</span>}
            disabled={disabled}
          />
        </div>
        {bands ? (
          <Input
            label="Price level"
            readOnly
            value={derived ? `${derived.label}${derived.hint ? ` · ${derived.hint}` : ''}` : 'Enter the average price'}
            helperText="Worked out from the average price with the price bands in App config."
          />
        ) : (
          <PriceLevelPicker
            levels={priceLevels}
            value={form.priceLevel}
            disabled={disabled}
            onChange={(priceLevel) => setForm((f) => ({ ...f, priceLevel }))}
          />
        )}
        {cardPrice && (
          <p className="text-xs text-ink-muted">
            Cards show <span className="font-semibold text-success">{cardPrice}</span>
          </p>
        )}
      </EditorSection>

      <EditorSection title="Location" actions={languageTabs(LOCATION_TEXTS, 'location')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LocalizedInput {...tr('address')} label="Address" value={form.address} onChange={set('address')} maxLength={300} disabled={disabled} />
          <Select
            label="City"
            value={form.city}
            onValueChange={(city) => setForm((f) => ({ ...f, city }))}
            placeholder="No city"
            options={cityOptions}
            searchable={cityOptions.length > 8}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Longitude" type="number" step="any" min={-180} max={180} value={form.lng} onChange={set('lng')} disabled={disabled} />
          <Input label="Latitude" type="number" step="any" min={-90} max={90} value={form.lat} onChange={set('lat')} disabled={disabled} />
        </div>
        {looksSwapped && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            <span className="flex-1">
              These coordinates are far from {cityCentre.name}; longitude and latitude look swapped.
            </span>
            <Button
              size="xs"
              variant="outline"
              leftIcon={ArrowLeftRight}
              disabled={disabled}
              onClick={() => setForm((f) => ({ ...f, lng: f.lat, lat: f.lng }))}
            >
              Swap them
            </Button>
          </div>
        )}
        <LocationPicker
          lat={lat}
          lng={lng}
          disabled={disabled}
          onChange={(p) => setForm((f) => ({ ...f, lat: String(p.lat), lng: String(p.lng) }))}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span ref={setLookupAnchor} className="inline-flex">
            <Button size="sm" variant="outline" leftIcon={Search} loading={searching} onClick={findPlaces} disabled={disabled}>
              Find coordinates from address
            </Button>
          </span>
          {cityCentre && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={LocateFixed}
              disabled={disabled}
              onClick={() => setForm((f) => ({ ...f, lng: String(cityCentre.longitude), lat: String(cityCentre.latitude) }))}
            >
              Use the {cityCentre.name} city centre
            </Button>
          )}
          {form.lat && form.lng && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${form.lat}&mlon=${form.lng}#map=17/${form.lat}/${form.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline"
            >
              <MapPin className="h-3.5 w-3.5" /> Check on the map
            </a>
          )}
        </div>
        <Popover open={placesOpen} onClose={() => setPlacesOpen(false)} anchorEl={lookupAnchor} placement="bottom-start" style={{ width: 380 }}>
          <Menu className="max-h-80">
            {places.length ? (
              places.map((p) => (
                <MenuItem key={p.id || `${p.latitude},${p.longitude}`} icon={MapPin} description={p.subtitle} onSelect={() => pickPlace(p)}>
                  {p.name || p.label}
                </MenuItem>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-ink-muted">No places found for this address.</p>
            )}
          </Menu>
        </Popover>
      </EditorSection>

      <EditorSection title="Catalog" description="Options come from the Catalog pages.">
        {CHIP_FIELDS.map(({ key, label, catalog: catalogName, helper }) => {
          const { options, inactive } = chipOptions(key)
          return (
            <ChipMulti
              key={key}
              label={label}
              options={options}
              inactive={inactive}
              value={form[key]}
              onToggle={toggleIn(key)}
              helperText={helper}
              disabled={disabled}
              emptyText={`No active ${catalogName.toLowerCase()} yet. Add them under Catalog → ${catalogName}.`}
            />
          )
        })}
      </EditorSection>
    </div>
  )
}
