import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
loadEnvConfig(process.cwd())

async function main() {
  const isProductionUrl = process.env.NEXT_PUBLIC_APP_URL === 'https://posthi.app'
  const isProductionEnv = process.env.NODE_ENV === 'production'

  if (isProductionUrl || isProductionEnv) {
    console.error('❌ ERROR: Refusing to run in production environment.')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.')
    process.exit(1)
  }

  // Use service role key to bypass RLS and create users
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const email = 'demo@posthi.app'
  const password = 'PosthiDemo123!'

  console.log('🌱 Seeding demo user...')

  // 1. Create or get Auth User
  const { data: usersData, error: listUsersError } = await supabase.auth.admin.listUsers()
  if (listUsersError) {
    console.error('Failed to list users:', listUsersError)
    process.exit(1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user = usersData.users.find((u: any) => u.email === email)

  if (!user) {
    console.log('   - Creating new auth user...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'Demo User' }
    })
    
    if (createError) {
      console.error('Failed to create auth user:', createError)
      process.exit(1)
    }
    user = newUser.user
  } else {
    console.log('   - Auth user already exists. Updating password to ensure match...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password
    })
    if (updateError) {
      console.error('Failed to update auth user password:', updateError)
    }
  }

  if (!user) {
    console.error('User creation/retrieval failed.')
    process.exit(1)
  }

  const userId = user.id

  // 2. Profile
  console.log('   - Upserting profile...')
  await supabase.from('profiles').upsert({
    id: userId,
    email,
    display_name: 'Demo User'
  })

  // 3. App Settings
  console.log('   - Upserting app_settings...')
  await supabase.from('app_settings').upsert({
    user_id: userId,
    default_timezone: 'UTC',
    default_platforms: ['x', 'instagram'],
    monthly_x_spend_limit: 0,
    mock_publishing: true
  })

  // 4. Hashtag Sets
  console.log('   - Upserting hashtag sets...')
  const { data: hashtagSet } = await supabase.from('hashtag_sets').upsert({
    user_id: userId,
    name: 'Demo Growth Tags',
    hashtags: ['#marketing', '#growth', '#startup']
  }, { onConflict: 'user_id,name' }).select().single()

  if (hashtagSet) {
    await supabase.from('app_settings').update({ default_hashtag_set_id: hashtagSet.id }).eq('user_id', userId)
  }

  // 5. Social Accounts
  console.log('   - Upserting social accounts...')
  const accounts = [
    {
      user_id: userId,
      platform: 'x',
      platform_user_id: '123456789',
      username: 'posthi_demo',
      display_name: 'Posthi Demo X',
      status: 'connected',
      access_token: 'demo_token'
    },
    {
      user_id: userId,
      platform: 'instagram',
      platform_user_id: '987654321',
      username: 'posthi.demo',
      display_name: 'Posthi Demo IG',
      status: 'connected',
      access_token: 'demo_token'
    }
  ]

  const createdAccounts = []
  for (const acc of accounts) {
    const { data: existingAcc } = await supabase.from('social_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', acc.platform)
      .single()

    if (existingAcc) {
      const { data } = await supabase.from('social_accounts').update(acc).eq('id', existingAcc.id).select().single()
      createdAccounts.push(data)
    } else {
      const { data } = await supabase.from('social_accounts').insert(acc).select().single()
      createdAccounts.push(data)
    }
  }

  // 6. Posts & Post Targets & Post Attempts
  console.log('   - Upserting demo posts...')
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const posts = [
    {
      user_id: userId,
      caption: 'This is a demo draft post! #demo',
      status: 'draft',
      timezone: 'UTC',
      targets: ['x', 'instagram']
    },
    {
      user_id: userId,
      caption: 'This is a demo scheduled post for tomorrow! #excited',
      status: 'scheduled',
      scheduled_at: tomorrow.toISOString(),
      timezone: 'UTC',
      targets: ['x', 'instagram']
    },
    {
      user_id: userId,
      caption: 'This is a mock published post! It worked perfectly.',
      status: 'published',
      published_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'UTC',
      targets: ['x'],
      attemptStatus: 'published'
    },
    {
      user_id: userId,
      caption: 'This mock post failed to publish due to a rate limit.',
      status: 'failed',
      timezone: 'UTC',
      targets: ['instagram'],
      attemptStatus: 'failed',
      errorMessage: 'Rate limit exceeded for Instagram API.'
    },
    {
      user_id: userId,
      caption: 'Bulk imported post that is scheduled for next week.',
      status: 'scheduled',
      scheduled_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'UTC',
      targets: ['x', 'instagram']
    }
  ]

  for (const p of posts) {
    // Check if post already exists by caption to maintain idempotency
    const { data: existingPost } = await supabase.from('posts').select('id').eq('user_id', userId).eq('caption', p.caption).single()
    
    let postId = existingPost?.id
    if (!postId) {
      const { data: newPost, error: postErr } = await supabase.from('posts').insert({
        user_id: p.user_id,
        caption: p.caption,
        status: p.status,
        scheduled_at: p.scheduled_at,
        timezone: p.timezone,
        published_at: p.published_at
      }).select().single()
      
      if (postErr) {
        console.error('Error creating post:', postErr)
        continue
      }
      postId = newPost.id
    } else {
      await supabase.from('posts').update({
        status: p.status,
        scheduled_at: p.scheduled_at,
        published_at: p.published_at
      }).eq('id', postId)
    }

    // Upsert Targets
    for (const targetPlatform of p.targets) {
      const socialAcc = createdAccounts.find(a => a.platform === targetPlatform)
      if (!socialAcc) continue

      const targetStatus = p.attemptStatus || (p.status === 'scheduled' ? 'pending' : p.status === 'draft' ? 'pending' : 'pending')

      const { data: existingTarget } = await supabase.from('post_targets')
        .select('id')
        .eq('post_id', postId)
        .eq('platform', targetPlatform)
        .single()
      
      let targetId = existingTarget?.id
      if (!targetId) {
        const { data: newTarget } = await supabase.from('post_targets').insert({
          post_id: postId,
          platform: targetPlatform,
          social_account_id: socialAcc.id,
          status: targetStatus,
          error_message: p.errorMessage || null,
          published_at: targetStatus === 'published' ? p.published_at : null
        }).select().single()
        targetId = newTarget?.id
      } else {
        await supabase.from('post_targets').update({
          status: targetStatus,
          error_message: p.errorMessage || null,
          published_at: targetStatus === 'published' ? p.published_at : null
        }).eq('id', targetId)
      }

      // If it's published or failed, add a post_attempt
      if (targetId && p.attemptStatus) {
        const { data: existingAttempts } = await supabase.from('post_attempts').select('id').eq('post_target_id', targetId)
        if (!existingAttempts || existingAttempts.length === 0) {
          await supabase.from('post_attempts').insert({
            post_id: postId,
            post_target_id: targetId,
            attempt_number: 1,
            status: targetStatus,
            error_message: p.errorMessage || null,
            external_post_id: targetStatus === 'published' ? `mock_ext_id_${Math.random().toString(36).substring(7)}` : null,
            response_data: { mock: true, message: 'Seeded demo attempt' }
          })
        }
      }
    }
  }

  console.log('✅ Demo user seeded successfully.')
  console.log('   Email:', email)
  console.log('   Password:', password)
}

main().catch(console.error)
