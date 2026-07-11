# Production QA Checklist

Run through this manual QA process after deploying Posthi to Vercel to ensure all systems are functioning securely and correctly.

## A. App Deployment
- [ ] Visit `https://posthi.app`.
- [ ] Log in with a test account.
- [ ] Verify the Dashboard loads successfully.
- [ ] Open the browser console and verify there are no runtime errors or missing environment variable warnings.

## B. Supabase Configuration
- [ ] Test authentication (sign out and sign back in).
- [ ] Go to Media Library and upload an image and a video. Verify they appear.
- [ ] Verify new records are appearing in the respective Supabase tables.
- [ ] From an incognito window without logging in, attempt to access protected media or API routes to verify RLS blocks unauthorized access.

## C. X (Twitter) Integration
- [ ] Navigate to Settings -> Connected Accounts.
- [ ] Connect an X account using the OAuth flow.
- [ ] Send a text-only test post from Settings. Verify it appears on X.
- [ ] Create a post with an image and schedule it. Run the worker manually (or wait for cron). Verify it publishes.
- [ ] Create a post with a video and schedule it. Verify it publishes.
- [ ] Check the Publishing Logs and Calendar to confirm the status is marked as 'published'.

## D. Instagram Integration
- [ ] Navigate to Settings -> Connected Accounts.
- [ ] Connect an Instagram Professional account via the Meta OAuth flow.
- [ ] Send an image test post from Settings. Verify it appears on Instagram.
- [ ] Send a Reel test post. Verify it appears.
- [ ] Send a Carousel test post. Verify it appears correctly formatted.
- [ ] Check the Publishing Logs and Calendar to confirm the status is updated.

## E. Bulk Schedule
- [ ] Download the CSV template.
- [ ] Fill it with 3 rows: a single image post, a Reel, and a Carousel (using comma/pipe separated filenames).
- [ ] Import the CSV. Ensure the validation correctly maps to existing Media Library assets.
- [ ] Approve the schedule.
- [ ] Verify the Calendar is populated with the imported posts.
- [ ] Allow the cron worker to run. Verify they publish successfully.
- [ ] Check the Publishing Logs for the detailed output of each bulk-scheduled post.

## F. Failure & Edge Cases
- [ ] Upload an invalid CSV (missing headers) and verify it's rejected gracefully.
- [ ] Schedule a post, then delete the associated media from the Media Library. Verify the worker handles the missing media safely and marks the post as failed.
- [ ] Attempt to hit the `/api/worker/publish-due-posts` endpoint without the `CRON_SECRET` and verify it returns a 401 Unauthorized.
- [ ] Change the `CRON_SECRET` in Vercel to simulate a mismatch and verify the worker fails closed.
- [ ] Test the "Retry" button on a failed post in the Publishing Logs. Verify it resets the status and the worker picks it up on the next run.
