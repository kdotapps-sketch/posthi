import { POST_STATUS_COLORS, POST_STATUS_LABELS } from '@/lib/utils'
import type { PostStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: PostStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = POST_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-500'
  const label = POST_STATUS_LABELS[status] ?? status

  return (
    <span className={cn('badge', colorClass, className)}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          status === 'published' && 'bg-emerald-500',
          status === 'scheduled' && 'bg-indigo-500',
          status === 'publishing' && 'bg-amber-500 animate-pulse',
          status === 'failed' && 'bg-red-500',
          status === 'draft' && 'bg-slate-400',
          status === 'cancelled' && 'bg-slate-300',
        )}
      />
      {label}
    </span>
  )
}
