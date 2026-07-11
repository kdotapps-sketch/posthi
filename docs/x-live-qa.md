# X / Twitter Live QA Guide

This document outlines how to safely test the X/Twitter OAuth 2.0 PKCE integration in the Posthi application.

## Prerequisites

1.  **X Developer Portal**
    *   Create a project and app in the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard).
    *   Set up **User authentication settings**:
        *   App permissions: `Read and write`. (If you need to read user profiles or DMs, you might need more, but `Read and write` is the minimum for posting).
        *   Type of App: `Web App, Automated App or Bot`.
        *   Callback URI / Redirect URL: `http://localhost:5001/api/oauth/x/callback`
        *   Website URL: `http://localhost:5001`
2.  **Environment Variables**
    Ensure these are set in your `.env.local` file:
    ```env
    X_CLIENT_ID=your_client_id
    X_CLIENT_SECRET=your_client_secret
    X_REDIRECT_URI=http://localhost:5001/api/oauth/x/callback
    POSTHI_ENCRYPTION_KEY=a-secure-32-character-random-string
    NEXT_PUBLIC_APP_URL=http://localhost:5001
    ```
    *Note: Ensure `POSTHI_ENCRYPTION_KEY` is present. Without it, token encryption/decryption will fail.*
3.  **Supabase**
    *   Ensure the `oauth_tokens` table is created in your database. See `implementation_plan.md` for the SQL query.
    *   Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
    *   For the publishing cron worker, `SUPABASE_SERVICE_ROLE_KEY` must be set.

## Testing Steps

### 1. Connection & Token Verification
*   Go to **Settings** > **Connected Accounts**.
*   Click **Connect X**.
*   You should be redirected to X to authorize the app.
*   Upon returning, verify the account appears in the "Connected Accounts" list with your username.
*   **Security Check**: Open Supabase dashboard and verify the `oauth_tokens` table. Ensure `access_token` and `refresh_token` are encrypted strings (starting with an IV hex and auth tag), not raw JWTs or opaque tokens.

### 2. Manual Test Post (Safe Flow)
*   In **Settings** > **Connected Accounts**, find the newly added X account.
*   Click **Send test post to X**.
*   A test post containing "Posthi test post - safe to delete" will be published.
*   Verify the post appears on your X profile.

### 3. Image Post
*   In the **Create Post** UI, upload an image and add some caption text.
*   Select the X account.
*   Schedule it for the next minute.
*   Wait for the Cron worker to process it, or manually hit `http://localhost:5001/api/worker/publish-due-posts` (requires `CRON_SECRET` auth header).
*   Verify the image appears correctly on X.

### 4. Video Post (If applicable)
*   Repeat the steps above but upload a small MP4 video.
*   *Note: Video uploads may require specific X API tier access (e.g., Basic or Pro). If it fails, check the Publishing Logs to ensure it failed gracefully with a clear message.*

### 5. Reconnection & Expiration
*   In the Supabase dashboard, manually alter the `expires_at` column for your X token to a date in the past.
*   Trigger a post via the Cron worker or the Test Post button.
*   The system should automatically use the `refresh_token` to get a new `access_token` and complete the post.
*   Verify in Supabase that the `expires_at` date has been updated to the future.
