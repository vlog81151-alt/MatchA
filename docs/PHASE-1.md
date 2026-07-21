# Phase 1 - Project Setup

## Built

- pnpm monorepo at `matcha/`
- Consumer web app shell with Next.js 15, React 19, Tailwind, Framer Motion, TanStack Query, Zustand, Zod, and shared UI components
- Admin app shell with moderation dashboard foundation
- Express TypeScript backend with Helmet, CORS, compression, rate limiting, cookie parsing, request IDs, structured logging, validation, error handling, and Socket.IO
- Prisma PostgreSQL schema for users, photos, interests, likes, passes, matches, messages, notifications, events, concerts, participants, instant dates, reports, blocks, verification, sessions, refresh tokens, settings, and audit logs
- Shared UI, config, and types packages
- Docker Compose for PostgreSQL and Redis
- CI workflow, VS Code recommendations, environment template, and phase-check script

## Not Yet Built

Per the required development order, Phase 1 does not implement:

- Production authentication
- Database migrations against a live Supabase database
- Full onboarding
- Matching algorithms
- Chat business logic
- Notifications
- Admin protected routes

These start in Phase 2 and onward.

## Run

```bash
corepack pnpm install
corepack pnpm dev:web
corepack pnpm dev:admin
corepack pnpm dev:backend
```

## Local Services

```bash
docker compose up -d postgres redis
```
