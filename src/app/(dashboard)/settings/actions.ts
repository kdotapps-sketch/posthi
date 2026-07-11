'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type SettingsType } from './components/SettingsClient'

export async function getSocialAccounts() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return []
  }

  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching social accounts:', error)
    return []
  }

  return data
}

export async function connectSocialAccount(platform: 'x' | 'instagram', username: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('social_accounts')
    .insert([
      {
        user_id: userData.user.id,
        platform,
        username,
        status: 'connected',
        // Mocking access token for MVP purposes since there's no real OAuth yet
        access_token: 'mock_token_' + Math.random().toString(36).substring(7)
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error connecting social account:', error)
    throw new Error(error.message)
  }

  revalidatePath('/settings')
  return data
}

export async function disconnectSocialAccount(id: string) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id) // Security check

  if (error) {
    console.error('Error disconnecting social account:', error)
    throw new Error(error.message)
  }

  revalidatePath('/settings')
}

export async function getSettings() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: fetchedData, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let data = fetchedData

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching settings:', error)
    return null
  }

  if (!data) {
    const defaultSettings = {
      user_id: user.id,
      default_timezone: 'Europe/London',
      default_platforms: ['x'],
      monthly_x_spend_limit: 0,
      mock_publishing: true
    }
    const { data: newData, error: insertError } = await supabase
      .from('app_settings')
      .insert(defaultSettings)
      .select()
      .single()
      
    if (insertError) throw insertError
    data = newData
  }

  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isCronConfigured = !!process.env.CRON_SECRET

  return {
    ...data,
    checklist: {
      supabase: isSupabaseConfigured,
      cron: isCronConfigured,
      xCredentials: !!process.env.X_CLIENT_ID && !!process.env.X_CLIENT_SECRET && !!process.env.POSTHI_ENCRYPTION_KEY,
      xMediaReady: true, // X API v1.1 Media endpoint does not require additional credentials if X API is ready
      metaCredentials: !!process.env.META_APP_ID && !!process.env.META_APP_SECRET && !!process.env.POSTHI_ENCRYPTION_KEY,
      instagramMock: data.mock_publishing
    }
  }
}

export async function updateSettings(settings: SettingsType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('app_settings')
    .update({
      default_timezone: settings.default_timezone,
      default_platforms: settings.default_platforms,
      monthly_x_spend_limit: settings.monthly_x_spend_limit,
      mock_publishing: settings.mock_publishing
    })
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/settings')
  return { success: true }
}
