import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { decryptToken, encryptToken } from '@/lib/encryption'
import { MediaAsset } from '@/types'

async function uploadMediaToX(accessToken: string, asset: MediaAsset): Promise<string> {
  if (!asset.public_url) {
    throw new Error('Media asset missing public_url')
  }
  
  const response = await fetch(asset.public_url)
  if (!response.ok) {
    throw new Error(`Failed to download media asset from Supabase: ${response.statusText}`)
  }
  
  const buffer = Buffer.from(await response.arrayBuffer())
  
  if (asset.media_type === 'image') {
    // Simple upload for images
    const base64Media = buffer.toString('base64')
    const form = new URLSearchParams()
    form.append('media_data', base64Media)
    
    const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`
      },
      body: form.toString()
    })
    
    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      throw new Error(`Failed to upload image to X: ${err}`)
    }
    
    const uploadData = await uploadRes.json()
    return uploadData.media_id_string
  } else if (asset.media_type === 'video') {
    // Chunked upload for videos
    const totalBytes = buffer.length
    const mediaType = asset.mime_type || 'video/mp4'
    
    // 1. INIT
    const initForm = new URLSearchParams()
    initForm.append('command', 'INIT')
    initForm.append('total_bytes', totalBytes.toString())
    initForm.append('media_type', mediaType)
    
    const initRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`
      },
      body: initForm.toString()
    })
    
    if (!initRes.ok) {
      const err = await initRes.text()
      throw new Error(`Failed to INIT video upload to X: ${err}`)
    }
    
    const initData = await initRes.json()
    const mediaId = initData.media_id_string
    
    // 2. APPEND
    const chunkSize = 5 * 1024 * 1024 // 5MB chunks
    let segmentIndex = 0
    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      const chunk = buffer.subarray(offset, offset + chunkSize)
      
      const formData = new FormData()
      formData.append('command', 'APPEND')
      formData.append('media_id', mediaId)
      formData.append('segment_index', segmentIndex.toString())
      formData.append('media', new Blob([chunk], { type: 'application/octet-stream' }))
      
      const appendRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })
      
      if (!appendRes.ok) {
        const err = await appendRes.text()
        throw new Error(`Failed to APPEND video upload to X (segment ${segmentIndex}): ${err}`)
      }
      segmentIndex++
    }
    
    // 3. FINALIZE
    const finalizeForm = new URLSearchParams()
    finalizeForm.append('command', 'FINALIZE')
    finalizeForm.append('media_id', mediaId)
    
    const finalizeRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`
      },
      body: finalizeForm.toString()
    })
    
    if (!finalizeRes.ok) {
      const err = await finalizeRes.text()
      throw new Error(`Failed to FINALIZE video upload to X: ${err}`)
    }
    
    const finalizeData = await finalizeRes.json()
    
    // 4. STATUS
    let processingInfo = finalizeData.processing_info
    while (processingInfo && (processingInfo.state === 'pending' || processingInfo.state === 'in_progress')) {
      const checkAfterSecs = processingInfo.check_after_secs || 5
      await new Promise(resolve => setTimeout(resolve, checkAfterSecs * 1000))
      
      const statusRes = await fetch(`https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!statusRes.ok) {
        const err = await statusRes.text()
        throw new Error(`Failed to check STATUS of video upload to X: ${err}`)
      }
      
      const statusData = await statusRes.json()
      processingInfo = statusData.processing_info
      
      if (processingInfo && processingInfo.state === 'failed') {
        throw new Error(`Video processing failed on X: ${processingInfo.error?.message}`)
      }
    }
    
    return mediaId
  }
  
  throw new Error(`Unsupported media type: ${asset.media_type}`)
}

export async function publishToX(userId: string, socialAccountId: string, text: string, mediaAssets?: MediaAsset[]) {
  if (process.env.NEXT_PUBLIC_MOCK_PUBLISHING === 'false') {
    if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
      throw new Error('X API credentials missing in production mode.')
    }
    if (!process.env.POSTHI_ENCRYPTION_KEY) {
      throw new Error('Encryption key missing. Cannot decrypt OAuth tokens.')
    }
  }

  const supabase = await createClient()

  // 1. Get the encrypted tokens for this account
  const { data: tokenRecord, error: tokenError } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('social_account_id', socialAccountId)
    .single()

  if (tokenError || !tokenRecord) {
    throw new Error('X OAuth tokens not found for this account')
  }

  let accessToken = decryptToken(tokenRecord.access_token)
  
  // 2. Check if token is expired (giving a 60-second buffer)
  const isExpired = new Date(tokenRecord.expires_at).getTime() < Date.now() + 60000

  if (isExpired && tokenRecord.refresh_token) {
    const refreshToken = decryptToken(tokenRecord.refresh_token)
    
    // Refresh token
    const clientId = process.env.X_CLIENT_ID
    const clientSecret = process.env.X_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('X API credentials missing for token refresh')
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', refreshToken)
    params.append('client_id', clientId)

    const refreshResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: params.toString()
    })

    if (!refreshResponse.ok) {
      const err = await refreshResponse.text()
      console.error('Failed to refresh X token:', err)
      throw new Error('Failed to refresh X authentication')
    }

    const tokenData = await refreshResponse.json()
    accessToken = tokenData.access_token
    const newRefreshToken = tokenData.refresh_token
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    // Update in DB
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: encryptToken(accessToken),
        refresh_token: encryptToken(newRefreshToken),
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenRecord.id)
  }

  // 3. Handle Media Uploads if any
  const mediaIds: string[] = []
  if (mediaAssets && mediaAssets.length > 0) {
    for (const asset of mediaAssets) {
      try {
        const mediaId = await uploadMediaToX(accessToken, asset)
        mediaIds.push(mediaId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`Media upload failed: ${msg}`)
      }
    }
  }

  // 4. Make the POST request to create a tweet
  const tweetBody: { text: string; media?: { media_ids: string[] } } = { text }
  if (mediaIds.length > 0) {
    tweetBody.media = { media_ids: mediaIds }
  }

  const postResponse = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(tweetBody)
  })

  if (!postResponse.ok) {
    const err = await postResponse.text()
    console.error('Failed to post to X:', err)
    
    // Try to parse the error message if it's JSON
    let errorMessage = 'Unknown error'
    try {
      const errJson = JSON.parse(err)
      errorMessage = errJson.detail || errJson.title || err
    } catch {
      errorMessage = err
    }
    
    throw new Error('Failed to publish to X: ' + errorMessage)
  }

  const postData = await postResponse.json()
  const tweetId = postData.data.id

  return {
    external_post_id: tweetId,
    external_post_url: `https://x.com/i/web/status/${tweetId}`
  }
}
