'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PostStatus, TargetStatus } from '@/types'

export async function getPublishingLogs() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('post_attempts')
    .select(`
      *,
      posts:post_id (caption, user_id),
      post_targets:post_target_id (platform)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching logs:', error)
    return []
  }

  // Filter only for this user
  return (data || []).filter(item => item.posts?.user_id === user.id)
}

export async function retryPost(postId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify post belongs to user
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, status')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (postError || !post) throw new Error('Post not found or unauthorized')

  // Update post status to scheduled if it's failed
  if (post.status === 'failed') {
    const { error: updatePostError } = await supabase
      .from('posts')
      .update({ status: 'scheduled' as PostStatus })
      .eq('id', postId)

    if (updatePostError) throw updatePostError
  }

  // Update failed targets back to pending
  const { error: targetsError } = await supabase
    .from('post_targets')
    .update({ status: 'pending' as TargetStatus })
    .eq('post_id', postId)
    .eq('status', 'failed')

  if (targetsError) throw targetsError

  revalidatePath('/publishing-logs')
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  
  return { success: true }
}
