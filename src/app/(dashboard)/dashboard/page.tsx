import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  CalendarClock,
  CalendarCheck,
  AlertCircle,
  Link2,
  Layers,
  PenSquare,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

function getTomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const tomorrow = getTomorrowISO()

  if (!user) {
    return null
  }

  // Fetch stats in parallel
  const [scheduledRes, dueRes, failedRes, accountsRes, recentPostsRes, bulkRes] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'scheduled'),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .lte('scheduled_at', tomorrow),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'failed'),
    supabase.from('social_accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'connected'),
    supabase
      .from('posts')
      .select('id, caption, status, scheduled_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('bulk_imports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const stats = [
    {
      label: 'Scheduled Posts',
      value: scheduledRes.count ?? 0,
      icon: CalendarClock,
      href: '/calendar',
      color: 'indigo',
    },
    {
      label: 'Due Today',
      value: dueRes.count ?? 0,
      icon: CalendarCheck,
      href: '/calendar',
      color: 'amber',
    },
    {
      label: 'Failed Posts',
      value: failedRes.count ?? 0,
      icon: AlertCircle,
      href: '/publishing-logs',
      color: 'red',
    },
    {
      label: 'Connected Accounts',
      value: accountsRes.count ?? 0,
      icon: Link2,
      href: '/connected-accounts',
      color: 'emerald',
    },
    {
      label: 'Bulk Imports',
      value: bulkRes.count ?? 0,
      icon: Layers,
      href: '/bulk-schedule',
      color: 'violet',
    },
  ]

  const recentPosts = recentPostsRes.data ?? []

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your content overview at a glance."
      >
        <Link
          href="/create-post"
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          <PenSquare size={15} />
          New Post
        </Link>
      </PageHeader>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
            indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-100' },
            amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
            red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-100' },
            emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
            violet: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-100' },
          }
          const colors = colorMap[stat.color]

          return (
            <Link href={stat.href} key={stat.label} className="stat-card group block">
              <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={colors.icon} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-0.5">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium leading-snug">{stat.label}</div>
            </Link>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Posts</h3>
            <Link
              href="/calendar"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <PenSquare size={18} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No posts yet</p>
              <p className="text-xs text-slate-400 mb-4">Create your first post to get started</p>
              <Link
                href="/create-post"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create a post →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPosts.map((post) => (
                <li key={post.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">
                        {post.caption}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {post.scheduled_at
                          ? `Scheduled for ${new Date(post.scheduled_at).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : `Created ${formatRelativeTime(post.created_at)}`}
                      </p>
                    </div>
                    <StatusBadge status={post.status} className="flex-shrink-0 mt-0.5" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-indigo-500" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Create a post', href: '/create-post', icon: PenSquare, desc: 'Write and schedule content' },
                { label: 'Bulk schedule', href: '/bulk-schedule', icon: Layers, desc: 'Import posts from CSV' },
                { label: 'View calendar', href: '/calendar', icon: CalendarClock, desc: 'See your content plan' },
                { label: 'Upload media', href: '/media-library', icon: Link2, desc: 'Add images & videos' },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Icon size={15} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{action.label}</p>
                      <p className="text-xs text-slate-400">{action.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mock mode notice */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-xs font-semibold text-amber-800 mb-1">🧪 Mock Mode Active</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Posthi is running in mock publishing mode. Posts will be simulated, not sent to real platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
