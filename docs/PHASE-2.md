# Phase 2 - Authentication

## Built

- Email/password signup
- Email/password login
- Google OAuth backend endpoint with Google ID token verification
- Email OTP request and verification
- Forgot password and reset password
- JWT access tokens
- JWT refresh tokens with database-backed rotation
- HttpOnly signed cookies for web auth
- Token response body for future mobile clients
- Session records
- Refresh token records
- OTP records
- Password reset records
- Audit logs for auth lifecycle events
- Protected `/api/auth/me` endpoint
- Logout with session and refresh-token revocation
- Auth pages in the web app:
  - `/signup`
  - `/login`
  - `/verify-otp`
  - `/forgot-password`
  - `/reset-password`

## Security Decisions

- Passwords use Argon2 hashing.
- OTP values are stored as HMAC hashes, not plaintext.
- Password reset tokens are stored as SHA-256 hashes.
- Refresh tokens are JWTs, stored by hash, rotated on refresh, and tied to sessions.
- Access and refresh tokens are set in signed HttpOnly cookies for browser use.
- API responses also include token values for future React Native or Expo reuse.
- Google OAuth rejects requests when provider credentials are not configured.
- Forgot password does not reveal whether an email exists.

## Development Notes

When SMTP is not configured, OTP and reset links are logged by the backend and returned in development responses so local testing remains possible. Production responses do not expose those values.

## Required Environment Variables

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `COOKIE_SECRET`
- `DATABASE_URL`
- `WEB_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

## Deferred To Later Phases

- Full protected onboarding flow
- RBAC admin login
- CSRF double-submit enforcement
- Email template branding system
- OAuth account linking UI
- Live Supabase migration and production seed data
