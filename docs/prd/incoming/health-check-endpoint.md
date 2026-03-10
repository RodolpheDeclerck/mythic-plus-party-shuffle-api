# Health check endpoint

## Context
The backend is still running on Express, but the migration to NestJS architecture has started.

## Goal
Create the smallest possible health feature aligned with the target architecture.

## Requirements
- create a new isolated health feature folder
- organize it with domain, application, infrastructure, and presentation folders if relevant
- expose a simple GET /health endpoint only if it can be done without broad refactoring
- otherwise create the target-oriented module structure and wire only the minimal necessary code
- do not migrate the whole app
- do not refactor unrelated existing files
- out of scope: full app migration; keep changes incremental

## Acceptance criteria
- the change is small and focused
- the repository stays stable
- the implementation reflects the target architecture direction
