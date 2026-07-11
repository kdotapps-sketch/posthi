import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishToX } from '@/lib/publisher/x'
import { publishToInstagram } from '@/lib/publisher/instagram'
import { MediaAsset } from '@/types'

export async function GET(request: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured on the server' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createAdminClient()

    // 3. Find posts that are ready to be published
    const now = new Date().toISOString()
    const { data: postsToPublish, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, caption, status')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)

    if (fetchError) throw fetchError

    if (!postsToPublish || postsToPublish.length === 0) {
      return NextResponse.json({ message: 'No posts to publish at this time.' })
    }

    const results = []

    // 4. Process each post
    for (const post of postsToPublish) {
      // Optimistically lock the post to prevent concurrent processing
      const { data: lockedPost, error: lockError } = await supabaseAdmin
        .from('posts')
        .update({ status: 'publishing' })
        .eq('id', post.id)
        .eq('status', 'scheduled')
        .select('id')
        .single()

      if (lockError || !lockedPost) {
        console.log(`Post ${post.id} was already grabbed by another worker or failed to lock.`)
        continue // Skip to next post
      }

      try {
        // Fetch targets for this post
        const { data: targets } = await supabaseAdmin
          .from('post_targets')
          .select('*')
          .eq('post_id', post.id)
          .in('status', ['pending', 'failed'])

        if (!targets || targets.length === 0) {
          await supabaseAdmin.from('posts').update({ status: 'published' }).eq('id', post.id)
          continue
        }

        // Fetch media for this post
        const { data: media } = await supabaseAdmin
          .from('post_media')
          .select('*, media_assets(*)')
          .eq('post_id', post.id)
          .order('display_order')
          
        const mediaAssets = (media?.map(m => m.media_assets).filter(Boolean) as unknown) as MediaAsset[] || []

        let successCount = 0
        let failureCount = 0

        for (const target of targets) {
          // Find max attempt number for this target
          const { data: previousAttempts } = await supabaseAdmin
            .from('post_attempts')
            .select('attempt_number')
            .eq('post_target_id', target.id)
            .order('attempt_number', { ascending: false })
            .limit(1)
            .maybeSingle()

          const nextAttemptNumber = previousAttempts ? previousAttempts.attempt_number + 1 : 1

          try {
            // Update target to publishing
            await supabaseAdmin.from('post_targets').update({ status: 'publishing' }).eq('id', target.id)

            // Fetch user settings to check mock status
            const { data: settings } = await supabaseAdmin
              .from('app_settings')
              .select('mock_publishing')
              .eq('user_id', post.user_id)
              .maybeSingle()

            const isMock = settings?.mock_publishing ?? (process.env.NEXT_PUBLIC_MOCK_PUBLISHING === 'true')
            
            let externalPostId = null
            let externalPostUrl = null
            let responseData: { message: string; external_post_id?: string | null; external_post_url?: string | null } = { message: 'Mock success' }

            if (isMock) {
              // --- MOCK API CALL ---
              await new Promise(resolve => setTimeout(resolve, 1500))
              const isSuccess = Math.random() > 0.1
              if (!isSuccess) {
                throw new Error(`Simulated API failure for platform ${target.platform}`)
              }
            } else {
              // --- REAL API CALL ---
              if (target.platform === 'x') {
                if (!target.social_account_id) {
                  throw new Error('Target missing social_account_id')
                }
                const res = await publishToX(post.user_id, target.social_account_id, post.caption || '', mediaAssets)
                externalPostId = res.external_post_id
                externalPostUrl = res.external_post_url
                responseData = { message: 'Success', external_post_id: externalPostId, external_post_url: externalPostUrl }
              } else if (target.platform === 'instagram') {
                if (!target.social_account_id) {
                  throw new Error('Target missing social_account_id')
                }
                const res = await publishToInstagram(post.user_id, target.social_account_id, post.caption || '', mediaAssets)
                externalPostId = res.external_post_id
                externalPostUrl = res.external_post_url
                responseData = { message: 'Success', external_post_id: externalPostId, external_post_url: externalPostUrl }
              } else {
                throw new Error(`Real publishing not implemented yet for platform: ${target.platform}`)
              }
            }

            // Target success
            await supabaseAdmin.from('post_targets').update({ 
              status: 'published',
              published_at: new Date().toISOString(),
              external_post_id: externalPostId,
              external_post_url: externalPostUrl
            }).eq('id', target.id)

            await supabaseAdmin.from('post_attempts').insert({
              post_id: post.id,
              post_target_id: target.id,
              attempt_number: nextAttemptNumber,
              status: 'published',
              response_data: responseData
            })

            successCount++
          } catch (targetErr) {
            const errorMsg = targetErr instanceof Error ? targetErr.message : String(targetErr)
            console.error(`Failed target ${target.id}:`, targetErr)

            // Target failed
            await supabaseAdmin.from('post_targets').update({ 
              status: 'failed',
              error_message: errorMsg
            }).eq('id', target.id)

            await supabaseAdmin.from('post_attempts').insert({
              post_id: post.id,
              post_target_id: target.id,
              attempt_number: nextAttemptNumber,
              status: 'failed',
              error_message: errorMsg
            })

            failureCount++
          }
        }

        // Determine final post status
        let finalStatus = 'published'
        if (failureCount > 0 && successCount === 0) finalStatus = 'failed'
        else if (failureCount > 0 && successCount > 0) finalStatus = 'failed' // Or could stay 'publishing' or a new 'partial' state. We'll mark as failed so it shows up in logs for retry.

        await supabaseAdmin
          .from('posts')
          .update({ 
            status: finalStatus,
            published_at: finalStatus === 'published' ? new Date().toISOString() : null
          })
          .eq('id', post.id)

        results.push({ id: post.id, targetsProcessed: targets.length, success: successCount, failed: failureCount })
      } catch (err) {
        console.error(`Failed to process post ${post.id}:`, err)
        await supabaseAdmin.from('posts').update({ status: 'failed' }).eq('id', post.id)
        results.push({ id: post.id, status: 'failed_processing' })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} posts.`,
      results
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal error'
    console.error('Cron Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: errorMsg }, { status: 500 })
  }
}
