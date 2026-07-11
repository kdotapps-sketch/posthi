'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { getBulkImportsHistory } from '../history-actions'
import { BulkImport } from '@/types'
import { Loader2, FileClock } from 'lucide-react'

export function ImportHistory() {
  const [history, setHistory] = useState<BulkImport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getBulkImportsHistory()
        setHistory(data)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (history.length === 0) {
    return null
  }

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center gap-2 text-slate-800">
        <FileClock className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold">Recent Imports</h3>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Filename</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total Rows</th>
                <th className="px-4 py-3 font-medium">Imported</th>
                <th className="px-4 py-3 font-medium">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.filename}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      item.status === 'imported' ? 'bg-green-100 text-green-700' :
                      item.status === 'failed' ? 'bg-red-100 text-red-700' :
                      item.status === 'cancelled' ? 'bg-slate-100 text-slate-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.total_rows}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{item.imported_rows}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{item.failed_rows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
