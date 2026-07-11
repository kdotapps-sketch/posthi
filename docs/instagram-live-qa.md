# Instagram / Meta Live QA & Testing Guide

This guide covers how to set up your local development environment to safely test Posthi's Instagram Professional Account integration.

## 1. Meta Developer App Setup
1. Go to the [Meta App Dashboard](https://developers.facebook.com/apps).
2. Create a new App (or use an existing one) with the "Business" type.
3. Under **App Settings > Basic**, note the **App ID** and **App Secret**.
4. Add the **Facebook Login for Business** product to your app.
5. In **Facebook Login for Business > Settings**, under "Valid OAuth Redirect URIs", add:
   `http://localhost:5001/api/oauth/instagram/callback`

## 2. Environment Variables
Add the following to your local `.env.local` file:
```env
# Required for Instagram/Meta OAuth
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:5001/api/oauth/instagram/callback

# Used to encrypt long-lived tokens in Supabase
POSTHI_ENCRYPTION_KEY=your_32_byte_secret_key
```

## 3. Account Requirements
To test Instagram publishing, the test account MUST be an **Instagram Professional Account** (Business or Creator).
1. The Instagram Professional Account must be linked to a **Facebook Page**.
2. When testing, the user logging into Facebook must have Admin access to the linked Facebook Page.

## 4. How to Connect
1. Ensure your local server is running (`npm run dev`) on `localhost:5001`.
2. Go to **Settings > Connected Accounts**.
3. Select **Instagram** from the platform dropdown and click **Connect**.
4. You will be redirected to Facebook to authorize Posthi. Make sure to grant access to your Facebook Page and linked Instagram account.
5. You will be redirected back to the settings page, and your username should appear in the connected list.

## 5. How to Test Image Publishing
To safely verify image publishing without waiting for the Cron scheduler:
1. Go to **Settings > Connected Accounts**.
2. Click the **Test Post (Image)** button next to your connected Instagram account.
3. Posthi will use a default placeholder image (`https://picsum.photos/id/237/1080/1080`) and publish it directly to your Instagram account via the Graph API.
4. Check your Instagram account to see the live post!

## 6. Troubleshooting
- **Missing Scopes:** If the Meta token error shows missing scopes, ensure your app requested `instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`.
- **No Instagram Professional Account Linked:** The callback route will fail if your Facebook Page is not correctly mapped to an Instagram Business account. Go to Facebook Page Settings > Linked Accounts to verify.
- **Media Container Timeout:** If publishing fails or times out, it often means Meta couldn't reach the image URL. Supabase Storage buckets must be accessible. Posthi generates 1-hour signed URLs for private assets.
