# PRD 2b: Event module — write commands (NestJS + Prisma)

---

## Context

Extends the existing `src/modules/event/` module created in PRD 2a.
Do NOT create a new module — add write operations to the existing one.

Already migrated: `src/modules/event/` (read queries from PRD 2a).
Prisma client is available at `src/config/prisma.ts`.

---

## Goal

Add 3 write endpoints to `src/modules/event/` following DDD + CQRS + Hexagonal,
using Prisma for all persistence. No tests — written manually after merge.

---

## Bounded context

**Bounded context:** `event` (existing module)

---

## Endpoints to migrate

| Method | Path | Auth | Legacy |
|--------|------|------|--------|
| POST | `/api/events` | `isAuthenticated` | `eventService.createEvent()` |
| DELETE | `/api/events/:eventCode` | `isAuthenticated` + `isAdminOfEvent` | `eventService.deleteEvent()` |
| PATCH | `/api/events/:eventCode/setPartiesVisibility` | none | `eventService.setPartiesVisibility()` |

---

## Requirements

### Auth middleware (reuse legacy — do NOT rewrite)

The legacy auth middlewares already exist and work. Import and reuse them directly:
- `isAuthenticated` → `src/middlewares/authenticateJWT.js`
- `isAdminOfEvent` → `src/middlewares/authenticateJWT.js`

These middlewares inject `req.identity` (JWT payload with at least `id: number`).

Extend Express `Request` type if needed — `req.identity` is already typed in `src/types/express/index.d.ts`.

### Domain

Add to `EventRepositoryPort` (`src/modules/event/domain/ports/event-repository.port.ts`):
- `create(name: string, createdById: number): Promise<Event>`
- `deleteByCode(code: string): Promise<void>`
- `setPartiesVisibility(code: string, visible: boolean): Promise<void>`

### Application

- [ ] `CreateEventCommand` (fields: `name: string`, `createdById: number`) + `CreateEventHandler`
  - calls `eventRepository.create(name, createdById)`
  - returns `EventDto`
- [ ] `DeleteEventCommand` (field: `eventCode: string`) + `DeleteEventHandler`
  - calls `eventRepository.deleteByCode(eventCode)`
  - returns `void`
- [ ] `SetPartiesVisibilityCommand` (fields: `eventCode: string`, `visible: boolean`) + `SetPartiesVisibilityHandler`
  - calls `eventRepository.setPartiesVisibility(eventCode, visible)`
  - returns `void`

### Infrastructure

Extend `PrismaEventRepository` with 3 new methods:

```typescript
async create(name: string, createdById: number): Promise<Event> {
  // 1. verify user exists: prisma.user.findUnique({ where: { id: createdById } })
  //    if not found → throw new Error('User not found')
  // 2. generate code: randomUUID().slice(0, 8)
  // 3. set expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  // 4. prisma.appEvent.create({ data: { name, code, createdById, expiresAt, arePartiesVisible: false } })
  // 5. prisma.eventAdmin.create({ data: { eventCode: code, userId: createdById } })
  //    (table: event_admins — check schema for exact Prisma model name)
  // 6. return mapped Event entity
}

async deleteByCode(code: string): Promise<void> {
  await prisma.appEvent.delete({ where: { code } });
}

async setPartiesVisibility(code: string, visible: boolean): Promise<void> {
  await prisma.appEvent.update({ where: { code }, data: { arePartiesVisible: visible } });
}
```

> Check `prisma/schema.prisma` for the exact model name of `event_admins` table before using it.

### Presentation

Extend `EventController` with 3 new methods:

```typescript
async createEvent(req: Request, res: Response): Promise<void>
// reads: req.body.name, req.identity.id
// returns 201 + EventDto on success

async deleteEvent(req: Request, res: Response): Promise<void>
// reads: req.params.eventCode
// returns 204 on success

async setPartiesVisibility(req: Request, res: Response): Promise<void>
// reads: req.params.eventCode, req.body.visible
// returns 200 on success
```

Extend `event.routes.ts` with:

```typescript
import { isAuthenticated, isAdminOfEvent } from '../../../../../middlewares/authenticateJWT.js';

router.post('/events', isAuthenticated, (req, res) => eventController.createEvent(req, res));
router.delete('/events/:eventCode', isAuthenticated, isAdminOfEvent, (req, res) => eventController.deleteEvent(req, res));
router.patch('/events/:eventCode/setPartiesVisibility', (req, res) => eventController.setPartiesVisibility(req, res));
```

> New routes must be placed BEFORE legacy event routes in `src/app.ts` — already done in PRD 2a, no change needed.

---

## What this PRD does NOT include

- No tests — written manually after merge
- No new module — only extends existing `src/modules/event/`
- No change to legacy routes or TypeORM code
- No WebSocket notifications
- No updateEvent endpoint (no legacy route exists for it)

---

## Acceptance criteria

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `POST /api/events` returns 201 with event object
- [ ] `DELETE /api/events/:eventCode` returns 204
- [ ] `PATCH /api/events/:eventCode/setPartiesVisibility` returns 200
- [ ] Auth is enforced: POST requires valid JWT, DELETE requires JWT + admin
- [ ] Legacy routes untouched
- [ ] `.github/`, `infra/`, `secrets/`, `docker-compose.yml` untouched

---

## Notes for Claude Code

- All filenames must be kebab-case: `create-event.command.ts`, NOT `CreateEventCommand.ts`
- Do NOT use TodoWrite — it wastes turns
- Prisma field names are camelCase — never snake_case:
  - `AppEvent`: `id`, `code`, `name`, `createdAt`, `expiresAt`, `updatedAt`, `arePartiesVisible`, `createdById`
  - `User`: `id` (minimum needed)
- Import `randomUUID` from `crypto`: `import { randomUUID } from 'crypto';`
- Check `prisma/schema.prisma` for the exact model name of `event_admins` before using it
- `req.identity` is typed via `src/types/express/index.d.ts` — no need to redeclare
- Do NOT generate any tests — written manually after merge