# Phase 14 - Provider Integration Foundation

Phase 14 prepares MatchA for production media and notification providers without forcing real credentials in local development.

## Built

- Authenticated Cloudinary upload-signature API for profile photos and verification evidence.
- Cloudinary signing service with deterministic folders per user and purpose.
- `PushToken` Prisma model and migration for web, iOS, and Android device tokens.
- Notification APIs to register, list, and revoke push tokens.
- Web client helpers for signed uploads and push-token registration.
- Schema and client tests for the new contracts.

## API Surface

- `POST /api/profile/photos/upload-signature`
- `GET /api/notifications/push-tokens`
- `POST /api/notifications/push-tokens`
- `POST /api/notifications/push-tokens/revoke`

## Provider Behavior

Cloudinary signing requires:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

When these are blank, the API returns `503 CLOUDINARY_NOT_CONFIGURED` instead of accepting unsafe unsigned uploads.

Firebase credentials remain optional in this phase. Device tokens can be stored now; real FCM dispatch can be enabled in the next provider-delivery phase.
