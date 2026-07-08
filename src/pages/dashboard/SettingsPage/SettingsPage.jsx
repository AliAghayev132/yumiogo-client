import { useEffect, useState } from 'react'
import { Database, Trash2, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { Card, Input, Button, PageLoader } from '@components'
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useSeedDatabaseMutation,
  useClearDatabaseMutation,
} from '@store/api'

export const SettingsPage = () => {
  const { data, isLoading } = useGetSettingsQuery()
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation()
  const [seedDatabase, { isLoading: seeding }] = useSeedDatabaseMutation()
  const [clearDatabase, { isLoading: clearing }] = useClearDatabaseMutation()

  const handleSeed = async () => {
    const res = await Swal.fire({
      icon: 'question',
      title: 'Seed database?',
      text: 'This replaces all demo data (restaurants, users, reviews, lists, follows, reports).',
      showCancelButton: true,
      confirmButtonText: 'Seed',
      confirmButtonColor: '#22C55E',
    })
    if (!res.isConfirmed) return
    try {
      const r = await seedDatabase().unwrap()
      const c = r.data.counts
      Swal.fire({
        icon: 'success',
        title: 'Database seeded',
        html: `${c.restaurants} restaurants · ${c.users} users · ${c.reviews} reviews · ${c.lists} lists · ${c.reports} reports`,
      })
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Seed failed' })
    }
  }

  const handleClear = async () => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Clear database?',
      text: 'This permanently deletes all restaurants, users (except admins), reviews, lists and reports.',
      showCancelButton: true,
      confirmButtonText: 'Clear everything',
      confirmButtonColor: '#EF4444',
    })
    if (!res.isConfirmed) return
    try {
      const r = await clearDatabase().unwrap()
      const c = r.data.counts
      Swal.fire({
        icon: 'success',
        title: 'Database cleared',
        html: `Removed ${c.restaurants} restaurants · ${c.users} users · ${c.reviews} reviews · ${c.lists} lists · ${c.reports} reports`,
      })
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Clear failed' })
    }
  }

  const [form, setForm] = useState(null)

  useEffect(() => {
    if (data?.data?.settings) {
      const s = data.data.settings
      setForm({
        appName: s.appName,
        supportEmail: s.supportEmail,
        defaultCity: s.defaultCity,
        newUserAlerts: s.newUserAlerts,
        reportAlerts: s.reportAlerts,
        autoApproveReviews: s.autoApproveReviews,
      })
    }
  }, [data])

  if (isLoading || !form) return <PageLoader />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }))

  const save = async () => {
    try {
      await updateSettings(form).unwrap()
      Swal.fire({ icon: 'success', title: 'Settings saved', timer: 1200, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Save failed' })
    }
  }

  const Toggle = ({ label, description, active, onClick }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={`w-11 h-6 rounded-full transition-colors relative ${active ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            active ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">General</h3>
        <div className="space-y-4">
          <Input label="App name" value={form.appName} onChange={set('appName')} />
          <Input label="Support email" value={form.supportEmail} onChange={set('supportEmail')} />
          <Input label="Default city" value={form.defaultCity} onChange={set('defaultCity')} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-2">Notifications & moderation</h3>
        <div className="divide-y divide-gray-100">
          <Toggle
            label="New user alerts"
            description="Notify admins when a new user registers"
            active={form.newUserAlerts}
            onClick={() => toggle('newUserAlerts')}
          />
          <Toggle
            label="Report alerts"
            description="Notify admins about new content reports"
            active={form.reportAlerts}
            onClick={() => toggle('reportAlerts')}
          />
          <Toggle
            label="Auto-approve reviews"
            description="Publish new reviews without manual review"
            active={form.autoApproveReviews}
            onClick={() => toggle('autoApproveReviews')}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="success" onClick={save} disabled={saving}>
          Save changes
        </Button>
      </div>

      {/* Demo data management */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-gray-900">Demo data</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Seed the database with sample content, or clear it to start fresh.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="success"
            onClick={handleSeed}
            disabled={seeding || clearing}
            leftIcon={
              seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />
            }
          >
            {seeding ? 'Seeding…' : 'Seed database'}
          </Button>
          <Button
            variant="danger"
            onClick={handleClear}
            disabled={seeding || clearing}
            leftIcon={
              clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />
            }
          >
            {clearing ? 'Clearing…' : 'Clear database'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
