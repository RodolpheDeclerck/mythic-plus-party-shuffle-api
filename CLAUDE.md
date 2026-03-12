# Backend architecture rules

The backend is being migrated from Express + TypeORM to NestJS.

When implementing from a PRD (including in CI): the PRD is the source of truth for *what* to build; this file defines *how* to implement it. **The rules in this file are non-negotiable and take priority over the PRD.** If the PRD says "minimal change" or omits tests/structure, you must still apply this file fully: controller, routes, 100% unit test coverage, integration tests when applicable. Do not skip any of these to satisfy "minimal" scope.

---

## Workflow

Before considering the task complete, run in order:
1. `npm run build`
2. `npm run lint`
3. `npm run format:check`
4. `npm run test` — fix any failure or missing coverage
5. `npm run test:integration` — fix any failure

New code must pass the full test and integration suite before any `git add`.

---

## Migration strategy

This migration is incremental.

That means:
- do not attempt a full migration unless the PRD explicitly asks for it
- do not refactor the whole application
- do not replace the existing Express app globally
- implement small, isolated, reviewable steps toward the target architecture

When the repository is still missing some NestJS foundations, prefer creating isolated target-oriented modules rather than broad refactors.

---

## Target architecture

All new backend code must aim toward:

- NestJS
- CQRS
- DDD
- Hexagonal Architecture
- Prisma instead of TypeORM

---

## Mandatory folder convention

All new code must use this structure:

```
src/modules/<bounded-context>/
  domain/
    entities/
    value-objects/
    ports/
    services/
  application/
    commands/
    queries/
    handlers/
    dto/
  infrastructure/
    persistence/
    adapters/
  presentation/
    controllers/
    routes/
```

Do not invent alternative top-level patterns such as:
- `src/features/`
- `src/components/`
- `src/services/`

Use `src/modules/` for all new target-oriented business modules.

Presentation layer: every module must have both a controller in `presentation/controllers/` and routes in `presentation/routes/`. Routes call the controller; the controller delegates to the application layer (handlers). Do not wire handlers directly in routes.

---

## Code style

- Use ES modules (import/export). Use `.js` extension in relative imports for TypeScript (e.g. `from './foo.js'`).
- Unit test files: `*.test.ts` next to the unit under test (e.g. `get-version.handler.test.ts` beside `get-version.handler.ts`).
- Follow existing naming in the codebase: handlers `XxxHandler`, queries `GetXxxQuery`, DTOs `XxxDto`.

---

## Scope control

For each PRD:
- implement the smallest coherent step
- prefer adding new isolated modules over modifying legacy code
- avoid touching unrelated files
- avoid broad renames or folder reshuffles
- keep PRs small and reviewable

If the PRD is ambiguous:
- choose the smallest safe MVP
- do not perform large architectural rewrites

---

## Legacy code rules

The current repository still contains legacy Express + TypeORM code.

Therefore:
- do not refactor legacy controllers unless explicitly required
- do not migrate all routes at once
- do not modify existing TypeORM entities unless explicitly required
- do not convert the whole app to NestJS in one PR
- do not break the current runtime

Legacy code may coexist temporarily with new target-oriented modules.

---

## DDD rules

Business logic must live in the domain layer.

Prefer:
- entities
- value objects
- domain services
- repository or port interfaces

The domain layer must remain pure and framework-independent.

Never import these inside domain code:
- Express
- NestJS
- Prisma
- TypeORM

---

## Hexagonal architecture rules

Dependencies must point inward.

Preferred flow:
- presentation → application → domain
- infrastructure implements ports defined by domain or application

Rules:
- controllers must stay thin
- no business logic in controllers
- no business logic in persistence classes
- infrastructure must not define business rules

---

## CQRS rules

Separate:
- commands for writes
- queries for reads

Use dedicated handlers.

Apply CQRS pragmatically:
- **Priority use case: shuffle/composition logic** — always use CQRS here
- For simple CRUD (user profile, guild settings...) a simple service is enough; do not introduce unnecessary ceremony
- Do not apply CQRS everywhere; apply it where read/write concerns are genuinely distinct

---

## Persistence rules

Use Prisma for all new persistence work.

Rules:
- Prisma only in infrastructure
- do not use TypeORM for new code
- do not leak Prisma models into domain
- map persistence models explicitly to domain entities

If no new persistence is needed for a PRD, do not add Prisma prematurely.

---

## API and delivery rules

For new HTTP-facing functionality:
- keep controllers thin
- validate inputs in the appropriate layer (use class-validator for DTOs when the project uses it)
- return explicit response objects; use consistent status codes and error response shape
- avoid coupling transport models directly to domain entities

---

## Testing rules

### Unit tests (always required)

- 100% unit test coverage for all new code: every handler, application service, and domain logic you add must have a corresponding `*.test.ts` that covers all code paths and edge cases.
- Run `npm run test:coverage` before considering the task complete; open `coverage/coverage-summary.json` and verify every file you added or modified under `src/modules/` (excluding `*.test.ts`) has `lines.pct === 100`. Fix any gap before committing.

### Integration tests (non-negotiable triggers)

Add an integration test (`*.integration.test.ts`) whenever the feature involves **any** of the following. These triggers apply even if the PRD says "minimal" or omits tests.

**1. HTTP endpoints — always**
Every new HTTP route must have an integration test that:
- bootstraps the Express app from `src/app.ts` (import `httpServer` or the app instance)
- hits the real route with a real HTTP call (use `supertest`)
- asserts the status code and response body
- does not require a real database if the module has no persistence (mock or skip DB setup)
- cleans up after itself

```typescript
// Example: tests/integration/<context>.integration.test.ts
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/version', () => {
  it('returns 200 with a version field', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version');
  });
});
```

**2. Persistence (Prisma/DB)**
Integration test must:
- use real DB via env vars (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)
- perform the real operation and assert the result
- clean up all data created during the test

**3. External services (Redis, third-party APIs)**
Integration test must:
- use the real test instance (`REDIS_URL` in CI)
- assert expected behavior
- clean up connections and data

**Exception — do NOT generate integration tests for:**
- shuffle/composition logic → written manually, business rules are too domain-specific
- pure domain logic with no HTTP, DB, or external service involvement

### Integration test conventions
- File naming: `*.integration.test.ts`
- Location: `tests/integration/` or next to the module
- Run with: `npm run test:integration` (jest config: `jest.integration.config.cjs`, timeout 60s)
- Use env vars for config; prefer retries or short waits for connectivity
- Keep tests isolated: clean up data; do not depend on execution order

---

## Forbidden modifications

Never modify these areas unless the PRD explicitly requires it:

- `.github/`
- `infra/`
- `terraform/`
- `secrets/`
- `docker-compose.yml`

---

## Quality bar

Code must follow clean code and Nest/DDD/CQRS best practices:
- modular, single responsibility; explicit naming; easy to refactor; low coupling
- consistent with the target folder structure
- presentation layer: only delegation to application layer; no business logic
- application layer: orchestration and use cases; domain layer: pure business rules

If an architectural decision is non-obvious, document it briefly in code comments.