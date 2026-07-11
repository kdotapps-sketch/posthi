# Posthi Launch Readiness Audit

Scan date: 2026-07-11

## Automated Checks

- PASS: `npm run lint`
- PASS: `npm run build`
- PASS: `npm audit --audit-level=high`
- PASS: `.env.local` is ignored and no project env file is tracked.

## Fixed In This Pass

- Added security headers in `next.config.ts`.
- Set `turbopack.root` so Next builds from the Posthi app directory instead of the home-level git root.
- Migrated `src/middleware.ts` to the Next 16 `src/proxy.ts` convention.
- Added `/api/health` for production health checks.
- Marked encryption, service-role, publisher, and rate-limit modules as server-only.
- Added request validation to X and Instagram test-publish endpoints.
- Added lightweight server-side throttling to OAuth start and test-publish endpoints.
- Added explicit `user_id` scoping to dashboard stats, settings social-account fetches, calendar queries, media-library actions, and bulk-import reads/updates.
- Hardened media deletion so storage paths are read from the authenticated user's database record rather than trusted from client input.
- Updated stale QA documentation for the publishing worker route.

## Ship Gate Status

### Critical Manual Gates

- Confirm all required Vercel production env vars are set.
- Confirm Supabase RLS is enabled and policies exist for every user-data table. Run `docs/supabase-rls-verification.sql` in Supabase and resolve any rows returned.
- Confirm Supabase backups are enabled and a restore path is understood before accepting real customer data.
- Confirm production OAuth redirect URIs are configured in X and Meta developer portals.
- Confirm the production `oauth_tokens` table supports the columns used by both integrations: X uses `access_token`/`refresh_token`; Instagram uses `access_token_encrypted`.

### High-Priority Gates

- Complete `docs/production-qa.md` after the first Vercel deployment.
- Configure the scheduled worker in `docs/production-cron.md`.
- Confirm `www.posthi.app` and apex-domain redirect behavior in Vercel.
- Confirm Meta app review status before opening Instagram publishing to non-test users.

### Advisory

- `npm audit` reports a moderate PostCSS advisory through Next's bundled dependency. There is no safe patch above `next@16.2.10` at scan time; do not run `npm audit fix --force` because npm proposes a breaking downgrade.
- Add production error monitoring before broader public launch.
