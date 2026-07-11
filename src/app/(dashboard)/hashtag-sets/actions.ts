'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getHashtagSets() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('hashtag_sets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hashtag sets:', error)
    return []
  }

  return data || []
}

export async function createHashtagSet(name: string, hashtags: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('hashtag_sets')
    .insert({
      user_id: user.id,
      name,
      hashtags
    })

  if (error) throw error

  revalidatePath('/hashtag-sets')
  return { success: true }
}

export async function updateHashtagSet(id: string, name: string, hashtags: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('hashtag_sets')
    .update({ name, hashtags })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/hashtag-sets')
  return { success: true }
}

export async function deleteHashtagSet(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('hashtag_sets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/hashtag-sets')
  return { success: true }
}
