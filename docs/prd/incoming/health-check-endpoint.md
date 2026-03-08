# Health check endpoint

## Context
We need a simple endpoint to verify the API is running.

## Goal
Add a health check endpoint in the new NestJS architecture.

## Requirements
- create a health module
- expose GET /health
- return a simple JSON payload with a status field
- follow CQRS, DDD, and hexagonal architecture pragmatically
- use the project architecture rules from CLAUDE.md

## Acceptance criteria
- GET /health exists
- response contains a status field
- code is organized according to the target architecture
- tests are added if relevant

Pipeline test run