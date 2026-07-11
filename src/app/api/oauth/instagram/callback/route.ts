import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/encryption'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    if (error) {
      console.error('Meta OAuth Error:', error, errorDescription)
      return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(errorDescription || 'OAuth failed')}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=Missing+code+or+state', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    // Verify state
    const cookieStore = request.headers.get('cookie') || ''
    const storedStateMatch = cookieStore.match(/ig_oauth_state=([^;]+)/)
    const storedState = storedStateMatch ? storedStateMatch[1] : null

    if (!storedState || state !== storedState) {
      return NextResponse.redirect(new URL('/settings?error=Invalid+state', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    const clientId = process.env.META_APP_ID
    const clientSecret = process.env.META_APP_SECRET
    const redirectUri = process.env.META_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(new URL('/settings?error=Instagram+API+not+configured', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    // 1. Exchange code for short-lived access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`)
    const tokenData = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('Meta token error:', tokenData)
      return NextResponse.redirect(new URL('/settings?error=Failed+to+exchange+token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    const shortLivedToken = tokenData.access_token

    // 2. Exchange short-lived token for long-lived token
    const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`)
    const longLivedData = await longLivedRes.json()

    if (longLivedData.error || !longLivedData.access_token) {
      console.error('Meta long-lived token error:', longLivedData)
      return NextResponse.redirect(new URL('/settings?error=Failed+to+get+long-lived+token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    const accessToken = longLivedData.access_token
    const expiresIn = longLivedData.expires_in // typically 60 days in seconds

    // 3. Find connected Facebook Pages and their Instagram Business Accounts
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesRes.json()

    if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
      console.error('Meta pages error:', pagesData)
      return NextResponse.redirect(new URL('/settings?error=No+Facebook+Pages+found', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    let igAccountId: string | null = null
    let igUsername: string | null = null

    for (const page of pagesData.data) {
      const pageId = page.id
      // Need page access token to get instagram_business_account? No, user access token with pages_read_engagement is fine usually, but page token works too. We have the page access token in page.access_token.
      const pageToken = page.access_token
      
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`)
      const igData = await igRes.json()

      if (igData.instagram_business_account?.id) {
        igAccountId = igData.instagram_business_account.id
        
        // Fetch IG account details
        const igDetailsRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}?fields=username,name&access_token=${accessToken}`)
        const igDetails = await igDetailsRes.json()
        
        if (igDetails.username) {
          igUsername = igDetails.username
          break
        }
      }
    }

    if (!igAccountId || !igUsername) {
      return NextResponse.redirect(new URL('/settings?error=No+Instagram+Professional+Account+linked+to+your+Pages', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    // 4. Save to social_accounts
    // Note: To support reconnects gracefully, we check if an account with this external_id already exists for this user.
    const { data: existingAccount } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .eq('external_account_id', igAccountId)
      .maybeSingle()

    let socialAccountId = existingAccount?.id

    if (!socialAccountId) {
      const { data: newAccount, error: insertError } = await supabase
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform: 'instagram',
          username: igUsername,
          external_account_id: igAccountId,
          status: 'connected',
        })
        .select('id')
        .single()

      if (insertError || !newAccount) {
        console.error('Error inserting social account:', insertError)
        return NextResponse.redirect(new URL('/settings?error=Failed+to+save+account', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
      }
      socialAccountId = newAccount.id
    } else {
      // Update username if it changed
      await supabase.from('social_accounts').update({ username: igUsername, status: 'connected' }).eq('id', socialAccountId)
    }

    // 5. Encrypt and save token
    const encryptedToken = encryptToken(accessToken)
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

    // Delete existing token if any
    await supabase.from('oauth_tokens').delete().eq('social_account_id', socialAccountId)

    const { error: tokenError } = await supabase
      .from('oauth_tokens')
      .insert({
        social_account_id: socialAccountId,
        access_token_encrypted: encryptedToken,
        token_type: 'Bearer',
        expires_at: expiresAt,
        scope: 'instagram_basic,instagram_content_publish' // Storing the general scopes we requested
      })

    if (tokenError) {
      console.error('Error saving oauth token:', tokenError)
      return NextResponse.redirect(new URL('/settings?error=Failed+to+save+secure+token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    }

    // 6. Redirect to settings on success
    const response = NextResponse.redirect(new URL('/settings?success=Instagram+account+connected', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
    
    // Clear the state cookie
    response.cookies.delete('ig_oauth_state')

    return response
  } catch (err) {
    console.error('Error in Instagram OAuth callback:', err)
    return NextResponse.redirect(new URL('/settings?error=Internal+Server+Error', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5001'))
  }
}
