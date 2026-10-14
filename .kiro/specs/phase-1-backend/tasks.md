# Implementation Plan: Phase 1 Backend — Backend Foundation

## Overview

Complete backend foundation for the Offline POS Inventory system: environment bootstrap, JWT auth utilities, API routes for auth/sync/products/inbound/reports, Next.js middleware, and Tailwind animation fix.

## Tasks

- [x] 1. TASK-1.1 · Environment & Database Bootstrap
  - [x] 1.1 Rewrite prisma/schema.prisma with complete schema
  - [x] 1.2 Add JWT_SECRET to .env.local
  - [x] 1.3 Run prisma generate to generate Prisma Client
  - [x] 1.4 Run prisma migrate dev to create all tables

- [x] 2. TASK-1.2 · Auth Core: JWT Utilities
  - [x] 2.1 Create src/core/auth/types.ts with JWTPayload and UserRole types
  - [x] 2.2 Implement signJWT using jose library in src/core/auth/index.ts
  - [x] 2.3 Implement verifyJWT using jose library in src/core/auth/index.ts

- [ ] 3. TASK-1.3 · API Route: Device Registration
  - [ ] 3.1 Create src/app/api/auth/register/route.ts with POST /api/auth/register endpoint
    - Request body: tenantCode, branchCode, deviceName, adminPassword
    - Validate credentials against database
    - Generate 30-day JWT with tenantId, branchId, deviceId, role device
    - Response: token, deviceId, tenantName, branchName
    - Error 401 for invalid tenant or branch or password
    - Export const runtime nodejs

- [ ] 4. TASK-1.4 · API Route: PIN Verification
  - [ ] 4.1 Create src/app/api/auth/pin-verify/route.ts with POST /api/auth/pin-verify endpoint
    - Authorization Bearer header with device JWT
    - Body: userId, pin
    - Extract tenantId and branchId from JWT only, never from body
    - Find User by id AND tenantId from JWT, verify bcrypt PIN
    - Return 8h session token with sessionToken, userName, role
    - Export const runtime nodejs

- [ ] 5. TASK-1.5 · Next.js Middleware: API Route Guard
  - [ ] 5.1 Create src/middleware.ts
    - Guard all /api routes except /api/auth routes
    - Extract and verify JWT from Authorization Bearer header
    - Inject x-tenant-id, x-branch-id, x-device-id to request headers
    - Return 401 if token invalid or missing
    - Do NOT guard frontend pages

- [ ] 6. TASK-1.6 · API Route: Sync Pull
  - [ ] 6.1 Create GET handler in src/app/api/sync/route.ts
    - GET /api/sync with lastPulledAt timestamp query param
    - Extract tenantId and branchId from request headers set by middleware
    - Pull Products and InventoryBatches updated since lastPulledAt
    - Response shape: changes with products and inventory_batches each having created, updated, deleted arrays plus timestamp
    - Deleted array contains IDs with deletedAt not null (soft deletes)
    - Export const runtime nodejs

- [ ] 7. TASK-1.7 · API Route: Sync Push
  - [ ] 7.1 Create POST handler in src/app/api/sync/route.ts
    - POST /api/sync with array of Transactions containing TransactionItems
    - Frontend-generated UUIDs used as transaction IDs
    - Per Transaction: Prisma transaction block with idempotent upsert by UUID
    - FEFO deduction: query InventoryBatches sorted by expiryDate ASC then receivedDate ASC
    - Deduct qty across batches, insert TransactionItemBatch per deduction
    - Allow currentQty to go negative, set hasAnomalyFlag true if below zero
    - Use SELECT FOR UPDATE via raw query for row-level locking
    - Return processedCount and anomalies array
    - NEVER accept tenantId or branchId from body
    - Export const runtime nodejs

- [ ] 8. TASK-1.8 · API Route: Products CRUD
  - [ ] 8.1 Create src/app/api/products/route.ts
    - GET /api/products with search, page, limit params filtered by tenantId from JWT
    - Include active InventoryBatch count per product
    - POST /api/products to create new product
    - Export const runtime nodejs
  - [ ] 8.2 Create src/app/api/products/[id]/route.ts
    - PUT to update product
    - DELETE as soft delete setting deletedAt to current timestamp
    - Export const runtime nodejs

- [ ] 9. TASK-1.9 · API Route: Inbound Goods
  - [ ] 9.1 Create src/app/api/inbound/route.ts
    - POST /api/inbound
    - Body: supplierId, invoiceNumber, items array with productId, qty, unitCost, batchNumber, expiryDate, sellingPrice
    - Create InventoryBatch per item
    - Update Product sellingPrice if changed
    - Return summary with total HPP
    - Export const runtime nodejs

- [ ] 10. TASK-1.10 · API Routes: Reports
  - [ ] 10.1 Create src/app/api/reports/profit/route.ts
    - GET /api/reports/profit with from, to, branchId params
    - Join Transaction to TransactionItem to TransactionItemBatch to InventoryBatch
    - Calculate revenue as qty times sellingPrice, cogs as qty times unitCost from batch, grossProfit
    - Export const runtime nodejs
  - [ ] 10.2 Create src/app/api/reports/shift/route.ts
    - GET /api/reports/shift with shiftId param
    - Return expected vs actual cash for Tunai payment transactions
    - Export const runtime nodejs

- [ ] 11. TASK-1.11 · Fix tailwindcss-animate Plugin
  - [ ] 11.1 Add tailwindcss-animate to plugins array in tailwind.config.ts
    - Plugin already installed in devDependencies but not activated
    - Fixes Shadcn UI animations for dialog, dropdown, etc.

## Notes

- TASK-1.1 and TASK-1.2 are already complete
- All API routes using Prisma MUST export const runtime nodejs
- CRITICAL: NEVER accept tenantId or branchId from request body, always extract from JWT
- TASK-1.5 middleware must be complete before TASK-1.6 through TASK-1.10
- .env.local must never be committed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3", "4", "5"] },
    { "id": 2, "tasks": ["6", "7", "8", "9", "10"] },
    { "id": 3, "tasks": ["11"] }
  ]
}
```
