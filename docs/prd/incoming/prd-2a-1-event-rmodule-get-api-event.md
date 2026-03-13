# PRD 2a-1: Event module — GET /api/events (getAllEvents)

max_turns: 20

---

## Context

The backend is being migrated incrementally from Express + TypeORM to NestJS + DDD + CQRS + Prisma.
This PRD adds the `event` bounded context under `src/modules/event/` with a single read endpoint.

If `src/modules/event/` already partially exists from a previous PRD, extend it — do not recreate it.

Already migrated modules for reference: `src/modules/health/`, `src/modules/version/`.
Prisma client is available at `src/config/prisma.ts`.

---

## Goal

Expose `GET /api/events` that returns all events from the database using Prisma.

---

## Bounded context

**Bounded context:** `event`

---

## Requirements

### Domain
- [ ] Entity `Event` with fields:
  - `id: number`
  - `code: string`
  - `name: string`
  - `createdAt: Date`
  - `expiresAt: Date | null`
  - `updatedAt: Date`
  - `arePartiesVisible: boolean`
  - `createdById: number | null`

- [ ] Port interface `EventRepositoryPort` with method:
  - `findAll(): Promise<Event[]>`

### Application
- [ ] Query `GetAllEventsQuery` (no fields)
- [ ] Handler `GetAllEventsHandler` → calls `EventRepositoryPort.findAll()`
- [ ] Response DTO `EventDto` with all Event fields

### Infrastructure
- [ ] Repository `PrismaEventRepository` implementing `EventRepositoryPort`
  - `findAll()`: `prisma.appEvent.findMany()`
  - Map Prisma model → domain entity explicitly

### Presentation
- [ ] Controller `EventController` with method `getAll(req, res)`
- [ ] Routes `event.routes.ts` with `GET /events` → controller.getAll
- [ ] Wire in `src/app.ts` BEFORE legacy event routes

---

## Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/events` | — | `200` array of EventDto |

---

## What this PRD does NOT include

- No auth
- No WebSocket
- No write operations
- No other endpoints — only getAllEvents
- No modification of legacy code

---

## Acceptance criteria

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes with 100% coverage on new files
- [ ] `GET /api/events` returns 200 with array
- [ ] Legacy routes untouched
- [ ] `.github/`, `infra/`, `secrets/`, `docker-compose.yml` untouched

---

## Notes for Claude Code

- Prisma model is `AppEvent` — use `prisma.appEvent.findMany()`
- Prisma client is at `src/config/prisma.ts`
- Place new routes BEFORE legacy in `src/app.ts` — do NOT remove legacy import
- Legacy event routes are at `src/routes/event.routes.ts` — do not touch
- Domain entity must be pure — no Prisma or Express imports in `domain/`