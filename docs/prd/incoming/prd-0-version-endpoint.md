# PRD 0: Version endpoint (pipeline validation)

max_turns: 20

## Context
The backend is still on Express; the migration toward NestJS + DDD + CQRS + Prisma has started. This PRD aims to validate the pipeline (trigger, Claude Code, build, tests, PR) with a single endpoint—no database, no Prisma. **"Minimal" means one feature only; it does NOT mean skipping the full DDD/CQRS structure: you must deliver query, handler, controller, routes, wiring in app, and unit tests.**

## Goal
Add a GET /api/version (or /api/app-version) endpoint following the target structure (module under src/modules/, query, handler, controller, route), without Prisma or any database.

## Requirements
- create a new bounded context **version** (or app-version) under `src/modules/version/`
- use the target structure: application (queries, handlers, dto) and presentation (controllers, routes)
- implement a query `GetVersionQuery`, a handler `GetVersionHandler`, and a response DTO (e.g. `{ version: string }`)
- expose GET /api/version that returns the app version (e.g. read from package.json or a constant)
- add at least one unit test for `GetVersionHandler` (assert the DTO contains a version)
- wire the new route in the existing Express app without modifying other routes
- do not introduce Prisma, database, or Nest in this PRD
- do not modify legacy controllers, routes, or entities
- do not modify .github/, infra, secrets, or docker-compose.yml

## Acceptance criteria
- the change is one endpoint only (small scope); the implementation must still be complete: handler, controller, routes, tests
- build is green (npm run build, lint, format:check, audit, test, integration check)
- GET /api/version returns a JSON object with a version field
- the module follows the folder structure under src/modules/version/ (application + presentation)
- no regression on the existing application

Re-run: validate pipeline and CLAUDE.md updates (controller, tests, workflow). Rules non-negotiable over PRD. Claude must push only with 100% coverage on new code. Trigger. Exclude integration from unit run. CI checks full DDD/CQRS before commit.