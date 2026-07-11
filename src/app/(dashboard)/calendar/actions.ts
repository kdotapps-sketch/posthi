'use server'

import { createClient } from '@/lib/supabase/server'
import { Post, PostTarget, PostMedia, MediaAsset } from '@/types'

export type CalendarPost = Post & {
  post_targets: Pick<PostTarget, 'platform' | 'status'>[]
  post_media: (Pick<PostMedia, 'display_order'> & {
    media_assets: Pick<MediaAsset, 'public_url' | 'media_type'> | null
  })[]
}

export async function getCalendarPosts(startDateISO: string, endDateISO: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return []
  }

  // Fetch posts within the date range that are scheduled or published
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_targets (
        platform,
        status
      ),
      post_media (
        display_order,
        media_assets (
          public_url,
          media_type
        )
      )
    `)
    .eq('user_id', userData.user.id)
    .gte('scheduled_at', startDateISO)
    .lte('scheduled_at', endDateISO)
    .in('status', ['scheduled', 'publishing', 'published', 'failed'])
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching calendar posts:', error)
    return []
  }

  // Supabase typing for complex joins can be loose; we'll cast safely based on our known structure
  return data as unknown as CalendarPost[]
}
