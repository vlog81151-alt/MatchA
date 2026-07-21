# Security Baseline

Phase 1 includes:

- Helmet security headers
- CORS origin allowlist
- Request body size limits
- Rate limiting
- Signed cookies foundation
- Structured logging with sensitive field redaction
- Request IDs for audit correlation
- Zod request validation helper
- Centralized error handling
- Prisma ORM to avoid raw SQL by default

Later phases will add:

- CSRF protection for cookie-authenticated mutations
- Cloudinary upload signatures
- Firebase Cloud Messaging credentials
- Admin role-based access control
- Audit logging around every sensitive action

Phase 2 added:

- JWT access and refresh token rotation
- Google OAuth backend verification
- Email OTP
- CSRF protection for cookie-authenticated mutations
- Password hashing with Argon2
- Auth audit logging
- HttpOnly signed cookies
