# Backend architecture rules

The backend is being migrated from Express + TypeORM to NestJS.

When implementing from a PRD (including in CI): the PRD is the source of truth for *what* to build; this file defines *how* to implement it. **The rules in this file are non-negotiable and take priority over the PRD.** If the PRD says "minimal change" or omits tests/structure, you must still apply this file fully: controller, routes, 100% unit test coverage, integration tests when applicable. Do not skip any of these to satisfy "minimal" scope.

## Workflow

Before considering the task complete: run `npm run build`, `npm run test`, and fix any lint/format issues (`npm run lint`, `npm run format`). New code must pass the existing test and integration suite.

## Migration strategy

This migration is incremental.

That means:
- do not attempt a full migration unless the PRD explicitly asks for it
- do not refactor the whole application
- do not replace the existing Express app globally
- implement small, isolated, reviewable steps toward the target architecture

When the repository is still missing some NestJS foundations, prefer creating isolated target-oriented modules rather than broad refactors.

## Target architecture

All new backend code must aim toward:

- NestJS
- CQRS
- DDD
- Hexagonal Architecture
- Prisma instead of TypeORM

## Mandatory folder convention

All new code must use this structure:

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

Do not invent alternative top-level patterns such as:
- src/features/
- src/components/
- src/services/

Use `src/modules/` for all new target-oriented business modules.

Presentation layer: every module must have both a controller in `presentation/controllers/` and routes in `presentation/routes/`. Routes call the controller; the controller delegates to the application layer (handlers). Do not wire handlers directly in routes.

## Code style

- Use ES modules (import/export). Use `.js` extension in relative imports for TypeScript (e.g. `from './foo.js'`).
- Unit test files: `*.test.ts` next to the unit under test (e.g. `get-version.handler.test.ts` beside `get-version.handler.ts`).
- Follow existing naming in the codebase: handlers `XxxHandler`, queries `GetXxxQuery`, DTOs `XxxDto`.

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

## Legacy code rules

The current repository still contains legacy Express + TypeORM code.

Therefore:
- do not refactor legacy controllers unless explicitly required
- do not migrate all routes at once
- do not modify existing TypeORM entities unless explicitly required
- do not convert the whole app to NestJS in one PR
- do not break the current runtime

Legacy code may coexist temporarily with new target-oriented modules.

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

## CQRS rules

Separate:
- commands for writes
- queries for reads

Use dedicated handlers.

Apply CQRS pragmatically:
- use it when it improves clarity
- do not introduce unnecessary ceremony for trivial cases

## Persistence rules

Use Prisma for all new persistence work.

Rules:
- Prisma only in infrastructure
- do not use TypeORM for new code
- do not leak Prisma models into domain
- map persistence models explicitly to domain entities

If no new persistence is needed for a PRD, do not add Prisma prematurely.

## API and delivery rules

For new HTTP-facing functionality:
- keep controllers thin
- validate inputs in the appropriate layer (use class-validator for DTOs when the project uses it)
- return explicit response objects; use consistent status codes and error response shape
- avoid coupling transport models directly to domain entities

## Testing rules

- 100% unit test coverage for all new code: every handler, application service, and domain logic you add must have a corresponding `*.test.ts` that covers all code paths and edge cases.
- Run `npm run test` before considering the task complete; fix any failure or missing coverage.

Integration tests: add them when the feature involves any of the following:
- **HTTP endpoints**: add an integration test that hits the new route (e.g. GET/POST to the app), asserts status code and response body, and cleans up. Use the existing app bootstrap or a small test server if needed.
- **Persistence (Prisma/DB)**: add an integration test that uses the real DB (with test env: POSTGRES_* or DATABASE_URL), performs the operation, asserts the result, and cleans up data created during the test.
- **External services** (Redis, third-party APIs): add an integration test that uses the test instance (e.g. REDIS_URL in CI) or a contract/mock, and asserts the expected behavior.

Conventions for integration tests:
- File naming: `*.integration.test.ts` (e.g. `tests/integration/version.integration.test.ts` or next to the module).
- Run with: `npm run test:integration`. Jest config: `jest.integration.config.cjs` (testMatch: `**/*.integration.test.ts`, timeout 60s). Roots include `tests/` and `src/`.
- Use env vars for config (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, REDIS_URL); CI provides these via workflow services. Prefer retries or short waits for connectivity (see `tests/integration/connectivity.integration.test.ts`).
- Keep tests isolated: clean up data created in the test; do not depend on order of execution.

- Prefer small tests close to the new module; do not add large unrelated test refactors.

## Forbidden modifications

Never modify these areas unless the PRD explicitly requires it:

- .github/
- infra/
- terraform/
- secrets/
- docker-compose.yml

## Quality bar

Code must follow clean code and Nest/DDD/CQRS best practices:
- modular, single responsibility; explicit naming; easy to refactor; low coupling
- consistent with the target folder structure
- presentation layer: only delegation to application layer; no business logic
- application layer: orchestration and use cases; domain layer: pure business rules

If an architectural decision is non-obvious, document it briefly in code comments.