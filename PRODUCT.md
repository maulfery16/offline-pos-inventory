# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Kasir (Cashier):** Front-line retail staff processing sales at the counter. Speed and zero-friction scanning are their job. They log in with a 4–6 digit PIN and should never need to think about the system.
- **Store Manager / Admin:** Oversees inbound goods, stock levels, expiry dates, and inventory counts. Works across both desktop and a smartphone camera for aisle stock-opname.
- **Owner / Stakeholder:** Reviews gross profit, multi-branch analytics, and financial summaries. Primarily a read-only consumer of reports; expects clean numbers and trend data.

## Product Purpose

An offline-first POS and retail inventory management system for small-to-medium Indonesian retailers. It lets stores process sales, track stock, and manage expiry-sensitive batches with full accuracy — even without an internet connection. Success means a store can open for business, close the day with a reconciled shift report, and trust that COGS and inventory numbers are correct.

## Positioning

The system is sold as a generic multi-tenant SaaS platform licensed to multiple retailers. Its meaningfully different mechanism is the combination of local-first reliability (WatermelonDB offline engine, negative-stock tolerance during outages) with server-side FEFO batch accounting — a pairing most lightweight POS tools skip entirely, leaving retailers with inaccurate margins and expired-stock liability.

## Operating Context

- Retail counters in Indonesia (convenience stores, mini-markets, specialty shops).
- Intermittent or unreliable internet is the norm, not the exception; the POS must queue and sync without staff intervention.
- Physical barcode scanners via keyboard emulation are standard hardware; some stores also use smartphone cameras for stock-opname.
- Thermal receipt printers are connected via USB (WebUSB primary, iframe print fallback).
- Sessions are device-scoped: a device is registered once with a long-lived JWT; individual cashiers authenticate per-shift with a PIN.
- Indonesian language throughout the UI (routes: `/kasir`, `/masuk`, `/barang-masuk`, `/kedaluwarsa`, `/laporan`).

## Capabilities and Constraints

- **Core features:** POS (offline cart, multi-payment: tunai/QRIS/kartu), inbound goods receipt with batch + expiry tracking, FEFO deduction at sync time, stock-opname via PWA camera scan, expiry dashboards with auto-block, gross-profit and shift-reconciliation reports.
- **Multi-tenant:** Each tenant (retailer) and branch are isolated by JWT-extracted `tenantId` / `branchId`. Client-supplied IDs are never trusted.
- **Offline engine:** WatermelonDB (IndexedDB in production) for all POS writes. Sync engine pushes queued transactions when online; pulls product and batch updates.
- **FEFO accounting:** Backend only — frontend sends `quantity` + `sellingPrice`; Prisma handles batch deduction and `TransactionItemBatch` ledger generation.
- **Negative stock:** Allowed during offline sync to prevent queue blockage; anomaly-flagged for admin review.
- **Soft deletes:** `deletedAt` on Products and Branches; no hard SQL `DELETE`.
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/Radix UI, Zustand, WatermelonDB, PostgreSQL + Prisma, `jose` JWT.
- **Undecided:** Brand name (staying generic for now); deploy target not yet specified.

## Brand Commitments

No brand name committed yet. Visual identity uses a teal primary (`#0f6d5f`) with slate gray scale and semantic danger / warning / success tokens. Dark mode is supported. Indonesian language is the UI language.

## Evidence on Hand

- Incumbent UI shell with 5 dashboard pages built with mock data (HTML design specs in `.agents/dpai-designs/`).
- Prisma schema complete; Phase 1 backend API routes (auth, sync, products, inbound, reports) all done.
- Design tokens defined in `tailwind.config.ts` and `src/app/globals.css`.
- No real customer testimonials, case studies, or production deployment on hand.

## Product Principles

1. **Offline first, always.** The store should never stop because the internet did. Every critical workflow runs locally; sync is a background concern.
2. **Speed over features at the counter.** The POS is a high-throughput tool. Scan → add → pay must be sub-second; every extra tap is a queue growing behind the customer.
3. **Numbers you can trust.** FEFO batch accounting and server-side COGS mean the gross-profit report reflects reality, not approximation.
4. **Progressive disclosure.** Cashiers see only what they need. Manager and owner complexity is never in the cashier's path.
5. **Forgiving by design.** Mistakes happen in a busy store. Void, hold, and undo flows are first-class; destructive actions require confirmation.

## Accessibility & Inclusion

No formal standard required. Target: sufficient contrast, clear labels, and keyboard-navigable flows — practical for retail staff of varying digital literacy.
