'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Platform } from '@/types'

export async function createSinglePost(data: {
  caption: string
  platforms: Platform[]
  scheduledAt: string | null // ISO string or null for draft
  mediaAssetIds: string[]
}) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { caption, platforms, scheduledAt, mediaAssetIds } = data

  if (platforms.length === 0) {
    return { success: false, error: 'Select at least one platform.' }
  }
  if (!caption) {
    return { success: false, error: 'Caption is required.' }
  }

  // 1. Insert into posts
  const postStatus = scheduledAt ? 'scheduled' : 'draft'
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userData.user.id,
      caption,
      status: postStatus,
      scheduled_at: scheduledAt,
      timezone: 'UTC' // simplified for now, assuming UTC from client ISO string
    })
    .select('id')
    .single()

  if (postError) {
    console.error('Error creating post:', postError)
    return { success: false, error: postError.message }
  }

  const postId = postData.id

  // 2. Insert into post_targets
  const targetsToInsert = platforms.map(platform => ({
    post_id: postId,
    platform: platform,
    status: 'pending'
  }))

  const { error: targetsError } = await supabase
    .from('post_targets')
    .insert(targetsToInsert)

  if (targetsError) {
    console.error('Error creating post targets:', targetsError)
    return { success: false, error: targetsError.message }
  }

  // 3. Insert into post_media
  if (mediaAssetIds.length > 0) {
    const mediaToInsert = mediaAssetIds.map((assetId, index) => ({
      post_id: postId,
      media_asset_id: assetId,
      display_order: index
    }))

    const { error: mediaError } = await supabase
      .from('post_media')
      .insert(mediaToInsert)

    if (mediaError) {
      console.error('Error attaching media:', mediaError)
      return { success: false, error: mediaError.message }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}
