import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRateLimitKey, rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    const throttle = rateLimit(getRateLimitKey(request, 'instagram-oauth-start', user.id), {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })
    if (!throttle.allowed) {
      return NextResponse.json({ error: 'Too many OAuth attempts. Try again later.' }, { status: 429 })
    }

    const clientId = process.env.META_APP_ID
    const redirectUri = process.env.META_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Instagram API not configured yet.' }, { status: 500 })
    }

    if (!process.env.POSTHI_ENCRYPTION_KEY) {
      return NextResponse.json({ error: 'POSTHI_ENCRYPTION_KEY is not configured on the server. OAuth cannot proceed securely.' }, { status: 500 })
    }

    // Generate secure state
    const state = crypto.randomBytes(32).toString('hex')
    
    // Store state in an HTTP-only cookie for CSRF protection
    const response = NextResponse.redirect(new URL('https://www.facebook.com/v19.0/dialog/oauth' + 
      '?client_id=' + clientId +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&state=' + state +
      '&response_type=code' +
      '&scope=' + encodeURIComponent('instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement')
    ))

    // Set cookie with 15 min expiry
    response.cookies.set('ig_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/'
    })

    return response
  } catch (err) {
    console.error('Error starting Instagram OAuth:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
