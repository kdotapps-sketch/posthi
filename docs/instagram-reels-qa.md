# Instagram Reels (Phase 13B) QA Guide

## Overview
Posthi now supports publishing videos to Instagram using the official Reels endpoint.
We use the same containerized media flow as images, but pass `media_type: 'REELS'` and `video_url` instead of `image_url`.

## Requirements for Video
- **Mime Types:** `video/mp4`, `video/quicktime`, `video/mov`
- **Count:** Exactly 1 video per post (Instagram currently limits automated Reels API to single videos).

## Testing the Implementation

### 1. Settings "Test Post (Reel)" Button
1. Go to Settings > Connected Accounts
2. Next to your connected Instagram account, click **Test Post (Reel)**
3. This sends an automated test video (a generic open-source video URL) via our test endpoint.
4. It should process for several seconds (since video containers take longer to finish) and alert "Success" with the external post ID.

### 2. Standard Composer
1. Go to Media Library and upload an MP4 file.
2. Go to Create Post.
3. Select "Instagram" (and optionally X).
4. Attach the uploaded MP4. The composer should label Instagram as "Instagram (Reel)".
5. Add a caption.
6. Click "Schedule Post" or "Save Draft".
7. (Wait for the cron job to pick it up if scheduled).
8. Check Publishing Logs. The post should show as Successful and the video should appear on your Instagram profile.

### 3. Bulk Schedule
1. Prepare a CSV file where one row has `media_filename` pointing to an uploaded MP4.
2. Ensure platforms includes `instagram`.
3. Upload CSV on Bulk Schedule.
4. Validation should pass and confirm Instagram will accept the MP4.
5. Execute import, then check the Calendar to ensure the Reel is scheduled.

## Troubleshooting
- **Container Processing Timeout:** Instagram videos take a while to process. If you get a timeout error, the container may still successfully process later, but Posthi gave up waiting. The code currently waits for 30 attempts x 5s = 150 seconds.
- **Unsupported Format:** If Instagram rejects it due to format/ratio, the status poll will return `status_code === 'ERROR'` with the rejection reason. We surface this reason directly in the logs.
