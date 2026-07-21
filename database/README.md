# MatchA Database

This package owns the PostgreSQL schema through Prisma.

The schema supports authentication, profile onboarding, matching, chat, instant dates, concert mode, events, notifications, safety, and admin operations.

Prisma CLI settings live in `prisma.config.ts`, including the migration path and seed command.

## Commands

```bash
corepack pnpm --filter @matcha/database db:generate
corepack pnpm --filter @matcha/database db:migrate
corepack pnpm --filter @matcha/database db:deploy
corepack pnpm --filter @matcha/database db:seed
corepack pnpm --filter @matcha/database db:reset
corepack pnpm --filter @matcha/database db:status
corepack pnpm --filter @matcha/database db:studio
```

Root aliases are also available:

```bash
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm db:studio
```

## Local Development

1. Copy `.env.example` to `.env` at the repo root and keep `DATABASE_URL` pointed at your local PostgreSQL instance. Prisma also supports `database/.env` as a package-local fallback.
2. Start PostgreSQL. If Docker is installed, use `docker compose up -d postgres`.
3. Apply migrations with `corepack pnpm db:migrate`.
4. Seed product demo data with `corepack pnpm db:seed`.

Seed credentials:

- Admin: `admin@matcha.local` / `Admin@2026`
- Demo users: `arjun@matcha.local`, `aanya@matcha.local`, `meera@matcha.local`, `kabir@matcha.local`, `saira@matcha.local`, `rohan@matcha.local`
- Demo user password: `Matcha@2026`

Override seed passwords with `SEED_USER_PASSWORD` and `SEED_ADMIN_PASSWORD`.

Local app database:

- Database: `matcha`
- Role: `matcha_app`
- Password: `matcha_dev_password`
- URL: `postgresql://matcha_app:matcha_dev_password@localhost:5432/matcha`

## Production Deployment

For Railway or Supabase PostgreSQL, set `DATABASE_URL` in the deployment environment, then run:

```bash
corepack pnpm db:deploy
corepack pnpm db:seed
```

Use `db:deploy` for production and CI environments because it applies committed migrations without creating new migration files.
