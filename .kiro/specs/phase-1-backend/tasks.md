# Implementation Plan: Phase 1 Backend — Environment & Database Bootstrap

## Overview

Bootstrap the database environment for the Offline POS Inventory system: complete Prisma schema, environment configuration, and database migration.

## Tasks

- [ ] 1. TASK-1.1 · Environment & Database Bootstrap
  - [x] 1.1 Rewrite `prisma/schema.prisma` with complete schema
    - Add `User` model for authentication
    - Add `TenantAdmin` model for multi-tenant admin management
    - Add `Device` model for device registration and JWT issuance
    - Add `isBlocked` field to `InventoryBatch` for expired batch blocking
    - Add `hasAnomalyFlag` field to `InventoryBatch` for negative stock detection
    - _Requirements: Multi-tenant validation, Device registration, FEFO blocking, Negative stock tolerance_
  - [x] 1.2 Add `JWT_SECRET` to `.env.local`
    - Ensure `JWT_SECRET` key exists in `.env.local` with a secure value
    - Do not commit this file to version control
    - _Requirements: Authentication & Security_
  - [x] 1.3 Run `npx prisma generate` to generate Prisma Client
    - Execute after schema rewrite to regenerate typed client
    - Verify no generation errors
    - _Requirements: Database & ORM setup_
  - [x] 1.4 Run `npx prisma migrate dev --name init` to create all tables
    - Execute against `pos_inventory_db` PostgreSQL database
    - Confirm migration file is created under `prisma/migrations/`
    - _Requirements: Database & ORM setup_
  - [~] 1.5 Verify tables created with `psql pos_inventory_db -c "\dt"`
    - Confirm all expected tables are present in the output
    - _Requirements: Database & ORM setup_
  - [x] 1.6 Commit schema changes to branch `phase-1-backend-foundation`
    - Stage only `prisma/schema.prisma` and migration files
    - Do NOT stage `.env.local`
    - Use commit message referencing TASK-1.1
    - _Requirements: Git safety_

- [x] 2. Checkpoint — Ensure migration succeeded and Prisma Client is generated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `.env.local` must never be committed — verify `.gitignore` covers it before committing
- `npx prisma generate` must be re-run any time `schema.prisma` changes
- Branch `phase-1-backend-foundation` must exist before the commit step

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4"] },
    { "id": 3, "tasks": ["1.5"] },
    { "id": 4, "tasks": ["1.6"] }
  ]
}
```
