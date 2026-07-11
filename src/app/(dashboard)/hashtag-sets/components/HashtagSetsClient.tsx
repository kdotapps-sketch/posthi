'use client'

import { useState } from 'react'
import { HashtagSet } from '@/types'
import { createHashtagSet, updateHashtagSet, deleteHashtagSet } from '../actions'
import { Hash, Plus, Trash2, Edit2, Copy, Check, X } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export function HashtagSetsClient({ initialSets }: { initialSets: HashtagSet[] }) {
  const [sets] = useState<HashtagSet[]>(initialSets)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [formData, setFormData] = useState({ name: '', hashtags: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCopy = (id: string, hashtags: string[]) => {
    navigator.clipboard.writeText(hashtags.join(' '))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const startCreate = () => {
    setIsCreating(true)
    setIsEditing(null)
    setFormData({ name: '', hashtags: '' })
  }

  const startEdit = (set: HashtagSet) => {
    setIsEditing(set.id)
    setIsCreating(false)
    setFormData({ name: set.name, hashtags: set.hashtags.join(' ') })
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setIsCreating(false)
    setFormData({ name: '', hashtags: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.hashtags.trim()) return

    setIsSubmitting(true)
    const hashtagsArray = formData.hashtags
      .split(/[\s,]+/)
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)

    try {
      if (isCreating) {
        await createHashtagSet(formData.name.trim(), hashtagsArray)
      } else if (isEditing) {
        await updateHashtagSet(isEditing, formData.name.trim(), hashtagsArray)
      }
      // Reload page for simplicity
      window.location.reload()
    } catch {
      alert('Failed to save hashtag set')
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hashtag set?')) return
    try {
      await deleteHashtagSet(id)
      window.location.reload()
    } catch {
      alert('Failed to delete hashtag set')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!isCreating && !isEditing && (
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Set
          </button>
        )}
      </div>

      {(isCreating || isEditing) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-900">
              {isCreating ? 'Create Hashtag Set' : 'Edit Hashtag Set'}
            </h3>
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Set Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Real Estate General"
                className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hashtags</label>
              <textarea
                required
                value={formData.hashtags}
                onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="e.g. #realestate #forsale #homes (spaces or commas work)"
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Set'}
              </button>
            </div>
          </form>
        </div>
      )}

      {sets.length === 0 && !isCreating ? (
        <div className="card">
          <EmptyState
            icon={Hash}
            title="No hashtag sets yet"
            description="Create sets of hashtags like #GhanaFood or #TechTips and apply them instantly when writing posts."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sets.map(set => (
            <div key={set.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">{set.name}</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(set.id, set.hashtags)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Copy hashtags"
                  >
                    {copiedId === set.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(set)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit set"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-3">
                {set.hashtags.join(' ')}
              </div>
              <div className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
                {set.hashtags.length} hashtags
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
