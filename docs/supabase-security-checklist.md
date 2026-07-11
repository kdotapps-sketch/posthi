# Supabase Security Checklist

Before exposing the application to public traffic, verify the following configurations in your Supabase dashboard to ensure data security.

## Row Level Security (RLS)

- [ ] Ensure RLS is enabled on all tables that store user data:
  - `posts`
  - `post_targets`
  - `post_media`
  - `media_assets`
  - `app_settings`
  - `hashtag_sets`
  - `oauth_tokens`
  - `social_accounts`
- [ ] Verify policies exist to strictly enforce `user_id = auth.uid()` for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations on these tables.
- [ ] Ensure `oauth_tokens` does NOT have any RLS policies allowing client-side fetching. It should only be accessible via the Service Role key used server-side.

## Storage Security

- [ ] Verify the `posthi-media` storage bucket has appropriate security policies.
- [ ] Ensure users can only upload media to their designated paths (if using structured storage) or their own user ID.
- [ ] For publishing, signed URLs or secure public URLs are used. Ensure sensitive or private media is not exposed indefinitely.

## Token Security

- [ ] Ensure raw OAuth tokens are never exposed to the frontend or logged in console statements.
- [ ] Verify that tokens in `oauth_tokens` are successfully encrypted at rest using `POSTHI_ENCRYPTION_KEY`.

## API Key Safety

- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is NEVER prefixed with `NEXT_PUBLIC_` and is not exposed to the browser.
- [ ] Use `createClient()` from `@/lib/supabase/server` for authenticated user operations server-side.
- [ ] Use the Service Role client sparingly, and only in protected endpoints (like the cron worker or webhook handlers).

## Database Backups

- [ ] Consider upgrading your Supabase plan to Point-in-Time Recovery (PITR) if storing critical scheduled posts.
