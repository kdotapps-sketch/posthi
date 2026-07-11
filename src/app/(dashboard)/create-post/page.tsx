import { getMediaAssets } from '../media-library/actions'
import { getHashtagSets } from '../hashtag-sets/actions'
import { PostComposer } from './components/PostComposer'

export const metadata = {
  title: 'Create Post | Posthi',
  description: 'Schedule a new social media post',
}

export default async function CreatePostPage() {
  const media = await getMediaAssets()
  const hashtagSets = await getHashtagSets()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Post</h1>
        <p className="text-slate-500 mt-2">
          Write your caption, attach media, and schedule it for publishing.
        </p>
      </div>

      <PostComposer mediaAssets={media} hashtagSets={hashtagSets} />
    </div>
  )
}
