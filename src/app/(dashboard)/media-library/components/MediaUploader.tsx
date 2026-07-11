'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { registerMediaAsset } from '../actions'
import { UploadCloud, Image as ImageIcon, Film, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function MediaUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

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
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFiles = async (files: File[]) => {
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    if (mediaFiles.length === 0) {
      toast.error('Please select valid image or video files.')
      return
    }

    if (mediaFiles.length > 5) {
      toast.error('Please upload a maximum of 5 files at a time.')
      return
    }

    setIsUploading(true)
    let successCount = 0

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      if (authError || !userData.user) {
        throw new Error('You must be logged in to upload.')
      }

      for (const file of mediaFiles) {
        // Generate a unique filename to prevent collisions
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const fileExt = file.name.split('.').pop()
        const storageFilename = `${timestamp}-${randomString}.${fileExt}`
        const storagePath = `${userData.user.id}/${storageFilename}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
          .storage
          .from('posthi-media')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
          continue
        }

        // Register in DB
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
        
        const result = await registerMediaAsset({
          filename: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
          media_type: mediaType,
        })

        if (!result.success) {
          toast.error(`Failed to register ${file.name}: ${result.error}`)
          // Ideally we would clean up the orphaned storage file here, but keeping it simple for now
          continue
        }

        successCount++
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s).`)
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred during upload.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50/50' 
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          multiple
          accept="image/*,video/*"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-800">Uploading Media...</p>
              <p className="text-sm text-slate-500">Please wait while your files upload.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="w-14 h-14 rounded-full bg-fuchsia-50 flex items-center justify-center text-fuchsia-500 shadow-sm border border-fuchsia-100">
                <Film className="w-6 h-6" />
              </div>
            </div>
            
            <div>
              <p className="text-lg font-semibold text-slate-800">
                Drag and drop your media here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports Images (PNG, JPG, WEBP) and Videos (MP4, MOV). Up to 5 files at once.
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
