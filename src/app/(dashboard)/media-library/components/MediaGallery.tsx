'use client'

import { useState } from 'react'
import { MediaAsset } from '@/types'
import { deleteMediaAsset } from '../actions'
import { toast } from 'sonner'
import { Trash2, Film, ImageIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export function MediaGallery({ initialMedia }: { initialMedia: MediaAsset[] }) {
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return

    setDeletingId(id)
    try {
      const result = await deleteMediaAsset(id, storagePath)
      if (result.success) {
        setMedia(prev => prev.filter(m => m.id !== id))
        toast.success('Media deleted successfully.')
      } else {
        toast.error(`Failed to delete media: ${result.error}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred.')
    } finally {
      setDeletingId(null)
    }
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 mt-8">
        <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No media yet</h3>
        <p className="text-slate-500 mt-1">Upload images or videos to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
      {media.map((item) => (
        <div 
          key={item.id} 
          className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Media Preview */}
          <div className="aspect-square bg-slate-100 relative">
            {item.media_type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={item.public_url || ''} 
                alt={item.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <Film className="w-8 h-8 text-slate-300" />
                <video 
                  src={item.public_url || ''} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                  muted
                  playsInline
                />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
              <button
                onClick={() => handleDelete(item.id, item.storage_path)}
                disabled={deletingId === item.id}
                className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                title="Delete media"
              >
                {deletingId === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="p-3">
            <p className="text-sm font-medium text-slate-800 truncate" title={item.filename}>
              {item.filename}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">
                {(item.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-slate-400">
                {format(new Date(item.created_at), 'MMM d')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
