import { getSettings } from './actions'
import { SettingsClient } from './components/SettingsClient'

export const metadata = {
  title: 'Settings | Posthi',
  description: 'Manage your Posthi account settings',
}

export default async function SettingsPage() {
  const settings = await getSettings()

  if (!settings) {
    return <div>Error loading settings</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">
          Manage your application preferences and account details.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  )
}
