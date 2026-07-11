import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: number
  className?: string
  label?: string
  fullPage?: boolean
}

export function LoadingSpinner({ size = 24, className, label, fullPage }: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="text-indigo-500 animate-spin" size={32} />
        {label && <p className="text-sm text-slate-500">{label}</p>}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className="text-indigo-500 animate-spin" size={size} />
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </div>
  )
}
