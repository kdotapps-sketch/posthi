# Posthi

Posthi is a modern social media scheduling platform.

## Getting Started (Local Development)

First, make sure you have your `.env.local` configured based on `.env.example`.

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:5001](http://localhost:5001) with your browser to see the result.

## Environment Variables

For local development, your `.env.local` should have URLs pointing to localhost:
```env
NEXT_PUBLIC_APP_URL=http://localhost:5001
X_REDIRECT_URI=http://localhost:5001/api/oauth/x/callback
META_REDIRECT_URI=http://localhost:5001/api/oauth/instagram/callback
```

For production deployment on Vercel, the environment variables should point to your production domain:
```env
NEXT_PUBLIC_APP_URL=https://posthi.app
X_REDIRECT_URI=https://posthi.app/api/oauth/x/callback
META_REDIRECT_URI=https://posthi.app/api/oauth/instagram/callback
```

**Security Warning:** Never commit `.env.local` or any secrets to version control. Keep `POSTHI_ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` safely stored in Vercel's Environment Variables settings.

## Deploy on Vercel

Check the `docs/production-deployment.md` file for step-by-step instructions on deploying Posthi to Vercel and setting up Supabase Cron.
