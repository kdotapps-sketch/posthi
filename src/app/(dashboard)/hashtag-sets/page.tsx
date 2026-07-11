import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { HashtagSetsClient } from './components/HashtagSetsClient'
import { getHashtagSets } from './actions'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Hashtag Sets' }

export default async function HashtagSetsPage() {
  const sets = await getHashtagSets()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hashtag Sets"
        description="Save groups of hashtags to quickly apply them when creating posts."
      />
      <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>}>
        <HashtagSetsClient initialSets={sets} />
      </Suspense>
    </div>
  )
}
