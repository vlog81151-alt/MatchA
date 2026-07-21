# MatchA

MatchA is a luxury, mobile-first dating platform inspired by Jaipur architecture and Indian heritage.

This repository is a pnpm monorepo.

## Apps

- `apps/web` - Consumer web app built with Next.js 15, React 19, Tailwind CSS, Shadcn-style UI primitives, Framer Motion, TanStack Query, Zustand, React Hook Form, and Zod.
- `apps/admin` - Admin and moderation dashboard built with Next.js 15.
- `backend` - Express.js TypeScript API foundation.

## Packages

- `packages/ui` - Shared design system and UI primitives.
- `packages/config` - Shared TypeScript and Tailwind configuration.
- `packages/types` - Shared product and API types.

## Phase Status

Phase 1 is the production foundation:

- Monorepo structure
- Strict TypeScript
- Shared UI package
- Shared config package
- Shared domain types
- Consumer landing page foundation
- Admin shell foundation
- Secure backend foundation
- Environment templates

Phase 2 adds authentication:

- Signup, login, logout, refresh, `/me`
- Email OTP
- Forgot/reset password
- Google OAuth backend endpoint
- HttpOnly signed cookies and token responses

Phase 3 adds database operations:

- Initial Prisma migration
- PostgreSQL migration lock
- Database seed script
- Root database command aliases
- Demo users, matches, concerts, events, instant dates, notifications, and audit logs

Phase 4 adds profile and onboarding:

- Protected profile APIs
- Profile completion scoring
- Photo metadata management
- Verification request flow
- `/onboarding` and `/profile` web screens

Phase 5 adds matching:

- Recommendation API with compatibility scoring
- Like, pass, super-like, undo, and mutual match creation
- Matching filters and match list APIs
- Live `/home` recommendation deck
- `/matches` screen backed by active mutual matches

Phase 6 adds chat:

- Protected chat APIs and per-user chat state
- Socket.IO realtime rooms with cookie authentication
- Typing, presence, delivered, and read events
- Text, image, GIF, voice-note, reply, edit, and delete message support
- `/chats` and `/chats/:matchId` web screens
- Mute, archive, report, and block controls

Phase 7 adds Instant Date:

- Protected Instant Date APIs
- Nearby compatible recipient selection
- Accept, reject, cancel, reschedule, complete, and location-sharing actions
- Automatic match and chat handoff on accepted plans
- `/instant-date` mobile-first screen inspired by the Figma flow

Phase 8 adds Concert Mode:

- Protected concert search and participation APIs
- Join, update intent, confirm meetup, and cancel participation
- Participant previews and current-user concert state
- `/concert-mode` responsive screen inspired by the Figma flow

Phase 9 adds Events:

- Protected local event APIs
- Join, interested, cancel, share, and invite flows
- `/events` mobile-first discovery screen
- Admin event publish controls

Phase 10 adds Notifications:

- In-app notification inbox
- Unread-count APIs and home badge
- Type/channel filters, read-all, delete, and preferences
- Push/email preference data model

Phase 11 adds Admin Dashboard:

- Role-gated admin operations console
- Users, reports, verification requests, events, concerts, broadcasts, and audit logs
- Ban, unban, soft-delete, verification review, and publish actions

Phase 12 adds Testing:

- Vitest test runners for backend and web
- Backend API health and schema validation coverage
- Web HTTP-client regression coverage for JSON, no-content, and plain-text API errors
- CI test step added

Phase 13 adds Deployment:

- Railway backend config
- Vercel app configs for web and admin
- Production environment preflight script
- Deployment runbook in `docs/DEPLOYMENT.md`

Phase 14 adds Provider Integration Foundation:

- Authenticated Cloudinary signed-upload payloads for profile and verification images
- Push-token registry APIs for web, iOS, and Android notification devices
- Prisma migration for `PushToken`
- Web client helpers for upload signatures and push-token registration

## Commands

Use Corepack if `pnpm` is not installed globally:

```bash
corepack pnpm install
corepack pnpm dev
```

Run individual services:

```bash
corepack pnpm dev:web
corepack pnpm dev:admin
corepack pnpm dev:backend
```

Verify the workspace:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```
