# Backend architecture rules

The backend is being migrated from Express + TypeORM to NestJS.

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
- validate inputs in the appropriate layer
- return explicit response objects
- avoid coupling transport models directly to domain entities

## Testing rules

When relevant:
- add focused tests for new behavior
- prefer small tests close to the new module
- do not add large unrelated test refactors

## Forbidden modifications

Never modify these areas unless the PRD explicitly requires it:

- .github/
- infra/
- terraform/
- secrets/
- docker-compose.yml

## Quality bar

Code must be:
- modular
- explicit in naming
- easy to refactor
- low coupling
- consistent with the target folder structure

If an architectural decision is non-obvious, document it briefly in code comments.