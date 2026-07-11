'use client'

import { useState } from 'react'
import { SocialAccount } from '@/types'
import { disconnectSocialAccount } from '../actions'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

interface SocialAccountsManagerProps {
  initialAccounts: SocialAccount[]
}

export function SocialAccountsManager({ initialAccounts }: SocialAccountsManagerProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts)
  const [isConnecting, setIsConnecting] = useState(false)
  const [platform, setPlatform] = useState<'x' | 'instagram'>('x')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    setError(null)
    
    if (platform === 'x') {
      window.location.href = '/api/oauth/x/start'
      return
    }

    if (platform === 'instagram') {
      window.location.href = '/api/oauth/instagram/start'
      return
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    
    // Optimistic update
    const previous = [...accounts]
    setAccounts(accounts.filter(a => a.id !== id))
    
    try {
      await disconnectSocialAccount(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect account')
      setAccounts(previous)
    }
  }

  const [isTesting, setIsTesting] = useState<string | null>(null)

  const handleTestPost = async (accountId: string) => {
    if (!confirm('Are you sure you want to send a live test post to X?')) return
    setIsTesting(accountId)
    try {
      const res = await fetch('/api/x/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_account_id: accountId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      alert('Test post published successfully! URL: ' + (data.external_post_url || ''))
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsTesting(null)
    }
  }

  const handleTestPostInstagram = async (accountId: string) => {
    if (!confirm('Are you sure you want to send a live test image to Instagram?')) return
    setIsTesting(accountId)
    try {
      const res = await fetch('/api/instagram/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_account_id: accountId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      alert('Instagram test post published successfully! ID: ' + (data.external_post_id || ''))
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsTesting(null)
    }
  }

  const handleTestPostInstagramReel = async (accountId: string) => {
    if (!confirm('Are you sure you want to send a live test reel to Instagram?')) return
    setIsTesting(accountId)
    try {
      const res = await fetch('/api/instagram/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_account_id: accountId, media_type: 'video' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      alert('Instagram test reel published successfully! ID: ' + (data.external_post_id || ''))
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsTesting(null)
    }
  }

  const handleTestPostInstagramCarousel = async (accountId: string) => {
    if (!confirm('Are you sure you want to send a live test carousel to Instagram?')) return
    setIsTesting(accountId)
    try {
      const res = await fetch('/api/instagram/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_account_id: accountId, media_type: 'carousel' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      alert('Instagram test carousel published successfully! ID: ' + (data.external_post_id || ''))
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsTesting(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Connected Accounts</h2>
        <p className="text-sm text-slate-500 mt-1">
          Connect your social media accounts to publish directly to them.
        </p>
      </div>

      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</label>
            <select 
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'x' | 'instagram')}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            >
              <option value="x">X / Twitter</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          
          <div className="flex-[2] space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</label>
            <div className="text-sm text-slate-600 mt-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
              Posthi uses official {platform === 'x' ? 'X' : 'Meta/Instagram'} APIs and will securely redirect you to authorize. We never ask for your password.
            </div>
          </div>

          <button
            type="submit"
            disabled={isConnecting}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shrink-0"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Connect
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="p-6">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No social accounts connected yet.
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    account.platform === 'x' ? 'bg-sky-500' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'
                  }`}>
                    {account.platform === 'x' ? <XIcon className="w-5 h-5" /> : <InstagramIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">@{account.username || 'unknown'}</p>
                    <p className="text-xs text-slate-500 capitalize">{account.platform}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {account.platform === 'x' && (
                    <button
                      onClick={() => handleTestPost(account.id)}
                      disabled={isTesting === account.id}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isTesting === account.id ? 'Testing...' : 'Test Post'}
                    </button>
                  )}
                  {account.platform === 'instagram' && (
                    <>
                      <button
                        onClick={() => handleTestPostInstagram(account.id)}
                        disabled={isTesting === account.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isTesting === account.id ? 'Testing...' : 'Test Image'}
                      </button>
                      <button
                        onClick={() => handleTestPostInstagramReel(account.id)}
                        disabled={isTesting === account.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isTesting === account.id ? 'Testing...' : 'Test Reel'}
                      </button>
                      <button
                        onClick={() => handleTestPostInstagramCarousel(account.id)}
                        disabled={isTesting === account.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isTesting === account.id ? 'Testing...' : 'Test Carousel'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Disconnect account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
