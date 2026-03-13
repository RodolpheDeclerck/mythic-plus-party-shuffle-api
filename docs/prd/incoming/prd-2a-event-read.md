# PRD 2a: Event module — read queries (NestJS + Prisma)

max_turns: 30

---

## Context

The backend is being migrated incrementally from Express + TypeORM to NestJS + DDD + CQRS + Prisma.
This PRD migrates the read-only event endpoints to a new NestJS module under `src/modules/event/`.

The legacy Express routes and TypeORM service remain untouched — they continue to serve requests
during the migration. The new NestJS module will coexist with the legacy code.

Already migrated modules for reference: `src/modules/health/`, `src/modules/version/`.
Prisma client is available at `src/config/prisma.ts`.

---

## Goal

Migrate the read-only event endpoints to `src/modules/event/` following the DDD + CQRS + Hexagonal
structure, using Prisma instead of TypeORM for all persistence.

---

## Bounded context

**Bounded context:** `event`

---

## Endpoints to migrate

| Method | Path | Auth | Legacy handler |
|--------|------|------|----------------|
| GET | `/api/events` | — | `eventService.getAllEvents()` |
| GET | `/api/events?code=:code` | — | `eventService.getEventByCode(code)` |
| GET | `/api/events/:eventCode/characters` | — | `eventService.getCharactersByEventCode(eventCode)` |

> These three endpoints have no auth, no WebSocket, and no write operations.
> They are the safest starting point for the migration.

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

- [ ] Entity `Character` with fields:
  - `id: number`
  - `name: string`
  - `characterClass: string`
  - `specialization: string`
  - `iLevel: number`
  - `role: string`
  - `bloodLust: boolean`
  - `battleRez: boolean`
  - `keystoneMinLevel: number`
  - `keystoneMaxLevel: number`
  - `eventCode: string | null`

- [ ] Port interface `EventRepositoryPort` with methods:
  - `findAll(): Promise<Event[]>`
  - `findByCode(code: string): Promise<Event | null>`
  - `findCharactersByEventCode(eventCode: string): Promise<Character[]>`

### Application

- [ ] Query `GetAllEventsQuery` (no fields)
- [ ] Handler `GetAllEventsHandler` → calls `EventRepositoryPort.findAll()`
- [ ] Response DTO `EventDto` with all Event fields

- [ ] Query `GetEventByCodeQuery` with field `code: string`
- [ ] Handler `GetEventByCodeHandler` → calls `EventRepositoryPort.findByCode(code)`
  - returns `404` if event not found

- [ ] Query `GetEventCharactersQuery` with field `eventCode: string`
- [ ] Handler `GetEventCharactersHandler` → calls `EventRepositoryPort.findCharactersByEventCode(eventCode)`
- [ ] Response DTO `CharacterDto` with all Character fields

### Infrastructure

- [ ] Repository `PrismaEventRepository` implementing `EventRepositoryPort`
  - Use `src/config/prisma.ts` for the Prisma client
  - `findAll()`: `prisma.appEvent.findMany()`
  - `findByCode(code)`: `prisma.appEvent.findFirst({ where: { code } })`
  - `findCharactersByEventCode(eventCode)`: `prisma.character.findMany({ where: { eventCode } })`
  - Map Prisma models → domain entities explicitly (never leak Prisma types into domain)

### Presentation

- [ ] Controller `EventController` — thin, delegates to handlers, no business logic
- [ ] Routes `event.routes.ts` — calls controller, never handlers directly
- [ ] Wire routes in `src/app.ts`: `app.use('/api', eventRoutes)`

> IMPORTANT: the new `/api/events` route will conflict with the legacy route.
> Remove the legacy `app.use('/api', eventRoutes)` import from `src/app.ts` for these
> three endpoints only, or prefix the new module differently during transition.
> Preferred approach: replace the legacy event routes import with the new NestJS module routes.

### Validation

- [ ] Return `404` with `{ message: 'Event not found' }` if `findByCode` returns null
- [ ] Return `200` with an empty array if no events or characters found

---

## What this PRD does NOT include

- No auth middleware (JWT, isAuthenticated, isAdminOfEvent)
- No WebSocket (io.emit)
- No write operations (POST, DELETE, PATCH)
- No shuffle logic
- No admin-events endpoint
- No parties endpoint
- No migration of legacy TypeORM service or entity

---

## Acceptance criteria

- [ ] Build is green (`npm run build`)
- [ ] Lint and format pass (`npm run lint`, `npm run format:check`)
- [ ] 100% unit test coverage on all new files under `src/modules/event/`
- [ ] `npm run test` passes — no regression on existing unit tests
- [ ] `GET /api/events` returns 200 with array of events
- [ ] `GET /api/events?code=:code` returns 200 with event or 404
- [ ] `GET /api/events/:eventCode/characters` returns 200 with array of characters
- [ ] Domain entities are pure — no Prisma or Express imports in `domain/`
- [ ] Prisma models are mapped to domain entities in the repository
- [ ] Legacy TypeORM service and entity are untouched
- [ ] `.github/`, `infra/`, `secrets/`, `docker-compose.yml` are untouched

---

## Notes for Claude Code

- Prisma client is at `src/config/prisma.ts` — import and use it directly in the repository
- Prisma model name is `AppEvent` (not `Event`) — use `prisma.appEvent.*`
- Prisma model name for characters is `Character` — use `prisma.character.*`
- The legacy event routes are in `src/routes/event.routes.ts` — do NOT modify this file
- The legacy routes are mounted in `src/app.ts` as `app.use('/api', eventRoutes)`
- When wiring the new routes in `src/app.ts`, place them BEFORE the legacy event routes
  so they take priority for the three migrated endpoints
- Do NOT remove the legacy routes import — other legacy endpoints (shuffle, parties, etc.)
  still depend on it
- Character enums (characterClass, specialization, role) are Prisma enums in the DB —
  map them to strings in the domain entity to keep domain pure
- The `@BeforeInsert` logic (code generation, expiresAt) lives in the legacy entity —
  do NOT replicate it in the domain entity for this PRD (read-only endpoints only)

  