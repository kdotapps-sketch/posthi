'use client'

import { useState } from 'react'
import { updateSettings } from '../actions'
import { CheckCircle2, XCircle, Settings, Save } from 'lucide-react'

export type SettingsType = {
  default_timezone: string
  default_platforms: string[]
  monthly_x_spend_limit: number
  mock_publishing: boolean
  checklist: {
    supabase: boolean
    cron: boolean
    xCredentials: boolean
    xMediaReady: boolean
    metaCredentials: boolean
    instagramMock: boolean
  }
}

const ChecklistItem = ({ label, isReady }: { label: string, isReady: boolean }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {isReady ? (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
        <CheckCircle2 className="w-4 h-4" /> Ready
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
        <XCircle className="w-4 h-4" /> Missing
      </span>
    )}
  </div>
)

export function SettingsClient({ initialSettings }: { initialSettings: SettingsType }) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateSettings(settings)
      alert('Settings saved successfully.')
    } catch {
      alert('Failed to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePlatform = (p: string) => {
    setSettings(prev => {
      const platforms = prev.default_platforms.includes(p)
        ? prev.default_platforms.filter(x => x !== p)
        : [...prev.default_platforms, p]
      return { ...prev, default_platforms: platforms }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings Form */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Application Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Timezone</label>
              <select
                value={settings.default_timezone}
                onChange={e => setSettings({ ...settings, default_timezone: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm"
              >
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="UTC">UTC</option>
                <option value="Africa/Accra">Africa/Accra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Platforms</label>
              <div className="flex gap-4">
                {['x', 'instagram', 'linkedin', 'facebook'].map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.default_platforms.includes(p)}
                      onChange={() => togglePlatform(p)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="capitalize">{p === 'x' ? 'X (Twitter)' : p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly X Spend Limit ($)</label>
              <input
                type="number"
                min="0"
                value={settings.monthly_x_spend_limit}
                onChange={e => setSettings({ ...settings, monthly_x_spend_limit: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Placeholder for future ad integration.</p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.mock_publishing}
                  onChange={e => setSettings({ ...settings, mock_publishing: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Enable Mock Publishing</div>
                  <div className="text-xs text-slate-500">Simulate API calls instead of posting to real accounts.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* API Readiness Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 className="font-semibold text-slate-900 mb-4">API Readiness Checklist</h3>
        <p className="text-xs text-slate-500 mb-4">
          Status of your environment variables and platform connections for real publishing.
        </p>
        
        <div className="space-y-3">
          <ChecklistItem label="Supabase Connection" isReady={settings.checklist.supabase} />
          <ChecklistItem label="Cron Secret" isReady={settings.checklist.cron} />
          <ChecklistItem label="X API Credentials & Encryption Key" isReady={settings.checklist.xCredentials} />
          <ChecklistItem label="X Media Upload Ready (v1.1)" isReady={settings.checklist.xMediaReady} />
          <ChecklistItem label="Meta API Credentials & Encryption Key" isReady={settings.checklist.metaCredentials} />
          <ChecklistItem label="Instagram Image Publishing" isReady={!settings.checklist.instagramMock && settings.checklist.metaCredentials} />
          <ChecklistItem label="Instagram Video/Reels Publishing" isReady={!settings.checklist.instagramMock && settings.checklist.metaCredentials} />
          <ChecklistItem label="Instagram Carousel Publishing" isReady={!settings.checklist.instagramMock && settings.checklist.metaCredentials} />
        </div>
      </div>
    </div>
  )
}
