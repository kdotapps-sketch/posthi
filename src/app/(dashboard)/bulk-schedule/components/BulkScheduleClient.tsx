'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CsvUploader } from './CsvUploader'
import { BulkImportPreview } from './BulkImportPreview'
import { ImportHistory } from './ImportHistory'
import { getBulkImport } from '../actions'
import { Loader2 } from 'lucide-react'
import { BulkImport, BulkImportRow } from '@/types'

export function BulkScheduleClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const importId = searchParams.get('importId')
  
  const [importData, setImportData] = useState<{ importSession: BulkImport, rows: BulkImportRow[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadImport() {
      if (!importId) {
        setImportData(null)
        return
      }
      
      setIsLoading(true)
      setError(null)
      try {
        const data = await getBulkImport(importId)
        if (data) {
          setImportData(data)
        } else {
          setError('Import session not found.')
        }
      } catch {
        setError('Failed to load import session.')
      } finally {
        setIsLoading(false)
      }
    }

    loadImport()
  }, [importId])

  const handleImportSessionCreated = (id: string) => {
    router.push(`/bulk-schedule?importId=${id}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl text-center">
        {error}
        <div className="mt-4">
          <button 
            className="text-sm font-medium hover:underline"
            onClick={() => router.push('/bulk-schedule')}
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  if (importId && importData) {
    // If it's already imported or cancelled, maybe we just show it or show a message
    if (importData.importSession.status === 'imported') {
      return (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Import Completed</h3>
          <p className="text-slate-500 mb-6">
            Successfully imported {importData.importSession.imported_rows} posts.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={() => router.push('/bulk-schedule')}
            >
              Start New Import
            </button>
          </div>
        </div>
      )
    }

    return (
      <BulkImportPreview 
        importSession={importData.importSession} 
        rows={importData.rows} 
      />
    )
  }

  return (
    <div>
      <CsvUploader onImportSessionCreated={handleImportSessionCreated} />
      <ImportHistory />
    </div>
  )
}
