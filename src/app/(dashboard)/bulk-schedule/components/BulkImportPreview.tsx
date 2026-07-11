'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { executeBulkImport, cancelBulkImport } from '../actions'

import { BulkImport, BulkImportRow } from '@/types'

interface BulkImportPreviewProps {
  importSession: BulkImport
  rows: BulkImportRow[]
}

export function BulkImportPreview({ importSession, rows }: BulkImportPreviewProps) {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const result = await executeBulkImport(importSession.id)
      if (result.success) {
        toast.success(`Successfully imported ${result.imported} posts.`)
        if (result.failed && result.failed > 0) {
          toast.error(`${result.failed} posts failed to import.`)
        }
        router.push('/dashboard') // or to /publishing-logs
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to execute import')
      setIsImporting(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await cancelBulkImport(importSession.id)
      toast.success('Import cancelled')
      router.push('/bulk-schedule')
    } catch {
      toast.error('Failed to cancel import')
      setIsCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'valid') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> Valid</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Invalid</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-slate-500" onClick={() => router.push('/bulk-schedule')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h3 className="text-lg font-semibold text-slate-900">Preview Import</h3>
          <p className="text-sm text-slate-500">Review your posts before importing them.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isImporting || isCancelling}>
            {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || isCancelling || importSession.valid_rows === 0}>
            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Import {importSession.valid_rows} Valid Rows
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Rows</p>
          <p className="text-2xl font-bold text-slate-900">{importSession.total_rows}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
          <p className="text-sm text-green-600 mb-1">Valid Rows</p>
          <p className="text-2xl font-bold text-green-700">{importSession.valid_rows}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
          <p className="text-sm text-red-600 mb-1">Invalid Rows</p>
          <p className="text-2xl font-bold text-red-700">{importSession.invalid_rows}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Row</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Platforms</th>
                <th className="px-4 py-3 font-medium max-w-xs">Caption</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.id} className={row.row_status === 'invalid' ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3 text-slate-500 font-medium">{row.row_number}</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(row.row_status)}
                    {row.validation_errors && row.validation_errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {row.validation_errors.map((err: string, i: number) => (
                          <div key={i} className="flex items-start text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.platforms?.map((p: string) => (
                        <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs capitalize">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={row.caption || undefined}>
                    {row.caption || <span className="text-slate-400 italic">No caption</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {row.status === 'draft' ? (
                      <span className="text-slate-400 italic">Draft</span>
                    ) : row.scheduled_at ? (
                      format(new Date(row.scheduled_at), 'MMM d, yyyy HH:mm')
                    ) : (
                      <span className="text-slate-400">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.media_filename ? (
                      <span className={row.media_asset_id ? "text-green-600" : "text-red-500"}>
                        {row.media_filename}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
