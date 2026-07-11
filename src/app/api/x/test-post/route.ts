import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishToX } from '@/lib/publisher/x'
import { getRateLimitKey, rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const testPostSchema = z.object({
  social_account_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const throttle = rateLimit(getRateLimitKey(request, 'x-test-post', user.id), {
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

    // Verify ownership
    const { data: account } = await supabase
      .from('social_accounts')
      .select('id, platform')
      .eq('id', body.data.social_account_id)
      .eq('user_id', user.id)
      .single()

    if (!account || account.platform !== 'x') {
      return NextResponse.json({ error: 'Invalid or unauthorized X account' }, { status: 400 })
    }

    // Attempt test post
    const text = 'Posthi test post - safe to delete ' + new Date().toISOString()
    const res = await publishToX(user.id, account.id, text)

    return NextResponse.json({ success: true, ...res })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Test post error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
