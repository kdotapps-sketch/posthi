import { getSocialAccounts } from '../settings/actions'
import { SocialAccountsManager } from '../settings/components/SocialAccountsManager'

export const metadata = {
  title: 'Connected Accounts | Posthi',
  description: 'Manage your connected social accounts',
}

export default async function ConnectedAccountsPage() {
  const accounts = await getSocialAccounts()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Connected Accounts</h1>
        <p className="text-slate-500 mt-2">
          Manage your connected social media profiles.
        </p>
      </div>

      <SocialAccountsManager initialAccounts={accounts} />
    </div>
  )
}
