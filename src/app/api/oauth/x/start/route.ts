import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRateLimitKey, rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import { cookies } from 'next/headers'

function base64URLEncode(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const throttle = rateLimit(getRateLimitKey(request, 'x-oauth-start', user.id), {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (!throttle.allowed) {
    return NextResponse.json({ error: 'Too many OAuth attempts. Try again later.' }, { status: 429 })
  }

  const clientId = process.env.X_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'
  const redirectUri = `${appUrl}/api/oauth/x/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'X_CLIENT_ID is not configured' }, { status: 500 })
  }

  if (!process.env.POSTHI_ENCRYPTION_KEY) {
    return NextResponse.json({ error: 'POSTHI_ENCRYPTION_KEY is not configured on the server. OAuth cannot proceed securely.' }, { status: 500 })
  }

  const codeVerifier = base64URLEncode(crypto.randomBytes(32))
  const codeChallenge = base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest())
  const state = base64URLEncode(crypto.randomBytes(16))

  const cookieStore = await cookies()
  
  // Store code_verifier and state in cookies
  cookieStore.set('x_oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10 // 10 minutes
  })

  cookieStore.set('x_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10
  })

  const scope = 'tweet.read tweet.write users.read offline.access'
  
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  return NextResponse.redirect(authUrl.toString())
}
