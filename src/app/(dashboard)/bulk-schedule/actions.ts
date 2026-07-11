'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Zod schema for CSV rows
const csvRowSchema = z.object({
  caption: z.string().min(1, 'Caption is required'),
  platforms: z.string().min(1, 'Platforms are required').transform(str => 
    str.toLowerCase().split(',').map(s => s.trim())
  ).refine(arr => arr.every(p => ['x', 'instagram'].includes(p)), {
    message: 'Platforms must be a comma-separated list containing x, instagram, or both'
  }),
  scheduled_at: z.string().optional(),
  timezone: z.string().optional().default('Europe/London'),
  media_filename: z.string().optional(),
  first_comment: z.string().optional(),
  status: z.string().optional().transform(s => s?.toLowerCase() || 'draft').refine(s => ['draft', 'scheduled'].includes(s), {
    message: 'Status must be draft or scheduled'
  }),
}).refine(data => {
  if (data.status === 'scheduled' && !data.scheduled_at) {
    return false;
  }
  return true;
}, {
  message: 'scheduled_at is required when status is scheduled',
  path: ['scheduled_at']
}).refine(data => {
  if (data.scheduled_at) {
    const date = new Date(data.scheduled_at);
    if (isNaN(date.getTime())) return false;
    // Check if the date is in the past
    if (date.getTime() < Date.now()) return false;
  }
  return true;
}, {
  message: 'scheduled_at must be a valid date in the future',
  path: ['scheduled_at']
})

export async function validateBulkImport(filename: string, rawRows: Record<string, unknown>[]) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  // Collect all unique media filenames to query
  const rawFilenames = rawRows.map(r => r.media_filename).filter(Boolean) as string[]
  const mediaFilenames = [...new Set(rawFilenames.flatMap(f => f.split(/[,|]/).map(s => s.trim()).filter(Boolean)))]
  
  const mediaMap = new Map<string, { id: string, media_type: string, mime_type: string }>()
  if (mediaFilenames.length > 0) {
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('id, filename, media_type, mime_type')
      .in('filename', mediaFilenames)
      .eq('user_id', user.id)

    if (mediaAssets) {
      mediaAssets.forEach((m: { filename: string, id: string, media_type: string, mime_type: string }) => 
        mediaMap.set(m.filename, { id: m.id, media_type: m.media_type, mime_type: m.mime_type })
      )
    }
  }

  // Create the bulk import session
  const { data: importSession, error: importError } = await supabase
    .from('bulk_imports')
    .insert({
      user_id: user.id,
      filename,
      status: 'validating',
      total_rows: rawRows.length,
      valid_rows: 0,
      invalid_rows: 0,
      imported_rows: 0,
      failed_rows: 0
    })
    .select()
    .single()

  if (importError || !importSession) {
    console.error('Import creation error:', importError)
    throw new Error('Failed to create import session')
  }

  let validCount = 0
  let invalidCount = 0

  const importRowsToInsert = rawRows.map((rawRow, index) => {
    let rowStatus: 'valid' | 'invalid' = 'valid'
    const validationErrors: string[] = []
    let parsedData: z.infer<typeof csvRowSchema> | null = null

    // Run Zod validation
    const result = csvRowSchema.safeParse(rawRow)
    if (!result.success) {
      rowStatus = 'invalid'
      result.error.issues.forEach((err: z.ZodIssue) => {
        validationErrors.push(`${err.path.join('.')}: ${err.message}`)
      })
    } else {
      parsedData = result.data
    }

    // Check media
    let mediaAssetId = null
    let hasVideo = false
    let hasInvalidVideo = false
    let foundAssetsCount = 0
    const mediaFilename = (parsedData?.media_filename || rawRow.media_filename) as string | undefined
    const filenames = mediaFilename ? mediaFilename.split(/[,|]/).map(s => s.trim()).filter(Boolean) : []
    
    if (filenames.length > 0) {
      if (filenames.length > 10) {
        rowStatus = 'invalid'
        validationErrors.push('Maximum 10 media items allowed')
      }
      
      filenames.forEach((fname, i) => {
        const asset = mediaMap.get(fname)
        if (asset) {
          foundAssetsCount++
          if (i === 0) mediaAssetId = asset.id // store first one for backwards compatibility
          if (asset.media_type === 'video') {
            hasVideo = true
            if (asset.mime_type !== 'video/mp4' && asset.mime_type !== 'video/quicktime' && asset.mime_type !== 'video/mov') {
              hasInvalidVideo = true
            }
          }
        } else {
          rowStatus = 'invalid'
          validationErrors.push(`Media file '${fname}' not found in Media Library`)
        }
      })
    }

    // specific validation: instagram requires media
    if (parsedData?.platforms.includes('instagram')) {
      if (foundAssetsCount === 0) {
        rowStatus = 'invalid'
        validationErrors.push('Instagram posts require media')
      } else if (hasVideo && hasInvalidVideo) {
        rowStatus = 'invalid'
        validationErrors.push('Instagram videos must be MP4 or MOV format')
      }
    }
    
    // specific validation: x media limit
    if (parsedData?.platforms.includes('x') && foundAssetsCount > 4) {
      rowStatus = 'invalid'
      validationErrors.push('X (Twitter) only supports up to 4 media items')
    }

    // specific validation: x caption length
    if (parsedData?.platforms.includes('x') && parsedData.caption && parsedData.caption.length > 280) {
      validationErrors.push('Warning: X (Twitter) caption exceeds 280 characters')
    }

    if (rowStatus === 'valid') {
      validCount++
    } else {
      invalidCount++
    }

    return {
      bulk_import_id: importSession.id,
      user_id: user.id,
      row_number: index + 1,
      raw_data: rawRow,
      caption: parsedData?.caption || (rawRow.caption as string | undefined) || null,
      platforms: parsedData?.platforms || null,
      scheduled_at: parsedData?.scheduled_at || null,
      timezone: parsedData?.timezone || null,
      media_filename: mediaFilename || null,
      media_asset_id: mediaAssetId,
      first_comment: parsedData?.first_comment || null,
      status: parsedData?.status || 'draft',
      row_status: rowStatus,
      validation_errors: validationErrors
    }
  })

  // Insert rows in batches if necessary, but Supabase can handle a decent array
  const { error: rowsError } = await supabase
    .from('bulk_import_rows')
    .insert(importRowsToInsert)

  if (rowsError) {
    console.error('Rows insert error:', rowsError)
    await supabase
      .from('bulk_imports')
      .update({ status: 'failed', error_message: 'Failed to insert rows' })
      .eq('id', importSession.id)
      .eq('user_id', user.id)
    throw new Error('Failed to insert rows')
  }

  // Update session status
  await supabase
    .from('bulk_imports')
    .update({
      status: 'ready',
      valid_rows: validCount,
      invalid_rows: invalidCount
    })
    .eq('id', importSession.id)
    .eq('user_id', user.id)

  return importSession.id
}

export async function getBulkImport(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: importSession } = await supabase
    .from('bulk_imports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!importSession) return null

  const { data: rows } = await supabase
    .from('bulk_import_rows')
    .select('*')
    .eq('bulk_import_id', id)
    .eq('user_id', user.id)
    .order('row_number', { ascending: true })

  return { importSession, rows: rows || [] }
}

export async function executeBulkImport(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: importSession } = await supabase
    .from('bulk_imports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!importSession || importSession.status !== 'ready') {
    throw new Error('Invalid import session')
  }

  // Update status to validating (importing state)
  await supabase.from('bulk_imports').update({ status: 'validating' }).eq('id', id).eq('user_id', user.id)

  // Get valid rows
  const { data: validRows } = await supabase
    .from('bulk_import_rows')
    .select('*')
    .eq('bulk_import_id', id)
    .eq('user_id', user.id)
    .eq('row_status', 'valid')

  if (!validRows || validRows.length === 0) {
    await supabase.from('bulk_imports').update({ status: 'imported', imported_rows: 0 }).eq('id', id).eq('user_id', user.id)
    return { success: true, imported: 0 }
  }

  // Pre-fetch all media assets for these rows to avoid N+1 queries
  const allMediaFilenames = [...new Set(validRows.map(r => r.media_filename).filter(Boolean).flatMap(f => f.split(/[,|]/).map((s: string) => s.trim()).filter(Boolean)))]
  const mediaMap = new Map<string, string>()
  
  if (allMediaFilenames.length > 0) {
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('id, filename')
      .in('filename', allMediaFilenames)
      .eq('user_id', user.id)
      
    if (mediaAssets) {
      mediaAssets.forEach((m: { filename: string, id: string }) => mediaMap.set(m.filename, m.id))
    }
  }

  let importedCount = 0
  let failedCount = 0

  for (const row of validRows) {
    try {
      // 1. Insert Post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: row.caption,
          first_comment: row.first_comment,
          status: row.status,
          scheduled_at: row.scheduled_at,
          timezone: row.timezone
        })
        .select('id')
        .single()

      if (postError || !post) throw postError

      // 2. Insert PostMedia if exists
      if (row.media_filename) {
        const filenames = row.media_filename.split(/[,|]/).map((s: string) => s.trim()).filter(Boolean)
        const mediaInserts = filenames.map((fname: string, idx: number) => {
          const assetId = mediaMap.get(fname)
          if (!assetId) return null
          return {
            post_id: post.id,
            media_asset_id: assetId,
            display_order: idx + 1
          }
        }).filter(Boolean)

        if (mediaInserts.length > 0) {
          const { error: mediaError } = await supabase
            .from('post_media')
            .insert(mediaInserts)
          if (mediaError) throw mediaError
        }
      }

      // 3. Insert PostTargets
      if (row.platforms && row.platforms.length > 0) {
        const targets = row.platforms.map((p: string) => ({
          post_id: post.id,
          platform: p,
          status: 'pending' as const
        }))
        const { error: targetsError } = await supabase
          .from('post_targets')
          .insert(targets)
        if (targetsError) throw targetsError
      }

      // Mark row as imported
      await supabase.from('bulk_import_rows').update({ row_status: 'imported', post_id: post.id }).eq('id', row.id).eq('user_id', user.id)
      importedCount++
    } catch (err) {
      console.error('Row import error:', err)
      await supabase.from('bulk_import_rows').update({ row_status: 'failed', validation_errors: [...(row.validation_errors || []), 'Failed to create post'] }).eq('id', row.id).eq('user_id', user.id)
      failedCount++
    }
  }

  // Update import session
  await supabase.from('bulk_imports').update({
    status: 'imported',
    imported_rows: importedCount,
    failed_rows: failedCount
  }).eq('id', id).eq('user_id', user.id)

  return { success: true, imported: importedCount, failed: failedCount }
}

export async function cancelBulkImport(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('bulk_imports')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
}
