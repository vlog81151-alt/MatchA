# Environment Variables

Copy `.env.example` to `.env` for local development.

Never commit real secrets.

Required for local development:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `COOKIE_SECRET`
- `WEB_ORIGIN`
- `ADMIN_ORIGIN`
- `CORS_ORIGINS`
- `SEED_USER_PASSWORD`
- `SEED_ADMIN_PASSWORD`

Provider variables are intentionally empty until the relevant phases:

- Google OAuth
- Cloudinary
- Firebase
- SMTP
- Google Maps

For production deployment, see `docs/DEPLOYMENT.md`.

Run the preflight check before deploying an environment:

```bash
NODE_ENV=production corepack pnpm preflight
```
