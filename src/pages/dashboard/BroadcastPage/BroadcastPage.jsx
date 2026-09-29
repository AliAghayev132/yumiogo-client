import { useState } from 'react'
import { Bell, ExternalLink, Megaphone, Send } from 'lucide-react'
import {
  Button,
  Card,
  IconTile,
  Input,
  Select,
  Textarea,
  useBanner,
  useConfirm,
} from '@components'
import {
  useBroadcastNotificationMutation,
  useGetAdminCitiesQuery,
  useGetBroadcastAudienceQuery,
} from '@store/api'

const MESSAGE_MAX = 500
const TITLE_MAX = 120
const LINK = /^https?:\/\/\S+$/i

// Server segments (POST /admin/notifications/broadcast → segment).
const SEGMENTS = [
  { value: 'all', label: 'Everyone', description: 'Every active account' },
  { value: 'users', label: 'App users', description: 'Everyone except admins' },
  { value: 'verified', label: 'Verified users', description: 'Accounts with the verified badge' },
  { value: 'new', label: 'New users', description: 'Joined in the last 30 days' },
  { value: 'city', label: 'Users in a city', description: 'Users whose profile city matches' },
  { value: 'admins', label: 'Admins', description: 'Admin accounts only (you get a copy too)' },
]

const EMPTY = { segment: 'all', city: '', title: '', message: '', link: '' }

// "Reaches 12 people (including you)" under the audience picker.
const reachText = ({ recipients, includesYou }) => {
  if (!recipients) return 'Nobody matches this audience yet — pick another one.'
  if (includesYou && recipients === 1) return 'Reaches only you.'
  const people = recipients === 1 ? '1 person' : `${recipients.toLocaleString()} people`
  return `Reaches ${people}${includesYou ? ' (including you)' : ''}.`
}

/** How the notification looks in the app's Notifications list. */
const Preview = ({ form }) => (
  <Card padding="none">
    <div className="border-b border-line px-[18px] py-[21px]">
      <h2 className="text-sm font-bold leading-[18px] text-ink">Preview</h2>
      <p className="mt-1 font-chart text-xs leading-4 text-ink-muted">As it appears in the app&apos;s Notifications</p>
    </div>
    <div className="p-[18px]">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
        <IconTile icon={Bell} tone="green" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{form.title.trim() || 'Yumio'}</p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-secondary">
            {form.message.trim() || 'Your message appears here.'}
          </p>
          {form.link.trim() && (
            <p className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-xs font-semibold text-brand-hover">
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{form.link.trim()}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-ink-placeholder">just now</p>
        </div>
      </div>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-ink-muted">
        <li>Delivered as an in-app notification (and live to people who have the app open).</li>
        <li>Only active accounts receive it; suspended, banned and pending accounts are skipped.</li>
        <li>Audiences over 200 people are delivered in the background.</li>
      </ul>
    </div>
  </Card>
)

/**
 * Broadcast (System → Broadcast): send a system notification to everyone or a segment
 * (POST /admin/notifications/broadcast { message, title?, link?, segment, city? }).
 */
export const BroadcastPage = () => {
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState(false)
  const [broadcast, { isLoading: sending }] = useBroadcastNotificationMutation()
  const { data: citiesData, isError: citiesFailed } = useGetAdminCitiesQuery()
  const confirm = useConfirm()
  const banner = useBanner()

  const cities = (citiesData?.data?.cities || []).filter((c) => c.isActive !== false)
  const segment = SEGMENTS.find((s) => s.value === form.segment) || SEGMENTS[0]
  const needsCity = form.segment === 'city' && !form.city
  const {
    currentData: audienceData,
    isFetching: countingAudience,
    isError: audienceFailed,
  } = useGetBroadcastAudienceQuery(
    { segment: form.segment, city: form.segment === 'city' ? form.city : undefined },
    { skip: needsCity }
  )
  const audience = needsCity ? null : audienceData?.data
  const emptyAudience = audience?.recipients === 0

  const errors = {
    message: !form.message.trim() ? 'Write a message' : undefined,
    link: form.link.trim() && !LINK.test(form.link.trim()) ? 'Use a full link starting with https://' : undefined,
    city: form.segment === 'city' && !form.city ? 'Pick a city' : undefined,
    audience: emptyAudience ? 'Nobody matches this audience yet' : undefined,
  }
  const invalid = Object.values(errors).some(Boolean)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const send = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (invalid) return
    const audienceLabel = form.segment === 'city' ? `users in ${form.city}` : segment.label.toLowerCase()
    const ok = await confirm({
      tone: 'primary',
      icon: Megaphone,
      title: `Send to ${audienceLabel}?`,
      message: 'Everyone in this audience gets the notification in the app. A sent notification cannot be recalled.',
      confirmText: 'Send notification',
      onConfirm: () =>
        broadcast({
          message: form.message.trim(),
          title: form.title.trim() || undefined,
          link: form.link.trim() || undefined,
          segment: form.segment,
          city: form.segment === 'city' ? form.city : undefined,
        }).unwrap(),
    })
    if (!ok) return
    const data = ok.result?.data || {}
    banner.success(
      ok.result?.message ||
        (data.queued ? `Sending to ${data.recipients} people` : `Notification sent to ${data.delivered} people`),
      { title: 'Broadcast sent' }
    )
    setForm(EMPTY)
    setTouched(false)
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <Card padding="none">
        <div className="border-b border-line px-[18px] py-[21px]">
          <h2 className="text-sm font-bold leading-[18px] text-ink">Send a notification</h2>
          <p className="mt-1 font-chart text-xs leading-4 text-ink-muted">
            Announcements, new features or service updates for your users
          </p>
        </div>
        <form onSubmit={send} noValidate className="flex flex-col gap-3 p-[18px]">
          <Select
            label="Audience"
            value={form.segment}
            onValueChange={(value) => setForm((f) => ({ ...f, segment: value, city: value === 'city' ? f.city : '' }))}
            options={SEGMENTS}
            helperText={
              <>
                {segment.description}
                {audience ? (
                  <span className={emptyAudience ? 'font-semibold text-error' : 'text-ink-secondary'}>
                    {' · '}
                    {reachText(audience)}
                  </span>
                ) : countingAudience ? (
                  ' · Counting…'
                ) : audienceFailed && !needsCity ? (
                  <span className="text-error"> · Could not count the audience</span>
                ) : null}
              </>
            }
          />
          {form.segment === 'city' && (
            <Select
              label="City"
              value={form.city}
              onValueChange={(city) => setForm((f) => ({ ...f, city }))}
              options={cities.map((c) => ({ value: c.name, label: c.label || c.name }))}
              placeholder="Select a city"
              searchable={cities.length > 8}
              error={citiesFailed ? 'Could not load the cities' : touched ? errors.city : undefined}
            />
          )}
          <Input
            label="Title"
            value={form.title}
            onChange={set('title')}
            maxLength={TITLE_MAX}
            placeholder="Optional, e.g. New in Yumio"
          />
          <Textarea
            label="Message"
            value={form.message}
            onChange={set('message')}
            maxLength={MESSAGE_MAX}
            showCount
            rows={4}
            required
            placeholder="e.g. Friend Picks are here: see the places your friends love."
            error={touched ? errors.message : undefined}
          />
          <Input
            label="Link"
            type="url"
            value={form.link}
            onChange={set('link')}
            placeholder="Optional, https://…"
            helperText="Opened when the notification is tapped."
            error={touched ? errors.link : undefined}
          />
          <div className="pt-3">
            <Button type="submit" size="sm" leftIcon={Send} loading={sending} disabled={emptyAudience}>
              Send notification
            </Button>
          </div>
        </form>
      </Card>
      <Preview form={form} />
    </div>
  )
}
