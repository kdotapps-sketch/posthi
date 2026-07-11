'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { retryPost } from '../actions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ScrollText, ExternalLink, RotateCcw, Filter } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export type LogItem = {
  id: string
  post_id: string
  post_target_id: string
  attempt_number: number
  status: string
  error_message: string | null
  external_post_url: string | null
  created_at: string
  posts: {
    caption: string
    user_id: string
  } | null
  post_targets: {
    platform: string
  } | null
  response_data?: Record<string, unknown>
}

export function PublishingLogsClient({ initialLogs }: { initialLogs: LogItem[] }) {
  const [logs] = useState<LogItem[]>(initialLogs)
  const [isRetrying, setIsRetrying] = useState<string | null>(null)
  
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const platformMatch = platformFilter === 'all' || log.post_targets?.platform === platformFilter
      const statusMatch = statusFilter === 'all' || log.status === statusFilter
      return platformMatch && statusMatch
    })
  }, [logs, platformFilter, statusFilter])

  const handleRetry = async (postId: string) => {
    if (!confirm('Are you sure you want to retry this post? Targets that already succeeded will be skipped.')) return
    
    setIsRetrying(postId)
    try {
      await retryPost(postId)
      alert('Post scheduled for retry.')
      // In a real app we might refetch logs or just refresh the page
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Failed to retry post.')
    } finally {
      setIsRetrying(null)
    }
  }

  if (logs.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={ScrollText}
          title="No publishing logs yet"
          description="Once posts are published, every attempt will be logged here."
          actionLabel="View scheduled posts"
          actionHref="/calendar"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700">Filters:</span>
        </div>
        
        <select 
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
        >
          <option value="all">All Platforms</option>
          <option value="x">X (Twitter)</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
        </select>

        <select 
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Post Snippet</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempt</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium capitalize">
                    {log.post_targets?.platform || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {log.posts?.caption || 'No caption'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 text-center">
                    {log.attempt_number}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} />
                    {log.response_data && (
                      <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto max-w-xs border border-slate-100 mt-2">
                        {JSON.stringify(log.response_data, null, 2)}
                      </pre>
                    )}
                    {log.error_message && (
                      <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={log.error_message}>
                        {log.error_message}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(log.post_id)}
                          disabled={isRetrying === log.post_id}
                          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isRetrying === log.post_id ? 'animate-spin' : ''}`} />
                          {isRetrying === log.post_id ? 'Retrying...' : 'Retry Post'}
                        </button>
                      )}
                      {log.external_post_url && (
                        <a 
                          href={log.external_post_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
