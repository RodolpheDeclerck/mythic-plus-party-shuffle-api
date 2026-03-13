# PRD [N]: [Feature name]

max_turns: [calculated below]

<!--
  Formula: max_turns = 4 (overhead: read PRD + CLAUDE.md + build + lint) + nb_files + 3 (safety margin)

  ## Estimation
  | Layer | Files |
  |-------|-------|
  | domain/entities/ | ? |
  | domain/ports/ | ? |
  | application/queries/ or commands/ | ? |
  | application/dto/ | ? |
  | application/handlers/ | ? |
  | infrastructure/persistence/ | ? |
  | presentation/controllers/ | 1 |
  | presentation/routes/ | 1 |
  | **Total files** | **?** |

  max_turns = 4 + [total files] + 5 = [result]
-->

---

## Context

<!--
  Describe where this module fits in the migration.
  Example: "The backend is being migrated incrementally from Express + TypeORM to NestJS + DDD + CQRS + Prisma.
  This PRD adds the [bounded-context] module under src/modules/[bounded-context]/."
-->

The backend is being migrated incrementally from Express + TypeORM to NestJS + DDD + CQRS + Prisma.
This PRD adds the **[bounded-context]** module under `src/modules/[bounded-context]/`.

Already migrated modules for reference: `src/modules/health/`, `src/modules/version/`.

---

## Goal

<!--
  One sentence: what does this module do?
  Example: "Expose a GET /api/events endpoint that returns the list of active events for a guild."
-->

---

## Bounded context

<!--
  Name of the bounded context (maps to the folder name under src/modules/).
  Keep it singular and lowercase: event, guild, character, composition, user...
-->

**Bounded context:** `[bounded-context]`

---

## Requirements

<!--
  List what must be implemented. Be explicit — Claude Code takes this literally.
  Follow the mandatory structure from CLAUDE.md:
    domain/ → application/ → infrastructure/ → presentation/
-->

### Domain
- [ ] Entity `[EntityName]` with fields: ...
- [ ] Value object `[ValueObjectName]` (if applicable): ...
- [ ] Domain service `[ServiceName]` (if applicable): ...
- [ ] Port interface `[RepositoryPort]` (if applicable): ...

### Application
- [ ] Query `Get[Entity]Query` with fields: ...
  _(or Command `Create[Entity]Command` for writes)_
- [ ] Handler `Get[Entity]Handler` implementing the query/command
- [ ] Response DTO `[Entity]Dto` with fields: ...

### Infrastructure _(only if persistence or external service is involved)_
- [ ] Prisma model `[entity]` in `schema.prisma` with fields: ...
- [ ] Repository `Prisma[Entity]Repository` implementing `[RepositoryPort]`
  _(map Prisma model → domain entity explicitly)_

### Presentation
- [ ] Controller `[Entity]Controller` — thin, delegates to handler
- [ ] Routes `[entity].routes.ts` — calls controller, never handler directly
- [ ] Wire routes in `src/app.ts`: `app.use('/api', [entity]Routes)`

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/[resource]` | — | ... |
| POST | `/api/[resource]` | JWT | ... |

### Validation
- [ ] Input validated via `class-validator` on DTOs (if applicable)
- [ ] Return `400` for invalid input, `401` for missing auth, `404` for not found

---

## What this PRD does NOT include

<!--
  Explicitly list what is out of scope to prevent over-engineering.
  Example:
  - No pagination
  - No soft delete
  - No real-time updates (WebSocket)
  - No Blizzard API sync
-->

- ...

---

## Acceptance criteria

- [ ] Build is green (`npm run build`)
- [ ] Lint and format pass (`npm run lint`, `npm run format:check`)
- [ ] Tests written manually by developer after merge
- [ ] No regression on existing routes
- [ ] Module follows the folder structure: `domain/ application/ infrastructure/ presentation/`
- [ ] No business logic in controller or routes
- [ ] Legacy Express routes and TypeORM entities are untouched (unless PRD explicitly requires it)
- [ ] `.github/`, `infra/`, `secrets/`, `docker-compose.yml` are untouched

---

## Notes for Claude Code

<!--
  Optional: add context that helps Claude Code avoid common mistakes on this specific PRD.
  Examples:
  - "The Event entity already exists in legacy code at src/entities/event.entity.ts — do not modify it, create a new domain entity."
  - "Redis is already configured in src/config/redis.ts — reuse the existing client."
  - "The shuffle logic is domain-specific — do not generate integration tests for it, they are written manually."
-->