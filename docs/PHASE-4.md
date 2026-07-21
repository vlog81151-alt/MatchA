# Phase 4 - Profile

## Built

- Protected profile API module
- Onboarding update endpoint
- Profile read endpoint
- Photo metadata endpoints
- Primary photo selection
- Photo deletion
- Verification request endpoint
- Profile completion scoring
- Audit logging for profile updates
- Web onboarding page at `/onboarding`
- Web profile edit page at `/profile`
- Auth redirects to onboarding for incomplete profiles
- Shared textarea UI primitive
- Shared profile DTO types

## API Endpoints

- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `POST /api/profile/photos`
- `PATCH /api/profile/photos/:photoId/primary`
- `DELETE /api/profile/photos/:photoId`
- `POST /api/profile/verification`

All profile endpoints require access-token authentication through bearer tokens or signed HttpOnly cookies.

## Profile Fields

The onboarding flow supports:

- Name
- Age
- Gender
- Interested in
- Profession
- Education
- Height
- Religion
- Languages
- Bio
- Interests and hobbies
- Relationship goal
- Smoking
- Drinking
- Pets
- Music
- Food
- Travel
- Prompt answers
- Location
- Photo metadata
- Verification request

## Local Database

Local PostgreSQL is configured on this machine with:

- Database: `matcha`
- App role: `matcha_app`
- App password: `matcha_dev_password`
- URL: `postgresql://matcha_app:matcha_dev_password@localhost:5432/matcha`

The migration has been applied and seed data has been loaded.

## Deferred To Later Phases

- Cloudinary signed uploads
- Photo moderation workflow in admin
- Public profile discovery feed
- Profile privacy toggles
- Government ID provider integration
