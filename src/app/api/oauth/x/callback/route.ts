import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/encryption'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${error}`, req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/settings?error=missing_params`, req.url))
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('x_oauth_state')?.value
  const codeVerifier = cookieStore.get('x_oauth_code_verifier')?.value

  if (!savedState || state !== savedState) {
    return NextResponse.redirect(new URL(`/settings?error=invalid_state`, req.url))
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL(`/settings?error=missing_verifier`, req.url))
  }

  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'
  const redirectUri = `${appUrl}/api/oauth/x/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/settings?error=server_not_configured`, req.url))
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const tokenParams = new URLSearchParams()
    tokenParams.append('code', code)
    tokenParams.append('grant_type', 'authorization_code')
    tokenParams.append('client_id', clientId)
    tokenParams.append('redirect_uri', redirectUri)
    tokenParams.append('code_verifier', codeVerifier)

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: tokenParams.toString()
    })

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text()
      console.error('X token exchange failed:', err)
      return NextResponse.redirect(new URL(`/settings?error=token_exchange_failed`, req.url))
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Fetch user profile from X to get username
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    if (!userResponse.ok) {
      const err = await userResponse.text()
      console.error('X user fetch failed:', err)
      return NextResponse.redirect(new URL(`/settings?error=user_fetch_failed`, req.url))
    }

    const userData = await userResponse.json()
    const username = userData.data.username

    // Upsert into social_accounts
    // We check if the account already exists for this user and platform
    const { data: existingAccount, error: fetchAccountError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('username', username)
      .maybeSingle()

    if (fetchAccountError) {
      console.error('Error fetching existing social account:', fetchAccountError)
    }

    let socialAccountId = existingAccount?.id

    if (!socialAccountId) {
      const { data: newAccount, error: insertAccountError } = await supabase
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: 'x',
          username,
          status: 'connected',
          access_token: 'stored_in_oauth_tokens' // deprecated field in social_accounts
        })
        .select('id')
        .single()

      if (insertAccountError) {
        throw insertAccountError
      }
      socialAccountId = newAccount.id
    } else {
      await supabase
        .from('social_accounts')
        .update({ status: 'connected' })
        .eq('id', socialAccountId)
    }

    // Upsert into oauth_tokens
    const encryptedAccessToken = encryptToken(access_token)
    const encryptedRefreshToken = refresh_token ? encryptToken(refresh_token) : null

    const { error: upsertTokenError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        social_account_id: socialAccountId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'social_account_id' })

    if (upsertTokenError) {
      throw upsertTokenError
    }

    // Clear cookies
    cookieStore.delete('x_oauth_state')
    cookieStore.delete('x_oauth_code_verifier')

    return NextResponse.redirect(new URL(`/settings?success=x_connected`, req.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL(`/settings?error=internal_error`, req.url))
  }
}
