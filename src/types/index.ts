// ============================================================
// POSTHI — SHARED TYPES
// ============================================================

export type Platform = 'x' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'pinterest' | 'google_business'

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'

export type TargetStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'skipped'

export type MediaType = 'image' | 'video'

export type BulkImportStatus = 'uploaded' | 'validating' | 'ready' | 'imported' | 'failed' | 'cancelled'

export type BulkImportRowStatus = 'pending' | 'valid' | 'invalid' | 'imported' | 'failed'

export type SocialAccountStatus = 'not_connected' | 'connected' | 'expired' | 'error' | 'disconnected'

// ============================================================
// DATABASE ROW TYPES
// ============================================================

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AppSettings {
  id: string
  user_id: string
  default_timezone: string
  default_platforms: Platform[]
  default_hashtag_set_id: string | null
  monthly_x_spend_limit: number
  mock_publishing: boolean
  created_at: string
  updated_at: string
}

export interface SocialAccount {
  id: string
  user_id: string
  platform: Platform
  platform_user_id: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  scopes: string[] | null
  status: SocialAccountStatus
  last_connected: string | null
  last_posted: string | null
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  user_id: string
  filename: string
  storage_path: string
  public_url: string | null
  media_type: MediaType
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  duration_sec: number | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  caption: string
  first_comment: string | null
  status: PostStatus
  scheduled_at: string | null
  timezone: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostMedia {
  id: string
  post_id: string
  media_asset_id: string
  display_order: number
  created_at: string
}

export interface PostTarget {
  id: string
  post_id: string
  social_account_id: string | null
  platform: Platform
  status: TargetStatus
  external_post_id: string | null
  external_post_url: string | null
  error_message: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostAttempt {
  id: string
  post_id: string
  post_target_id: string
  attempt_number: number
  status: TargetStatus
  error_message: string | null
  external_post_id: string | null
  external_post_url: string | null
  response_data: Record<string, unknown> | null
  created_at: string
}

export interface BulkImport {
  id: string
  user_id: string
  filename: string
  status: BulkImportStatus
  total_rows: number
  valid_rows: number
  invalid_rows: number
  imported_rows: number
  failed_rows: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface BulkImportRow {
  id: string
  bulk_import_id: string
  user_id: string
  row_number: number
  raw_data: Record<string, unknown>
  caption: string | null
  platforms: Platform[] | null
  scheduled_at: string | null
  timezone: string | null
  media_filename: string | null
  media_asset_id: string | null
  first_comment: string | null
  status: PostStatus | null
  row_status: BulkImportRowStatus
  validation_errors: string[]
  post_id: string | null
  created_at: string
  updated_at: string
}

export interface HashtagSet {
  id: string
  user_id: string
  name: string
  hashtags: string[]
  created_at: string
  updated_at: string
}

// ============================================================
// UI TYPES
// ============================================================

export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface DashboardStat {
  label: string
  value: number | string
  icon: string
  href?: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
}
