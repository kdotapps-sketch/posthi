'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMediaAssets() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return []
  }

  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching media assets:', error)
    return []
  }

  return data
}

export async function registerMediaAsset(data: {
  filename: string
  storage_path: string
  mime_type: string
  file_size: number
  media_type: 'image' | 'video'
}) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: publicUrlData } = supabase
    .storage
    .from('posthi-media')
    .getPublicUrl(data.storage_path)

  const { error } = await supabase
    .from('media_assets')
    .insert({
      user_id: userData.user.id,
      filename: data.filename,
      storage_path: data.storage_path,
      mime_type: data.mime_type,
      file_size: data.file_size,
      media_type: data.media_type,
      public_url: publicUrlData.publicUrl
    })

  if (error) {
    console.error('Error registering media asset:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/media-library')
  return { success: true }
}

export async function deleteMediaAsset(id: string, storagePath: string) {
  void storagePath
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: asset, error: assetError } = await supabase
    .from('media_assets')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', userData.user.id)
    .single()

  if (assetError || !asset) {
    return { success: false, error: 'Media asset not found' }
  }

  // First, delete from the database
  const { error: dbError } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id)

  if (dbError) {
    console.error('Error deleting media asset record:', dbError)
    return { success: false, error: dbError.message }
  }

  // Then delete from storage
  const { error: storageError } = await supabase
    .storage
    .from('posthi-media')
    .remove([asset.storage_path])

  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
  }

  revalidatePath('/media-library')
  return { success: true }
}
