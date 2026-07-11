import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/encryption'
import { MediaAsset } from '@/types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function publishToInstagram(
  userId: string,
  socialAccountId: string,
  caption: string,
  mediaAssets: MediaAsset[]
) {
  if (process.env.NEXT_PUBLIC_MOCK_PUBLISHING === 'false') {
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
      throw new Error('Meta API credentials missing in production mode.')
    }
    if (!process.env.POSTHI_ENCRYPTION_KEY) {
      throw new Error('Encryption key missing. Cannot decrypt OAuth tokens.')
    }
  }

  // 1. Initialize Supabase Admin Client
  const supabaseAdmin = createAdminClient()

  // 2. Fetch the social account to get the external IG ID
  const { data: account, error: accountError } = await supabaseAdmin
    .from('social_accounts')
    .select('external_account_id')
    .eq('id', socialAccountId)
    .eq('user_id', userId)
    .single()

  if (accountError || !account) {
    throw new Error('Social account not found')
  }

  const igAccountId = account.external_account_id
  if (!igAccountId) {
    throw new Error('Instagram Account ID is missing from social account')
  }

  // 3. Fetch the encrypted token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('oauth_tokens')
    .select('access_token_encrypted')
    .eq('social_account_id', socialAccountId)
    .single()

  if (tokenError || !tokenData) {
    throw new Error('OAuth token not found for this account')
  }

  // 4. Decrypt the token
  let accessToken: string
  try {
    accessToken = decryptToken(tokenData.access_token_encrypted)
  } catch (err) {
    console.error('Failed to decrypt token:', err)
    throw new Error('Failed to decrypt access token')
  }

  // 5. Verify Media Assets
  if (!mediaAssets || mediaAssets.length === 0) {
    throw new Error('Instagram requires at least one media asset to publish')
  }
  
  if (mediaAssets.length > 10) {
    throw new Error('Instagram allows a maximum of 10 media items in a carousel')
  }

  // Generate signed URLs for all assets
  const mediaUrls: string[] = []
  for (const asset of mediaAssets) {
    if (asset.media_type === 'video') {
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/mov']
      if (!validVideoTypes.includes(asset.mime_type)) {
        throw new Error(`Unsupported video format: ${asset.mime_type}. Please use MP4 or MOV.`)
      }
    }
    
    let url = asset.public_url
    if (asset.storage_path) {
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
        .storage
        .from('media')
        .createSignedUrl(asset.storage_path, 3600) // 1 hour

      if (signedUrlError || !signedUrlData) {
        console.error('Failed to generate signed URL:', signedUrlError)
        throw new Error('Failed to generate secure URL for media')
      }
      url = signedUrlData.signedUrl
    }

    if (!url) {
      throw new Error(`Media URL could not be resolved for asset ${asset.filename}`)
    }
    mediaUrls.push(url)
  }

  let finalCreationId: string

  const isCarousel = mediaAssets.length > 1

  if (!isCarousel) {
    // --- SINGLE MEDIA FLOW ---
    const primaryMedia = mediaAssets[0]
    const mediaUrl = mediaUrls[0]
    
    const createContainerUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`
    const containerParams = new URLSearchParams()
    
    if (primaryMedia.media_type === 'video') {
      containerParams.append('media_type', 'REELS')
      containerParams.append('video_url', mediaUrl)
    } else {
      containerParams.append('image_url', mediaUrl)
    }
    
    if (caption) {
      containerParams.append('caption', caption)
    }
    containerParams.append('access_token', accessToken)

    const createRes = await fetch(createContainerUrl, { method: 'POST', body: containerParams })
    const createData = await createRes.json()

    if (createData.error || !createData.id) {
      console.error('Instagram Media Container Error:', createData)
      throw new Error(createData.error?.message || 'Failed to create Instagram media container')
    }

    finalCreationId = createData.id
    
    // Poll for status
    await pollContainerStatus(finalCreationId, accessToken, primaryMedia.media_type === 'video')
  } else {
    // --- CAROUSEL FLOW ---
    const childContainerIds: string[] = []
    
    // 1. Create Child Containers
    for (let i = 0; i < mediaAssets.length; i++) {
      const asset = mediaAssets[i]
      const url = mediaUrls[i]
      
      const createChildUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`
      const childParams = new URLSearchParams()
      childParams.append('is_carousel_item', 'true')
      
      if (asset.media_type === 'video') {
        childParams.append('media_type', 'VIDEO')
        childParams.append('video_url', url)
      } else {
        childParams.append('image_url', url)
      }
      childParams.append('access_token', accessToken)
      
      const childRes = await fetch(createChildUrl, { method: 'POST', body: childParams })
      const childData = await childRes.json()
      
      if (childData.error || !childData.id) {
        console.error('Instagram Carousel Child Container Error:', childData)
        throw new Error(childData.error?.message || `Failed to create carousel child container for item ${i+1}`)
      }
      
      childContainerIds.push(childData.id)
    }
    
    // 2. Poll Child Containers (Needed if videos are involved, but safe to do for all)
    for (const childId of childContainerIds) {
      // Find original asset type for polling config
      const assetIndex = childContainerIds.indexOf(childId)
      const isVideo = mediaAssets[assetIndex].media_type === 'video'
      await pollContainerStatus(childId, accessToken, isVideo)
    }
    
    // 3. Create Parent Carousel Container
    const createParentUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`
    const parentParams = new URLSearchParams()
    parentParams.append('media_type', 'CAROUSEL')
    parentParams.append('children', childContainerIds.join(','))
    if (caption) {
      parentParams.append('caption', caption)
    }
    parentParams.append('access_token', accessToken)
    
    const parentRes = await fetch(createParentUrl, { method: 'POST', body: parentParams })
    const parentData = await parentRes.json()
    
    if (parentData.error || !parentData.id) {
      console.error('Instagram Carousel Parent Container Error:', parentData)
      throw new Error(parentData.error?.message || 'Failed to create parent carousel container')
    }
    
    finalCreationId = parentData.id
    
    // 4. Poll Parent Container
    await pollContainerStatus(finalCreationId, accessToken, false)
  }

  // Publish final media container
  const publishUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`
  const publishParams = new URLSearchParams()
  publishParams.append('creation_id', finalCreationId)
  publishParams.append('access_token', accessToken)

  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    body: publishParams
  })

  const publishData = await publishRes.json()

  if (publishData.error || !publishData.id) {
    console.error('Instagram Media Publish Error:', publishData)
    throw new Error(publishData.error?.message || 'Failed to publish Instagram media container')
  }

  const externalPostId = publishData.id
  
  // Try to fetch the permalink (external_post_url)
  let externalPostUrl = null
  try {
    const permalinkRes = await fetch(`https://graph.facebook.com/v19.0/${externalPostId}?fields=permalink&access_token=${accessToken}`)
    const permalinkData = await permalinkRes.json()
    if (permalinkData.permalink) {
      externalPostUrl = permalinkData.permalink
    }
  } catch (err) {
    console.warn('Failed to fetch Instagram permalink:', err)
  }

  return {
    success: true,
    external_post_id: externalPostId,
    external_post_url: externalPostUrl
  }
}

async function pollContainerStatus(creationId: string, accessToken: string, isVideo: boolean) {
  let isReady = false
  let attempts = 0
  const maxAttempts = isVideo ? 30 : 10
  const delayMs = isVideo ? 5000 : 2000
  
  while (!isReady && attempts < maxAttempts) {
    const statusRes = await fetch(`https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${accessToken}`)
    const statusData = await statusRes.json()

    if (statusData.status_code === 'FINISHED') {
      isReady = true
    } else if (statusData.status_code === 'ERROR') {
      throw new Error(`Instagram container processing failed: ${statusData.status?.message || 'Unknown error'}`)
    } else {
      attempts++
      if (attempts < maxAttempts) {
        await sleep(delayMs)
      }
    }
  }

  if (!isReady) {
    throw new Error('Instagram container timed out while processing')
  }
}
