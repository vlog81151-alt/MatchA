# MatchA Deployment

This document describes the production deployment path for the current monorepo:

- Consumer web: Vercel project from `apps/web`
- Admin dashboard: Vercel project from `apps/admin`
- API backend: Railway service using `Dockerfile.backend`
- Database: Supabase PostgreSQL or any managed PostgreSQL provider

## 1. Production URLs

Choose final URLs before setting environment variables.

Example:

- Web: `https://matcha.example`
- Admin: `https://admin.matcha.example`
- API: `https://api.matcha.example`
- API base URL used by apps: `https://api.matcha.example/api`

## 2. Database

Create a PostgreSQL database in Supabase.

Required database steps:

1. Copy the pooled or direct connection string into `DATABASE_URL`.
2. Run migrations from a trusted machine or CI:

```bash
corepack pnpm db:deploy
```

3. Seed only non-production/demo environments:

```bash
corepack pnpm db:seed
```

Do not seed production with demo users unless the environment is explicitly a demo/staging deployment.

## 3. Backend on Railway

Railway uses the root `railway.json` and `Dockerfile.backend`.

Required backend variables:

- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL`
- `WEB_ORIGIN`
- `ADMIN_ORIGIN`
- `CORS_ORIGINS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL=15m`
- `JWT_REFRESH_TTL=30d`
- `COOKIE_SECRET`
- `EMAIL_FROM`

Provider variables, set when integrations are enabled:

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Firebase: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

Run preflight before deploy:

```bash
NODE_ENV=production corepack pnpm preflight
```

Railway health check:

```text
/api/health
```

Manual backend verification:

```bash
curl https://api.matcha.example/api/health
```

## 4. Web App on Vercel

Create a Vercel project with root directory:

```text
apps/web
```

The app-level `apps/web/vercel.json` runs the build from the monorepo root.

Required web variables:

- `NEXT_PUBLIC_APP_URL=https://matcha.example`
- `NEXT_PUBLIC_API_URL=https://api.matcha.example/api`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

If a provider is not configured yet, leave its public key blank and keep the related UI disabled or explanatory.

## 5. Admin App on Vercel

Create a second Vercel project with root directory:

```text
apps/admin
```

Required admin variables:

- `NEXT_PUBLIC_API_URL=https://api.matcha.example/api`

The backend `ADMIN_ORIGIN` must exactly match the admin Vercel URL.

## 6. CORS and Cookies

Set backend CORS values carefully:

```text
WEB_ORIGIN=https://matcha.example
ADMIN_ORIGIN=https://admin.matcha.example
CORS_ORIGINS=https://matcha.example,https://admin.matcha.example
```

If Vercel preview deployments are used, add the exact preview origins to `CORS_ORIGINS` for the environment that needs them. Do not use wildcard CORS with credentialed cookies.

## 7. Release Checklist

Run these before promoting a release:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Then verify:

- `/api/health` returns `status: ok`
- Web login works with a real user
- Admin login works with an admin user
- Refresh-token cookie is present and secure
- Logout clears the session
- Matching, chat, notifications, events, concerts, and Instant Date load without CORS errors

## 8. Rollback

Keep the previous Railway deployment and previous Vercel deployment available.

Rollback order:

1. Roll back backend if API health, auth, CORS, or database access is failing.
2. Roll back web/admin if UI routing or static build output is failing.
3. Roll back database only if a migration is confirmed to be the root cause and a tested down migration exists.
