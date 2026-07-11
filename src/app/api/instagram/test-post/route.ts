import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishToInstagram } from '@/lib/publisher/instagram'
import { getRateLimitKey, rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const testPostSchema = z.object({
  social_account_id: z.string().uuid(),
  image_url: z.string().url().optional(),
  media_type: z.enum(['image', 'video', 'carousel']).default('image'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const throttle = rateLimit(getRateLimitKey(request, 'instagram-test-post', user.id), {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })
    if (!throttle.allowed) {
      return NextResponse.json({ error: 'Too many test posts. Try again later.' }, { status: 429 })
    }

    const body = testPostSchema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    let testMediaAssets = []
    const { social_account_id, image_url, media_type } = body.data
    const testCaption = `Automated test post from Posthi\nTime: ${new Date().toISOString()}`

    if (media_type === 'carousel') {
      testMediaAssets = [
        {
          id: 'test_asset_1',
          user_id: user.id,
          filename: 'test1.jpg',
          public_url: 'https://picsum.photos/id/237/1080/1080',
          storage_path: '',
          media_type: 'image' as const,
          mime_type: 'image/jpeg',
          file_size: 1024,
          width: 1080,
          height: 1080,
          duration_sec: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test_asset_2',
          user_id: user.id,
          filename: 'test2.mp4',
          public_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          storage_path: '',
          media_type: 'video' as const,
          mime_type: 'video/mp4',
          file_size: 1024,
          width: 1080,
          height: 1080,
          duration_sec: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    } else {
      const isVideo = media_type === 'video'
      const defaultUrl = isVideo 
        ? 'https://www.w3schools.com/html/mov_bbb.mp4' 
        : 'https://picsum.photos/id/237/1080/1080'
      const testUrl = image_url || defaultUrl
      testMediaAssets = [
        {
          id: 'test_asset_1',
          user_id: user.id,
          filename: isVideo ? 'test.mp4' : 'test.jpg',
          public_url: testUrl,
          storage_path: '', // Indicates it's a public URL already
          media_type: isVideo ? 'video' as const : 'image' as const,
          mime_type: isVideo ? 'video/mp4' : 'image/jpeg',
          file_size: 1024,
          width: 1080,
          height: 1080,
          duration_sec: isVideo ? 10 : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }

    const result = await publishToInstagram(user.id, social_account_id, testCaption, testMediaAssets)

    return NextResponse.json({
      message: 'Instagram test post published successfully',
      external_post_url: result.external_post_url,
      external_post_id: result.external_post_id
    })
  } catch (error) {
    console.error('Instagram test post error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish test post' },
      { status: 500 }
    )
  }
}
