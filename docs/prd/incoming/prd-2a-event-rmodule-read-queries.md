# PRD 2a: Event module — read queries (NestJS + Prisma)

max_turns: 20

---

## Context

The backend is being migrated incrementally from Express + TypeORM to NestJS + DDD + CQRS + Prisma.
This PRD migrates the read-only event endpoints to a new NestJS module under `src/modules/event/`.

The legacy Express routes and TypeORM service remain untouched — they continue to serve requests
during the migration. The new NestJS module coexists with the legacy code.

Already migrated modules for reference: `src/modules/health/`, `src/modules/version/`.
Prisma client is available at `src/config/prisma.ts`.

---

## Goal

Migrate 3 read-only event endpoints to `src/modules/event/` following DDD + CQRS + Hexagonal,
using Prisma for all persistence. No tests — they are written manually after the PR.

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

---

## Requirements

### Domain

- [ ] Entity `Event`:
  - `id: number`
  - `code: string`
  - `name: string`
  - `createdAt: Date`
  - `expiresAt: Date | null`
  - `updatedAt: Date`
  - `arePartiesVisible: boolean`
  - `createdById: number | null`

- [ ] Entity `Character`:
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

- [ ] Port interface `EventRepositoryPort`:
  - `findAll(): Promise<Event[]>`
  - `findByCode(code: string): Promise<Event | null>`
  - `findCharactersByEventCode(eventCode: string): Promise<Character[]>`

### Application

- [ ] `GetAllEventsQuery` + `GetAllEventsHandler` → `findAll()`
- [ ] `GetEventByCodeQuery` (field: `code: string`) + `GetEventByCodeHandler` → `findByCode(code)`
  - Returns `404` with `{ message: 'Event not found' }` if null
- [ ] `GetEventCharactersQuery` (field: `eventCode: string`) + `GetEventCharactersHandler` → `findCharactersByEventCode(eventCode)`
- [ ] DTOs: `EventDto`, `CharacterDto`

### Infrastructure

- [ ] `PrismaEventRepository` implementing `EventRepositoryPort`
  - `findAll()`: `prisma.appEvent.findMany()`
  - `findByCode(code)`: `prisma.appEvent.findFirst({ where: { code } })`
  - `findCharactersByEventCode(eventCode)`: `prisma.character.findMany({ where: { eventCode } })`
  - Map Prisma models → domain entities explicitly — never leak Prisma types into domain

### Presentation

- [ ] `EventController` — thin, delegates to handlers
- [ ] `event.routes.ts` — calls controller, never handlers directly
- [ ] Wire in `src/app.ts` BEFORE legacy event routes

---

## What this PRD does NOT include

- No tests — written manually by the developer after merge
- No auth, no WebSocket, no write operations
- No modification of legacy code

---

## Acceptance criteria

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `GET /api/events` returns 200 with array
- [ ] `GET /api/events?code=existing` returns 200 with event
- [ ] `GET /api/events?code=unknown` returns 404
- [ ] `GET /api/events/:eventCode/characters` returns 200 with array
- [ ] Domain entities are pure — no Prisma or Express imports in `domain/`
- [ ] Legacy routes untouched
- [ ] `.github/`, `infra/`, `secrets/`, `docker-compose.yml` untouched

---

## Notes for Claude Code

- Prisma client is at `src/config/prisma.ts`
- Prisma model for events is `AppEvent` — use `prisma.appEvent.*`
- Prisma model for characters is `Character` — use `prisma.character.*`
- Prisma enums (`character_characterclass_enum`, `character_specialization_enum`, `character_role_enum`)
  must be mapped to plain `string` in domain entities — never import Prisma enums in `domain/`
- Place new routes BEFORE legacy event routes in `src/app.ts` — do NOT remove legacy import
- Legacy event routes are at `src/routes/event.routes.ts` — do not touch
- Do NOT generate any tests — unit and integration tests are written manually after merge

