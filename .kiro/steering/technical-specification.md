---
name: Technical Specification
description: Architecture, technology stack, and critical coding constraints for the Offline-First POS system
inclusion: always
---

# Technical Specification (Tech Spec)
**Architecture:** Web-based (PWA), Offline-First, Feature-Driven

## 1. Technology Stack
*   **Frontend Framework:** Next.js (App Router), React.
*   **Styling & UI:** Tailwind CSS, Shadcn UI / Radix UI (Headless components).
*   **State Management:** Zustand (for transient UI state, e.g., POS cart, scanner input).
*   **Offline Database (Frontend):** WatermelonDB (Relational, lazy-loaded, Sync-ready).
*   **Backend & API:** Node.js via Next.js API Routes (or standalone Express).
*   **Database & ORM:** PostgreSQL with Prisma ORM.

## 2. AI Agent Coding Guidelines (CRITICAL CONSTRAINTS)
1.  **Multi-Tenant Validation:** NEVER trust `tenantId` or `branchId` from the client's request body. ALWAYS extract these values from the server-validated JWT payload.
2.  **No Direct Fetching for POS:** The POS interface MUST NOT use `fetch` or `axios` directly for transactions. ALL transaction data must be written to WatermelonDB locally. The sync engine will push data to the backend in the background.
3.  **FEFO Calculation:** Frontend NEVER calculates Cost of Goods Sold (COGS). Frontend only sends `quantity` and `sellingPrice`. Backend Prisma handles the FEFO batch deduction algorithm and generates `TransactionItemBatch` ledger entries.
4.  **Negative Stock Tolerance:** Backend MUST allow inventory `currentQty` to drop below zero during sync to prevent blocking offline queues. Generate an anomaly flag if this happens.
5.  **Soft Deletes:** WatermelonDB requires soft deletes for local sync. Use `deletedAt` for master data (Products, Branches). DO NOT use hard `DELETE` SQL commands.

## 3. Core System Behaviors
### 3.1. Authentication & Security
*   Admin registers a device -> Backend issues a long-lived JWT -> Stored securely on client.
*   All `/api/sync` requests send the JWT for backend extraction of `tenantId` and `branchId`.

### 3.2. Offline Sync Implementation (WatermelonDB)
*   **Pull Phase:** Client requests `GET /api/sync?lastPulledAt={timestamp}`. Backend returns `created`, `updated`, and `deleted` records for Products and Batches.
*   **Push Phase:** Client sends locally created transactions with UUIDs generated on the frontend. Backend processes these using a Database Transaction (`$transaction` in Prisma) with Row-Level Locking (`FOR UPDATE`).

### 3.3. Hardware Integration (Thermal Printing)
*   **Primary Method:** Use `WebUSB API` (`navigator.usb.requestDevice`) to send ESC/POS commands directly to the thermal printer, bypassing the browser print dialog.
*   **Fallback:** Hidden `<iframe>` calling `window.print()`.

## 4. Feature-Driven Directory Structure
```text
src/
├── core/
│   ├── auth/          # JWT Guard, Device Registration
│   ├── db/            # Prisma client instantiation
│   └── sync/          # WatermelonDB sync engine (Push/Pull)
├── features/
│   ├── inventory/     # FEFO visualizers, API handlers, Deduction services
│   ├── pos/           # Cart, Scanner Input, WebUSB Hardware, Zustand store
│   └── tenants/       # Tenant & Branch management
└── shared/
    ├── components/    # Reusable UI (Tailwind/Shadcn)
    └── utils/         # Date/Currency formatters
```
