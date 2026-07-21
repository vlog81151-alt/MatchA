# MatchA Architecture

## Monorepo

```text
matcha/
  apps/
    web/
    admin/
  packages/
    ui/
    config/
    types/
  backend/
  database/
  docs/
  scripts/
```

## Principles

- Business contracts live in `packages/types`.
- Design primitives live in `packages/ui`.
- Framework-specific screens live in `apps/web` and `apps/admin`.
- Backend domain behavior lives in `backend/src`.
- Database ownership lives in `database/prisma`.
- Future mobile support should reuse types, validation schemas, and service-level business rules rather than UI code.

## Phase Roadmap

1. Project setup
2. Authentication
3. Database migrations and seed data
4. Profile onboarding
5. Matching
6. Chat
7. Instant Date
8. Concert Mode
9. Events
10. Notifications
11. Admin dashboard
12. Testing
13. Deployment
14. Provider integration foundation
