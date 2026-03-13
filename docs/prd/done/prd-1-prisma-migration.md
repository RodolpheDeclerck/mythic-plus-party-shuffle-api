# PRD 1: Prisma setup and schema migration

max_turns: 30

---

## Context

The backend is being migrated incrementally from Express + TypeORM to NestJS + DDD + CQRS + Prisma.
This PRD introduces Prisma as the new ORM and migrates the existing TypeORM schema to `prisma/schema.prisma`.

TypeORM remains in place and continues to run — this PRD does NOT remove TypeORM or touch any existing
legacy code. Prisma is added alongside TypeORM so new modules can use it immediately.

Already migrated modules for reference: `src/modules/health/`, `src/modules/version/`.

---

## Goal

Install Prisma, create `prisma/schema.prisma` that mirrors the existing database schema exactly,
and generate the Prisma client — without modifying any existing TypeORM entity, migration, or runtime code.

---

## Bounded context

This PRD is infrastructure-only. No new `src/modules/` bounded context is created.

---

## Requirements

### 1. Install Prisma

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

This creates:
- `prisma/schema.prisma`
- `.env` update with `DATABASE_URL` (do not commit real credentials)

### 2. Schema — mirror the existing database exactly

The schema must reflect the current live database. Do NOT change table names, column names,
or types — Prisma must connect to the existing Supabase/PostgreSQL database without any migration.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int       @id @default(autoincrement())
  username     String    @unique @db.VarChar(255)
  email        String    @unique @db.VarChar(255)
  password     String
  salt         String
  sessionToken String?

  eventsCreated AppEvent[] @relation("EventCreatedBy")
  eventsAdmin   AppEvent[] @relation("EventAdmins")

  @@map("users")
}

model AppEvent {
  id               Int       @id @default(autoincrement())
  code             String    @unique
  name             String
  createdAt        DateTime  @default(now())
  expiresAt        DateTime?
  updatedAt        DateTime  @updatedAt
  arePartiesVisible Boolean  @default(false)

  createdById Int
  createdBy   User @relation("EventCreatedBy", fields: [createdById], references: [id], onDelete: Cascade)

  characters Character[]
  admins     User[]      @relation("EventAdmins")

  @@map("events")
}

model Character {
  id               Int     @id @default(autoincrement())
  name             String
  characterClass   String
  specialization   String
  iLevel           Int
  role             String
  bloodLust        Boolean @default(false)
  battleRez        Boolean @default(false)
  keystoneMinLevel Int     @default(2)
  keystoneMaxLevel Int     @default(99)

  eventCode String?
  event     AppEvent? @relation(fields: [eventCode], references: [code], onDelete: Cascade)

  @@map("character")
}

model EventAdmin {
  eventId Int @map("event_id")
  userId  Int @map("user_id")

  @@id([eventId, userId])
  @@map("event_admins")
}
```

### 3. Do NOT run prisma migrate

The database already exists and is managed by TypeORM migrations.
Use `prisma db pull` to verify the schema matches, then `prisma generate` to generate the client.

```bash
npx prisma generate
```

Do NOT run `prisma migrate dev` or `prisma db push` — this would conflict with TypeORM migrations.

### 4. Add DATABASE_URL to environment config

Add to `.env.example`:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Add to the CI workflow env vars if needed (use existing POSTGRES_* vars to construct it).

### 5. Verify Prisma client works

Create a minimal smoke test at `src/config/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
```

This shared client will be used by all future infrastructure repositories.

---

## What this PRD does NOT include

- No removal of TypeORM — it stays in place
- No new NestJS module
- No new HTTP endpoints
- No changes to existing entities, routes, controllers, or services
- No `prisma migrate dev` or `prisma db push`
- No data seeding
- No changes to existing tests

---

## Acceptance criteria

- [ ] `prisma/schema.prisma` exists and mirrors the existing database schema exactly
- [ ] `@prisma/client` is installed and `npx prisma generate` runs without error
- [ ] `src/config/prisma.ts` exports a shared PrismaClient instance
- [ ] `.env.example` includes `DATABASE_URL`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes — no regression on existing unit tests
- [ ] TypeORM entities, migrations, and runtime are untouched
- [ ] No existing routes, controllers, or services are modified
- [ ] `.github/`, `infra/`, `secrets/`, `docker-compose.yml` are untouched

---

## Notes for Claude Code

- The database already exists in production (Supabase/PostgreSQL) — do NOT run any migration command
- `prisma db pull` can be used to introspect the schema but requires a live DB connection in CI —
  instead, write the schema manually from the TypeORM entities described in this PRD
- The `Party` class in `src/entities/party.entity.ts` is NOT a TypeORM entity (no `@Entity` decorator)
  and has no database table — do NOT add it to the Prisma schema
- Table names to use exactly: `users`, `events`, `character`, `event_admins`
- The join table `event_admins` has columns `event_id` and `user_id`
- Character joins Event via `eventCode` → `Event.code` (not via `Event.id`)
- TypeORM enums (CharacterClass, Role, Specialization) are stored as strings in the DB —
  use `String` in Prisma, not Prisma enums, to avoid conflicts with existing data
- Do not add `@@relation` names that conflict with existing foreign key constraint names in the DB