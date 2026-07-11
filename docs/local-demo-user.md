# Local Demo User System

To easily test the Posthi application locally without needing to connect real X (Twitter) or Instagram accounts manually, we provide a demo user seeding script.

## Demo User Details

* **Email:** demo@posthi.app
* **Password:** PosthiDemo123!

## Features

The demo user is automatically seeded with:
* Configured `app_settings` (including mock publishing enabled).
* A pre-configured `hashtag_sets` for testing bulk schedule.
* Connected mock social accounts for X and Instagram.
* Demo posts in various states (`draft`, `scheduled`, `published`, `failed`).

## How to use

1. Ensure your local environment variables are properly set in `.env.local`, specifically:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `SUPABASE_SERVICE_ROLE_KEY` (Required for bypassing RLS to create the user)

2. Run the seed script:
   ```bash
   npm run seed:demo
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:5001/login`. In development mode, a "Use demo account" button will appear beneath the main sign-in button. Click this to auto-fill the demo credentials and then click "Sign in".

## Security & Safety

This script is explicitly designed to **fail** if it detects a production environment. 
It checks:
* `NODE_ENV === 'production'`
* `NEXT_PUBLIC_APP_URL === 'https://posthi.app'`

If either condition is met, the script will abort, ensuring that this demo user is strictly for local testing. Furthermore, the "Use demo account" button is hidden in production.
