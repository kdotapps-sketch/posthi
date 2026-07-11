'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { UploadCloud, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { validateBulkImport } from '../actions'

interface CsvUploaderProps {
  onImportSessionCreated: (id: string) => void
}

export function CsvUploader({ onImportSessionCreated }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file')
      return
    }

    setIsUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            console.error('CSV parse errors:', results.errors)
            toast.error('Error parsing CSV file format.')
            setIsUploading(false)
            return
          }

          if (results.data.length === 0) {
            toast.error('CSV file is empty')
            setIsUploading(false)
            return
          }

          if (results.data.length > 500) {
            toast.error('Maximum 500 rows allowed per import')
            setIsUploading(false)
            return
          }

          // Process server action
          const importId = await validateBulkImport(file.name, results.data as Record<string, unknown>[])
          onImportSessionCreated(importId)
          toast.success('CSV uploaded and validated')
        } catch (error: unknown) {
          console.error(error)
          toast.error((error as Error).message || 'Failed to process CSV file')
        } finally {
          setIsUploading(false)
        }
      },
      error: (error) => {
        console.error(error)
        toast.error('Failed to parse CSV file')
        setIsUploading(false)
      }
    })
  }

  const downloadTemplate = () => {
    const csvContent = "caption,platforms,scheduled_at,timezone,media_filename,first_comment,status\nMy amazing post!,x,2026-10-01T12:00:00,Europe/London,,First comment!,scheduled\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'posthi_bulk_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
            {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          {isUploading ? 'Uploading & Validating...' : 'Upload CSV File'}
        </h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Drag and drop your CSV file here, or click to browse. Maximum 500 rows per file.
        </p>
        
        <div className="flex justify-center">
          <label htmlFor="csv-upload">
            <Button disabled={isUploading} asChild>
              <span>Browse Files</span>
            </Button>
            <input 
              id="csv-upload" 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <div className="flex items-start gap-4">
          <FileText className="w-6 h-6 text-slate-400 shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-slate-900 mb-2">CSV Format Guide</h4>
            <div className="text-sm text-slate-600 space-y-2 mb-4">
              <p>Your CSV must include a header row with exact column names:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">caption</code> (required): The post text.</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">platforms</code> (required): &quot;x&quot;, &quot;instagram&quot;, or &quot;x,instagram&quot;.</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">scheduled_at</code> (required if scheduled): ISO 8601 date.</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">timezone</code>: e.g. &quot;Europe/London&quot;.</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">media_filename</code>: Exact filename(s) in your Media Library (comma or pipe separated).</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">first_comment</code>: Text for first comment (Instagram).</li>
                <li><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">status</code>: &quot;draft&quot; or &quot;scheduled&quot;.</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
