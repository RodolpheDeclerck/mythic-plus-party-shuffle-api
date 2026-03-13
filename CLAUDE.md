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

### Unit tests — generated by Claude Code

- 100% unit test coverage for all new code: every handler, application service, and domain logic you add must have a corresponding `*.test.ts` that covers all code paths and edge cases.
- Run `npm run test:coverage` before considering the task complete; open `coverage/coverage-summary.json` and verify every file you added or modified under `src/modules/` (excluding `*.test.ts`) has `lines.pct === 100`. Fix any gap before committing.

### Integration tests — written manually by the developer

Integration tests are NOT generated by Claude Code. They are written by the developer in Cursor after the PR is merged.

Claude Code must NOT attempt to generate integration tests. The CI will run them if they exist, but their absence will not block the PR.

**Why:** integration tests require understanding the full system behavior, edge cases, and business rules that Claude Code cannot reliably infer from the PRD alone.

**Convention for manually written integration tests:**
- Location: `tests/integration/<bounded-context>.integration.test.ts`
- Run with: `npm run test:integration`
- Use supertest for HTTP routes: `import request from 'supertest'; import app from '../../src/app.js'`
- Use real DB via env vars for persistence: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Use real Redis via `REDIS_URL` for external services
- Keep tests isolated: clean up all data created during the test
- Do not depend on execution order

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