'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PenSquare,
  CalendarRange,
  CalendarDays,
  Image,
  Link2,
  Hash,
  ScrollText,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed?: boolean
  onClose?: () => void
  isMobile?: boolean
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Create Post', href: '/create-post', icon: PenSquare },
  { label: 'Bulk Schedule', href: '/bulk-schedule', icon: CalendarRange },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Media Library', href: '/media-library', icon: Image },
  { label: 'Connected Accounts', href: '/connected-accounts', icon: Link2 },
  { label: 'Hashtag Sets', href: '/hashtag-sets', icon: Hash },
  { label: 'Publishing Logs', href: '/publishing-logs', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ collapsed = false, onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-slate-100',
        collapsed && !isMobile ? 'w-16' : 'w-64',
        'transition-all duration-200 ease-in-out'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b border-slate-100 flex-shrink-0',
          collapsed && !isMobile ? 'h-16 justify-center px-2' : 'h-16 px-4 gap-2'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-bold text-lg text-slate-900 tracking-tight">Posthi</span>
          )}
        </Link>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={isMobile && onClose ? onClose : undefined}
                  className={cn(
                    'sidebar-nav-item',
                    isActive && 'active',
                    collapsed && !isMobile && 'justify-center px-0 w-10 mx-auto'
                  )}
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={cn('flex-shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')}
                  />
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div className="px-4 py-4 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center">
            Posthi v0.1 · Mock mode
          </p>
        </div>
      )}

      {/* Collapse hint for desktop */}
      {!isMobile && (
        <div className="px-2 py-2 border-t border-slate-100 flex-shrink-0">
          <div className="flex justify-center">
            <div className={cn('w-1.5 h-1.5 rounded-full bg-emerald-400', 'animate-pulse')} title="Connected" />
          </div>
        </div>
      )}
    </aside>
  )
}
