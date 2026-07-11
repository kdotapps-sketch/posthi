'use client'

import { useState } from 'react'
import { Platform, MediaAsset, HashtagSet } from '@/types'
import { createSinglePost } from '../actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ImageIcon, X, Loader2, CalendarClock, PenTool, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PostComposer({ mediaAssets, hashtagSets }: { mediaAssets: MediaAsset[], hashtagSets?: HashtagSet[] }) {
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)

  const togglePlatform = (platform: Platform) => {
    setPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id)
      if (prev.length >= 10) {
        toast.error('You can only attach up to 10 media items.')
        return prev
      }
      return [...prev, id]
    })
  }

  const moveMedia = (id: string, direction: 'left' | 'right') => {
    setSelectedMediaIds(prev => {
      const idx = prev.indexOf(id)
      if (idx === -1) return prev
      if (direction === 'left' && idx === 0) return prev
      if (direction === 'right' && idx === prev.length - 1) return prev

      const next = [...prev]
      const swapIdx = direction === 'left' ? idx - 1 : idx + 1
      next[idx] = next[swapIdx]
      next[swapIdx] = id
      return next
    })
  }

  const handleSubmit = async () => {
    if (!caption) {
      toast.error('Caption is required.')
      return
    }
    if (platforms.length === 0) {
      toast.error('Select at least one platform.')
      return
    }

    let scheduledAt = null
    if (scheduledDate && scheduledTime) {
      const dt = new Date(`${scheduledDate}T${scheduledTime}`)
      if (isNaN(dt.getTime())) {
        toast.error('Invalid date or time.')
        return
      }
      scheduledAt = dt.toISOString()
    } else if (scheduledDate || scheduledTime) {
      toast.error('Provide both date and time to schedule, or leave both blank for draft.')
      return
    }

    const selectedAssets = mediaAssets.filter(m => selectedMediaIds.includes(m.id))
    const hasVideo = selectedAssets.some(m => m.media_type === 'video')

    if (platforms.includes('x') && selectedAssets.length > 4) {
      toast.error('X (Twitter) only supports up to 4 media items.')
      return
    }

    if (platforms.includes('instagram')) {
      if (selectedAssets.length > 10) {
        toast.error('Instagram Carousels only support up to 10 media items.')
        return
      }
      
      if (hasVideo) {
        const invalidVideos = selectedAssets.filter(v => 
          v.media_type === 'video' && 
          v.mime_type !== 'video/mp4' && 
          v.mime_type !== 'video/quicktime' && 
          v.mime_type !== 'video/mov'
        )
        if (invalidVideos.length > 0) {
          toast.error('Instagram videos must be MP4 or MOV format.')
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      const result = await createSinglePost({
        caption,
        platforms,
        scheduledAt,
        mediaAssetIds: selectedMediaIds
      })

      if (result.success) {
        toast.success(scheduledAt ? 'Post scheduled successfully!' : 'Draft saved successfully!')
        router.push('/dashboard')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMediaFiles = mediaAssets.filter(m => selectedMediaIds.includes(m.id))
  const hasVideo = selectedMediaFiles.some(m => m.media_type === 'video')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Composer */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Platforms */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-3">1. Select Platforms</label>
          <div className="flex gap-4">
            <button
              onClick={() => togglePlatform('x')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                platforms.includes('x') ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center font-bold font-serif text-lg leading-none">
                𝕏
              </div>
              <span className="font-medium">X (Twitter)</span>
              {platforms.includes('x') && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </button>

            <button
              onClick={() => togglePlatform('instagram')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                platforms.includes('instagram') ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-white rounded-sm"></div>
              </div>
              <span className="font-medium">
                Instagram {platforms.includes('instagram') && selectedMediaFiles.length > 1 ? '(Carousel)' : platforms.includes('instagram') && hasVideo ? '(Reel)' : ''}
              </span>
              {platforms.includes('instagram') && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </div>

        {/* Caption */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <label className="block text-sm font-medium text-slate-700">2. Write Caption</label>
            <div className="flex items-center gap-4">
              {hashtagSets && hashtagSets.length > 0 && (
                <select
                  className="text-xs border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-indigo-500"
                  onChange={(e) => {
                    const setId = e.target.value
                    if (!setId) return
                    const set = hashtagSets.find(s => s.id === setId)
                    if (set) {
                      setCaption(prev => prev ? `${prev}\n\n${set.hashtags.join(' ')}` : set.hashtags.join(' '))
                    }
                    e.target.value = ''
                  }}
                >
                  <option value="">Insert Hashtag Set...</option>
                  {hashtagSets.map(set => (
                    <option key={set.id} value={set.id}>{set.name}</option>
                  ))}
                </select>
              )}
              <span className={`text-xs ${caption.length > 280 && platforms.includes('x') ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {caption.length} {platforms.includes('x') && '/ 280'}
              </span>
            </div>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What do you want to share?"
            className="w-full h-40 p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />

          {/* Media Attachments Preview */}
          {selectedMediaFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Attached Media ({selectedMediaFiles.length})</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedMediaIds.map((id, index) => {
                  const m = selectedMediaFiles.find(asset => asset.id === id)
                  if (!m) return null
                  return (
                    <div key={m.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 group">
                      {m.media_type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.public_url || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-xs">Video</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-1">
                        <button 
                          onClick={(e) => { e.preventDefault(); moveMedia(m.id, 'left') }}
                          disabled={index === 0}
                          className="p-1 bg-white/20 hover:bg-white/40 text-white rounded disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); moveMedia(m.id, 'right') }}
                          disabled={index === selectedMediaIds.length - 1}
                          className="p-1 bg-white/20 hover:bg-white/40 text-white rounded disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleMediaSelection(m.id) }}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            className="mt-4 w-full border-dashed"
            onClick={() => setIsMediaModalOpen(true)}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Attach Media from Library
          </Button>
        </div>
      </div>

      {/* RIGHT COLUMN: Scheduling & Submit */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            3. Schedule
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 bg-slate-50 p-2 rounded">
            Leave date and time blank to save as a Draft.
          </p>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PenTool className="w-5 h-5 mr-2" />}
          {scheduledDate ? 'Schedule Post' : 'Save Draft'}
        </Button>
      </div>

      {/* Media Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Select Media</h3>
                <p className="text-xs text-slate-500">Attach up to 10 items to your post</p>
              </div>
              <button 
                onClick={() => setIsMediaModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {mediaAssets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">Your media library is empty.</p>
                  <Button variant="link" onClick={() => router.push('/media-library')}>Go to Media Library</Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {mediaAssets.map(m => {
                    const isSelected = selectedMediaIds.includes(m.id)
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => toggleMediaSelection(m.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 ring-offset-1' : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        {m.media_type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.public_url || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-xs">Video</div>
                        )}
                        
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsMediaModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsMediaModalOpen(false)}>
                Confirm Selection ({selectedMediaIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
