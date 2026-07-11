'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, PenSquare, CalendarRange, LogOut, User, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/create-post': 'Create Post',
  '/bulk-schedule': 'Bulk Schedule',
  '/calendar': 'Calendar',
  '/media-library': 'Media Library',
  '/connected-accounts': 'Connected Accounts',
  '/hashtag-sets': 'Hashtag Sets',
  '/publishing-logs': 'Publishing Logs',
  '/settings': 'Settings',
}

interface TopbarProps {
  onMenuClick: () => void
  userEmail?: string
  userName?: string
}

export function Topbar({ onMenuClick, userEmail, userName }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const pageTitle = PAGE_TITLES[pathname] || 'Posthi'

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } finally {
      setSigningOut(false)
    }
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 z-10">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-slate-900">{pageTitle}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/create-post"
          className={cn(
            'hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
            pathname === '/create-post'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <PenSquare size={15} />
          <span>Create Post</span>
        </Link>

        <Link
          href="/bulk-schedule"
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <CalendarRange size={15} />
          <span className="hidden sm:inline">Bulk Schedule</span>
          <span className="sm:hidden">Bulk</span>
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <ChevronDown size={14} className={cn('text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg shadow-slate-200/70 border border-slate-100 py-1 z-20 animate-fade-in">
                {(userName || userEmail) && (
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    {userName && <p className="text-sm font-medium text-slate-900">{userName}</p>}
                    {userEmail && <p className="text-xs text-slate-500 truncate">{userEmail}</p>}
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={15} className="text-slate-400" />
                  Settings
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
