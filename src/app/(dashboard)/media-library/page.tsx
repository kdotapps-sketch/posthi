import { getMediaAssets } from './actions'
import { MediaUploader } from './components/MediaUploader'
import { MediaGallery } from './components/MediaGallery'

export const metadata = {
  title: 'Media Library | Posthi',
  description: 'Manage your social media assets',
}

export default async function MediaPage() {
  const media = await getMediaAssets()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Media Library</h1>
        <p className="text-slate-500 mt-2">
          Upload and manage images and videos for your social media posts.
        </p>
      </div>

      <MediaUploader />
      <MediaGallery initialMedia={media} />
    </div>
  )
}
