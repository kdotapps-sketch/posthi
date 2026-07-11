import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { BulkScheduleClient } from './components/BulkScheduleClient'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Bulk Schedule' }

export default function BulkSchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Schedule"
        description="Upload a CSV file to schedule multiple posts at once."
      />
      <div className="card">
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>}>
          <BulkScheduleClient />
        </Suspense>
      </div>
    </div>
  )
}
