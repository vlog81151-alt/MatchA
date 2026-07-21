# Phase 3 - Database

## Built

- Initial Prisma migration at `database/prisma/migrations/20260627090000_init/migration.sql`
- Prisma migration lock for PostgreSQL
- Prisma CLI config at `database/prisma.config.ts`
- Database seed runner at `database/prisma/seed.ts`
- TypeScript checking for database seed code
- Root database command aliases:
  - `db:generate`
  - `db:migrate`
  - `db:deploy`
  - `db:reset`
  - `db:seed`
  - `db:status`
  - `db:studio`
- Seed environment variables in `.env.example`
- Database setup notes in `database/README.md`

## Schema Coverage

The migration creates normalized tables for:

- Users
- Photos
- Interests
- User interests
- Likes
- Passes
- Matches
- Messages
- Notifications
- Events
- Concerts
- Event participants
- Concert participants
- Instant dates
- Reports
- Blocks
- Verification records
- Sessions
- Refresh tokens
- Email OTPs
- Password reset tokens
- Settings
- Audit logs

The schema includes foreign keys, compound uniqueness, cascade behavior, enums, and indexes for profile discovery, matching, messaging, concerts, events, sessions, and moderation workflows.

## Seed Data

The seed is idempotent for MatchA-owned demo data. It refreshes the demo profiles and experiences without deleting unrelated local users.

Seeded data includes:

- One admin account
- Six demo dating profiles based in Jaipur
- Profile photos and verification records
- Interest catalog
- User interest relationships
- Settings
- Likes and mutual matches
- Chat messages
- Concert mode data
- Local events
- Event/concert participants
- Instant date requests
- Notifications
- Audit logs

Seed credentials:

- Admin: `admin@matcha.local` / `Admin@2026`
- Demo user password: `Matcha@2026`

## Commands

```bash
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm db:studio
```

For production or CI:

```bash
corepack pnpm db:deploy
```

## Local Verification Notes

PostgreSQL 18 is installed on the current machine. A local `matcha` database and `matcha_app` role were configured, the initial migration was applied, and seed data was loaded successfully.

Local connection:

```env
DATABASE_URL=postgresql://matcha_app:matcha_dev_password@localhost:5432/matcha
```

## Deferred To Later Phases

- Query services for profile discovery and filters
- Pagination and cursor helpers for feeds/messages
- Database-level geospatial extensions if product requires accurate distance ranking
- Admin reporting queries and analytics materialization
