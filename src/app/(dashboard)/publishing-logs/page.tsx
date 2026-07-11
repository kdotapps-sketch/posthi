import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { PublishingLogsClient, type LogItem } from './components/PublishingLogsClient'
import { getPublishingLogs } from './actions'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Publishing Logs' }

export default async function PublishingLogsPage() {
  const logs = await getPublishingLogs()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publishing Logs"
        description="Track every publish attempt and retry failed posts."
      />
      <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>}>
        <PublishingLogsClient initialLogs={logs as LogItem[]} />
      </Suspense>
    </div>
  )
}
