# Production Cron Setup

Posthi relies on a scheduled background worker to find and publish due posts. In local development, you can manually test this by hitting the API route. In production, this needs to be automated.

## Target Worker URL

The production API endpoint for the worker is:
`https://posthi.app/api/worker/publish-due-posts`

This endpoint expects an `Authorization` header containing your `CRON_SECRET`:
`Authorization: Bearer <your_cron_secret>`

## Supabase Cron Job Configuration

You can use the pg_cron extension built into Supabase to ping your worker every 5 minutes.

1. Go to your Supabase Dashboard.
2. Open the **SQL Editor**.
3. Create a new snippet and run the following SQL:

```sql
select
  cron.schedule(
    'posthi-worker-5min',
    '*/5 * * * *', -- Every 5 minutes
    $$
    select
      net.http_get(
        url:='https://posthi.app/api/worker/publish-due-posts',
        headers:='{"Authorization": "Bearer YOUR_CRON_SECRET_HERE"}'::jsonb
      ) as request_id;
    $$
  );
```

*Note: Replace `YOUR_CRON_SECRET_HERE` with the actual secret from your environment variables.*

## Verification

1. After scheduling, you can check the status of the cron job in the `cron.job` table.
2. To see the execution history and any errors, query the `cron.job_run_details` table.
3. You can also view the logs of your Vercel deployment to confirm that the `GET /api/worker/publish-due-posts` route is being hit successfully and is processing posts.
