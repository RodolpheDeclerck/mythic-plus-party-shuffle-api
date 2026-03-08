# Backend architecture rules

The backend is being migrated to NestJS.

## Target architecture
Use:
- NestJS
- CQRS
- DDD
- Hexagonal Architecture
- Prisma instead of TypeORM

## Architectural principles

### DDD
- Business logic must live in the domain layer
- Prefer entities, value objects, domain services, and repository interfaces
- Keep the domain pure and framework-independent

### Hexagonal architecture
- Separate domain, application, infrastructure, and presentation layers
- Infrastructure must implement ports defined by the domain/application
- Controllers must stay thin
- Do not place business logic in controllers or persistence classes

### CQRS
- Separate commands and queries
- Use dedicated command handlers and query handlers
- Keep write and read flows explicit
- Use CQRS pragmatically; do not introduce unnecessary complexity

### Persistence
- Use Prisma for persistence
- Do not use TypeORM for new code
- Prisma must stay in the infrastructure layer
- Do not leak Prisma models into the domain layer
- Map persistence models to domain entities explicitly

## Preferred module structure
For each business module, prefer this structure:

- domain/
- application/
- infrastructure/
- presentation/

## Rules
- prefer small, reviewable changes
- add tests when relevant
- do not modify CI/CD unless strictly necessary
- do not touch secrets
- avoid changing unrelated files

## Sensitive areas
- .github/
- infra/
- terraform/
- secrets/

## Expected quality
- code should be modular and easy to refactor
- avoid tight coupling
- keep naming explicit
- document important architectural decisions in code comments when useful