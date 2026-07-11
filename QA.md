# Posthi MVP QA Checklist

This document serves as a developer checklist to ensure that all internal features of the Posthi MVP work correctly before connecting to real external APIs (X/Instagram/etc.).

## Environment Setup
- [ ] Ensure local Supabase is running (`supabase start`).
- [ ] Run the Next.js app (`npm run dev`).
- [ ] Create a local account and log in.

## 1. Dashboard & Navigation
- [ ] Check that the sidebar navigation correctly routes to all pages.
- [ ] Ensure the main dashboard displays stats (even if mocked/0).
- [ ] Verify that recent posts (if any) show up in the dashboard preview.

## 2. Media Library
- [ ] Navigate to the Media Library.
- [ ] Upload an image file (.png or .jpg).
- [ ] Verify the upload appears in the grid immediately.
- [ ] Upload a video file (.mp4).
- [ ] Delete a media file and confirm it disappears from the list.

## 3. Post Creation (Single)
- [ ] Navigate to "Create Post".
- [ ] Write a caption.
- [ ] Click "Add Hashtags" and verify you can select an existing hashtag set.
- [ ] Select platforms (e.g., X and Instagram).
- [ ] Select media from the Media Library (required for Instagram).
- [ ] Enter a first comment (Instagram specific).
- [ ] Attempt to save as draft. Verify it saves correctly.
- [ ] Attempt to schedule a post for a future date/time. Verify it redirects and saves successfully.

## 4. Bulk Schedule
- [ ] Navigate to "Bulk Schedule".
- [ ] Download the CSV template.
- [ ] Edit the CSV template. Add valid rows and invalid rows (e.g., past dates, extremely long captions for X, missing media for Instagram).
- [ ] Upload the CSV file.
- [ ] Verify the validation step accurately highlights valid and invalid rows.
- [ ] Execute the import for valid rows and verify they appear in the Calendar.
- [ ] Confirm double-uploads are prevented (buttons disable during upload).

## 5. Calendar
- [ ] Navigate to "Calendar".
- [ ] Verify scheduled posts from Step 3 and Step 4 appear on the correct dates.
- [ ] Change the month/week view (if implemented) to ensure dates navigate correctly.

## 6. Hashtag Sets
- [ ] Navigate to "Hashtag Sets".
- [ ] Create a new set (e.g., name: `Marketing`, hashtags: `#growth #marketing`).
- [ ] Verify the set saves and appears in the list.
- [ ] Edit an existing set and save.
- [ ] Delete an existing set.

## 7. Connected Accounts
- [ ] Navigate to "Connected Accounts".
- [ ] Since it's a mock MVP, verify the UI displays the placeholders/mock connections properly.

## 8. Settings
- [ ] Navigate to "Settings".
- [ ] Change the default timezone and default platforms.
- [ ] Enable/Disable "Mock Publishing".
- [ ] Click "Save" and refresh the page to ensure settings persist.
- [ ] Verify the API Readiness Checklist indicates missing credentials correctly (based on env vars).

## 9. Mock Publishing Worker (Cron)
- [ ] Check that `CRON_SECRET` is set in `.env.local`.
- [ ] Trigger the cron job manually:
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:5001/api/cron
  ```
- [ ] Verify the cron returns a success message processing scheduled posts whose time has passed.
- [ ] Because of the 10% simulated failure rate, run the cron several times on different posts to see both success and failure behavior.

## 10. Publishing Logs
- [ ] Navigate to "Publishing Logs".
- [ ] Check that the attempts triggered by the cron job appear here.
- [ ] Ensure that successful attempts are marked "Published".
- [ ] Ensure that failed attempts (from the 10% mock failure rate) are marked "Failed" with an error message.
- [ ] For failed posts, click "Retry" (if available) and verify it creates a new attempt.

## Final Sign-off
Once all items are checked, the internal MVP architecture is robust. The next phase will involve replacing the mock API calls in the cron job with actual REST/SDK requests to X and Meta, and updating the OAuth flow in Connected Accounts.
