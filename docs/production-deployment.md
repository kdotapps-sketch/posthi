# Production Deployment to Vercel

Follow these steps to deploy Posthi safely to Vercel.

## 1. Prepare Vercel Project

1. Log into your Vercel dashboard.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (only do this after you have committed the production readiness changes).
4. Do **not** click Deploy immediately. Open the **Environment Variables** section.

## 2. Environment Variables

Add the following environment variables to your Vercel project's **Production** environment:

```text
NEXT_PUBLIC_APP_URL=https://posthi.app
NEXT_PUBLIC_MOCK_PUBLISHING=false

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

POSTHI_ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here
CRON_SECRET=your_super_secret_cron_token_here

X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=https://posthi.app/api/oauth/x/callback

META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://posthi.app/api/oauth/instagram/callback
```

*Note: For Vercel Preview deployments, you may want to leave `NEXT_PUBLIC_MOCK_PUBLISHING=true` or provide separate testing credentials.*

## 3. Custom Domain

1. Go to the project **Settings** -> **Domains**.
2. Add your custom domain: `posthi.app`.
3. Optionally add `www.posthi.app` and redirect it to `posthi.app`.
4. Ensure the domain is verified and SSL certificates are issued by Vercel.

## 4. Deploy

1. Trigger a deployment.
2. Verify that the build succeeds without errors.
3. Open `https://posthi.app` and confirm the login screen loads.
4. Open `https://posthi.app/api/health` and confirm it returns `status: "ok"`.

## 5. Follow up

After deployment, refer to:
* `oauth-production-checklist.md` to update developer portals.
* `production-cron.md` to set up the scheduled publishing worker.
* `launch-readiness-audit.md` for the final manual launch gates.
