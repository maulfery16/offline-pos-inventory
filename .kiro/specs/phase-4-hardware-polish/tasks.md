# Implementation Plan: Phase 4 — Hardware & Polish

## Overview

Complete the POS system with thermal printer integration (WebUSB + ESC/POS), PWA installability, low-stock notifications, POS expiry auto-block, anomaly stock dashboard, and the tenant/branch settings page. All constraints from previous phases remain in effect: `tenantId`/`branchId` only from JWT, POS writes only to WatermelonDB, FEFO stays in the backend.

## Tasks

- [x] 1. TASK-4.1 · WebUSB Thermal Printer Service
  - [x] 1.1 Create `src/features/pos/hardware/webusb.ts` — singleton printer service
    - Export `PrinterState` interface: `{ isConnected: boolean, isSupported: boolean, device: USBDevice | null }`
    - Module-level singleton state; `isSupported` set once on module load via `typeof navigator !== 'undefined' && 'usb' in navigator`
    - `requestPrinterDevice(): Promise<USBDevice>` — calls `navigator.usb.requestDevice({ filters: [{ classCode: 7 }] })`
    - `connectPrinter(device: USBDevice): Promise<void>` — `device.open()` → `device.selectConfiguration(1)` → `device.claimInterface(0)`, then register `navigator.usb` `'disconnect'` event handler that calls `disconnectPrinter()` when `event.device === state.device`
    - `disconnectPrinter(): void` — releases interface, closes device, resets singleton state to disconnected
    - `sendBuffer(buffer: Uint8Array): Promise<void>` — iterates `device.configuration.interfaces[0].alternate.endpoints` to find `direction === 'out' && type === 'bulk'`, calls `device.transferOut(endpointNumber, buffer)`, throws if not connected
    - `getPrinterState(): PrinterState` — returns current state snapshot
    - All functions that touch `navigator.usb` must be guarded with `isSupported` check
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

  - [x] 1.2 Create `src/features/pos/hardware/receipt.ts` — ESC/POS buffer builder
    - Export `ReceiptData` interface: `{ storeName, branchName, receiptRef, transactionDate: Date, items: Array<{ name, quantity, sellingPrice }>, subtotal, paymentMethod, cashReceived, change }`
    - Export `formatRupiah(amount: number): string` — returns `Rp ${value.toLocaleString('id-ID')}` (no decimal for whole numbers)
    - Export `buildReceipt(data: ReceiptData): Uint8Array` — assembles ESC/POS command sequence in order:
      1. `ESC @` (0x1B 0x40) — initialize
      2. `ESC a 1` (0x1B 0x61 0x01) — center align
      3. storeName + LF (0x0A)
      4. branchName + LF
      5. `ESC a 0` (0x1B 0x61 0x00) — left align
      6. transactionDate formatted string + LF
      7. receiptRef + LF
      8. `'-'.repeat(32)` + LF — separator
      9. Per item: `name + '\t' + quantity + 'x' + formatRupiah(sellingPrice)` + LF
      10. `'-'.repeat(32)` + LF — separator
      11. `'Subtotal:' + formatRupiah(subtotal)` + LF
      12. `'Pembayaran:' + paymentMethod` + LF
      13. `'Kembalian:' + formatRupiah(change)` + LF
      14. LF × 3 (0x0A 0x0A 0x0A) — paper feed
      15. `GS V 66 3` (0x1D 0x56 0x42 0x03) — partial cut
    - Use `TextEncoder` to encode string segments to UTF-8 bytes; concatenate all segments into a single `Uint8Array`
    - _Requirements: 2.2, 2.3, 2.6_

  - [x]* 1.3 Write property tests for `expiryGuard.ts` — Properties 1, 2, 3
    - **Property 1: Expiry guard blocks fully-expired products** — generate arbitrary arrays of batches where ALL have `expiryDate < now` or `isBlocked = true`; assert result is `status: 'blocked'`
    - **Validates: Requirements 6.2**
    - **Property 2: Expiry guard allows products with at least one valid batch** — generate arrays with at least one batch where `expiryDate >= now` AND `isBlocked = false`; assert result is `'ok'` or `'warning'`, never `'blocked'`
    - **Validates: Requirements 6.3**
    - **Property 3: Expiry guard blocks products with no batches** — generate empty batch array; assert result is `status: 'blocked'`
    - **Validates: Requirements 6.4**
    - Use `fast-check` with min 100 runs per property; mock WatermelonDB with factory data

  - [x]* 1.4 Write property tests for `receipt.ts` — Properties 4, 5
    - **Property 4: Receipt builder includes all required fields** — generate arbitrary valid `ReceiptData`; decode output `Uint8Array` as UTF-8; assert it contains storeName, each item name, each item quantity, subtotal value, paymentMethod string, and change amount
    - **Validates: Requirements 2.2, 2.6**
    - **Property 5: Receipt currency format is Indonesian Rupiah** — generate arbitrary non-negative numbers; assert `formatRupiah(n)` starts with `"Rp"` and the numeric part uses period as thousands separator with no decimal for whole numbers
    - **Validates: Requirements 2.6**
    - Use `fast-check` with min 100 runs per property

  - [x] 1.5 Create `src/features/pos/hooks/usePrinter.ts` — React hook facade
    - `'use client'` directive at top
    - Export `UsePrinterReturn` interface: `{ isConnected: boolean, isSupported: boolean, connect: () => Promise<void>, print: (data: ReceiptData) => Promise<void> }`
    - `usePrinter()` hook: local `useState` initialized from `getPrinterState()`, updated after each connect/disconnect
    - `connect()` — calls `requestPrinterDevice()` then `connectPrinter(device)`, sets local state from `getPrinterState()`, shows error toast on failure (DOMException NotFoundError caught silently, other errors show "Gagal menghubungkan printer")
    - `print(data)`: if `isConnected` → `buildReceipt(data)` → `sendBuffer(buffer)`; on `transferOut` failure → show toast "Gagal mencetak — coba lagi"; if not connected or `!isSupported` → iframe fallback
    - Iframe fallback: create `<iframe style="display:none">`, set `srcdoc` to receipt HTML template, call `iframe.contentWindow.print()`, remove iframe from DOM inside `onload` handler
    - _Requirements: 1.3, 1.7, 2.4, 2.5, 2.7_

- [x] 2. Checkpoint — Printer service complete
  - Ensure `webusb.ts`, `receipt.ts`, and `usePrinter.ts` compile without TypeScript errors. Run `tsc --noEmit` or `next build` dry-run. Ask the user if questions arise.

- [x] 3. TASK-4.4 · Expiry Auto-Block in POS
  - [x] 3.1 Create `src/features/inventory/expiryGuard.ts` — pure expiry check function
    - `'use client'` directive
    - Export `ExpiryCheckResult` type: `{ status: 'ok' } | { status: 'warning'; message: string } | { status: 'blocked'; message: string }`
    - Export `checkProductExpiry(productId: string, db: Database): Promise<ExpiryCheckResult>`
    - Query `inventory_batches WHERE product_id = productId` from WatermelonDB — NO network requests
    - Logic (in order):
      1. If `batches.length === 0` → `{ status: 'blocked', message: 'Stok tidak ditemukan untuk produk ini' }`
      2. Filter expired: `batch.expiryDate < new Date()` OR `batch.isBlocked === true`; treat batch with null `expiryDate` as non-expired (non-perishable)
      3. If all batches expired → `{ status: 'blocked', message: 'Produk tidak dapat dijual — semua batch telah kedaluwarsa atau diblokir' }`
      4. If some batches expired → `{ status: 'warning', message: 'Beberapa batch telah kedaluwarsa. FEFO otomatis diterapkan.' }`
      5. Else → `{ status: 'ok' }`
    - Wrap entire function in try/catch — on error return `{ status: 'blocked', message: '...' }` (fail-safe)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 3.2 Update `src/app/(dashboard)/kasir/page.tsx` — integrate expiry guard before addItem
    - Import `checkProductExpiry` from `@/features/inventory/expiryGuard`
    - In the barcode scan handler, call `checkProductExpiry(product.id, db)` before `addItem`
    - If `result.status === 'blocked'` → show error dialog with `result.message`; do NOT call `addItem`
    - If `result.status === 'warning'` → show warning toast with `result.message`; proceed with `addItem`
    - If `result.status === 'ok'` → proceed with `addItem` silently
    - Do NOT make any network requests inside the scan handler
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. TASK-4.1 (continued) · Integrate `usePrinter` into Kasir Page
  - [x] 4.1 Update `src/app/(dashboard)/kasir/page.tsx` — add printer connect button and post-checkout print
    - Import `usePrinter` from `@/features/pos/hooks/usePrinter`
    - Add "Hubungkan Printer" button in the kasir page header area; show green connected indicator (Requirement 1.3) when `isConnected === true`; hide button if `!isSupported` and show fallback print icon instead
    - After transaction is written to WatermelonDB (existing checkout flow), call `print(receiptData)` — build `ReceiptData` from the completed transaction and cart items
    - `receiptData.storeName` and `branchName` read from device JWT decoded values or localStorage
    - Do NOT roll back the WatermelonDB write if `print` fails
    - _Requirements: 1.3, 1.7, 2.1, 2.4, 2.5_

- [x] 5. TASK-4.2 · PWA: Manifest & Offline Pages
  - [x] 5.1 Create/verify `public/manifest.json` with all required PWA fields
    - Ensure `name: "Kasir POS"`, `short_name: "Kasir"`, `description: "Sistem POS offline-first multi-cabang"`, `start_url: "/kasir"`, `display: "standalone"`, `theme_color: "#0f6d5f"`, `background_color: "#ffffff"`
    - Icon entries: `{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }` and `{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }`
    - If `public/icons/` directory is missing, create placeholder 192×192 and 512×512 PNG files (solid color with text label) so Lighthouse does not error
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Create `public/offline.html` — standalone service worker fallback page
    - Pure HTML/CSS — no Next.js bundling; must be self-contained in a single file
    - Display application name "Kasir POS", offline message in Indonesian, and instruction to check network
    - Add `<meta http-equiv="refresh" content="5;url=/">` for auto-redirect after 5 seconds (Requirement 4.3)
    - Add "Coba Lagi" button that calls `window.location.href = '/'`
    - Minimal styling: white background, centered content, brand color `#0f6d5f`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.3 Update `next.config.js` — configure `next-pwa` with runtime caching
    - Wrap existing config with `withPWA` from `next-pwa`
    - Set `dest: 'public'`, `register: true`, `skipWaiting: true`
    - Add `runtimeCaching` array with strategies:
      - Static assets (`/_next/static/**`): `CacheFirst`, cacheName `static-assets`, maxEntries 200
      - API responses (`/api/**`): `NetworkFirst`, cacheName `api-cache`, maxAgeSeconds 3600
      - Navigation fallback: `fallbackUrls: { document: '/offline.html' }`
    - Disable PWA in development: `disable: process.env.NODE_ENV === 'development'`
    - _Requirements: 3.3, 3.4, 4.1_

- [x] 6. TASK-4.3 · Low Stock Notifications
  - [x] 6.1 Create `src/features/inventory/notifications.ts` — low-stock query function
    - `'use client'` directive
    - Export `LowStockSummary` interface: `{ count: number, productNames: string[] }` (max 3 names)
    - Export `getLowStockSummary(db: Database, branchId: string): Promise<LowStockSummary>`
    - Query all products from WatermelonDB; for each product, sum `currentQty` from `inventory_batches WHERE branch_id = branchId`
    - If `totalQty <= product.reorderPoint` → include in low-stock list
    - Return `{ count, productNames: lowStockProducts.slice(0, 3).map(p => p.name) }`
    - Return `{ count: 0, productNames: [] }` if WatermelonDB is not initialized or query fails
    - _Requirements: 5.1, 5.5_

  - [x] 6.2 Create `src/features/inventory/hooks/useLowStockBadge.ts` — reactive low-stock hook
    - `'use client'` directive
    - Export `useLowStockBadge(): { count: number }`
    - Use `useDatabase()` from `@/core/db/DatabaseProvider` to get db instance
    - On mount and after each WatermelonDB sync event, call `getLowStockSummary(db, branchId)` where `branchId` is read from device JWT via `getDeviceToken()` decoded
    - Use `useEffect` with WatermelonDB `withObservables` or subscribe to the products collection observable for reactive updates
    - On first load, if `count > 0` → fire a `sonner` toast: `"${count} produk stok rendah — periksa halaman Inventaris"`
    - Return `{ count }`
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 6.3 Update dashboard sidebar / RetailShell layout — show low-stock badge
    - Identify the sidebar nav component (likely `src/shared/components/` or `src/app/(dashboard)/layout.tsx`)
    - Import `useLowStockBadge` and call it at the layout level
    - Render a numeric badge on the "Inventaris" navigation item when `count > 0`
    - Use Shadcn `Badge` variant to display the count; position it inline with the nav label
    - _Requirements: 5.3, 5.4_

- [x] 7. TASK-4.5 · Anomaly Stock Dashboard
  - [x] 7.1 Create `src/app/api/inventory/anomalies/route.ts` — GET anomalies endpoint
    - `export const runtime = 'nodejs'`
    - GET handler: extract `tenantId` from `x-tenant-id` header (injected by middleware — never from query params or body)
    - Query Prisma: `InventoryBatch.findMany({ where: { hasAnomalyFlag: true, tenantId }, include: { product: true } })`
    - Return array of `{ id, productName, sku, batchNumber, currentQty, flaggedAt }` — `flaggedAt` is `updatedAt` of the batch record
    - Return 200 with empty array if no anomalies found
    - _Requirements: 7.1, 7.2_

  - [x] 7.2 Create `src/app/api/inventory/anomalies/resolve/route.ts` — POST resolve endpoint
    - `export const runtime = 'nodejs'`
    - POST handler: extract `tenantId` from `x-tenant-id` header; read `{ batchId, correctedQty }` from request body ONLY
    - Verify batch belongs to `tenantId` before updating (prevent cross-tenant writes)
    - Prisma: `InventoryBatch.update({ where: { id: batchId }, data: { currentQty: correctedQty, hasAnomalyFlag: false } })`
    - Return 200 on success; 404 if batch not found or doesn't belong to tenant
    - _Requirements: 7.4, 7.5_

  - [x] 7.3 Create `src/features/inventory/AnomalySection.tsx` — anomaly section component
    - `'use client'` directive
    - Props: `role: string`; if `role === 'cashier'` → return `null` immediately (Requirement 7.7)
    - On mount: fetch `GET /api/inventory/anomalies` with `Authorization: Bearer <deviceToken>` from localStorage
    - On network error: display "Anomali tidak tersedia secara offline" message — no error dialog
    - Display table/list: product name, SKU, batch number, current qty (highlight red if negative), flaggedAt date
    - "Selesaikan" button per row → open Shadcn `Dialog` modal with a number input for corrected quantity
    - On modal submit: `POST /api/inventory/anomalies/resolve` with `{ batchId, correctedQty }`, then remove resolved entry from local state and show success toast
    - On POST failure: show error toast; keep entry in list
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 7.4 Update `src/app/(dashboard)/inventaris/page.tsx` — add AnomalySection
    - Import `AnomalySection` from `@/features/inventory/AnomalySection`
    - Read `role` from decoded session JWT using `src/core/auth/client.ts`
    - Render `<AnomalySection role={role} />` below the main inventory table
    - _Requirements: 7.1, 7.7_

- [x] 8. Checkpoint — Core features complete
  - Ensure all tasks above (1–7) compile without errors. Verify `expiryGuard` and `receipt` unit/property tests pass. Ask the user if questions arise.

- [x] 9. TASK-4.6 · Tenant & Branch Settings — API Routes
  - [x] 9.1 Create `src/app/api/branches/route.ts` — POST create branch
    - `export const runtime = 'nodejs'`
    - POST: extract `tenantId` from `x-tenant-id` header; read `{ name, address }` from body
    - `Branch.create({ data: { name, address, tenantId } })`
    - Return 201 with created branch; 400 on validation error
    - _Requirements: 8.4_

  - [x] 9.2 Create `src/app/api/users/route.ts` — POST create cashier
    - `export const runtime = 'nodejs'`
    - POST: extract `tenantId` from `x-tenant-id` header; read `{ name, hashedPin, branchId }` from body — client sends pre-hashed PIN (bcrypt, client-side); backend stores as-is
    - Validate `branchId` belongs to `tenantId` before creating
    - `User.create({ data: { name, pin: hashedPin, branchId, tenantId, role: 'cashier', isActive: true } })`
    - Return 201 with `{ id, name, branchId, isActive }`
    - _Requirements: 8.5, 8.6_

  - [x] 9.3 Create `src/app/api/users/[id]/route.ts` — PATCH deactivate cashier
    - `export const runtime = 'nodejs'`
    - PATCH: extract `tenantId` from `x-tenant-id` header; verify user belongs to `tenantId`
    - `User.update({ where: { id }, data: { isActive: false } })` — soft disable, no deletion
    - Return 200 on success; 404 if not found or cross-tenant
    - _Requirements: 8.7_

  - [x] 9.4 Create `src/app/api/devices/[id]/route.ts` — DELETE revoke device
    - `export const runtime = 'nodejs'`
    - DELETE: extract `tenantId` from `x-tenant-id` header; verify device belongs to `tenantId`
    - `Device.update({ where: { id }, data: { isRevoked: true } })` — soft revoke; middleware will reject JWT from revoked devices on next request
    - Return 200 on success; 404 if not found
    - _Requirements: 8.9_

  - [x] 9.5 Create `src/app/api/tenants/[id]/route.ts` — PATCH update store info
    - `export const runtime = 'nodejs'`
    - PATCH: extract `tenantId` from `x-tenant-id` header; verify `id === tenantId` (prevent cross-tenant update)
    - Read `{ storeName, address }` from body; update `Tenant.update({ where: { id: tenantId }, data: { name: storeName, address } })`
    - Return 200 with updated tenant
    - _Requirements: 8.10_

- [x] 10. TASK-4.6 (continued) · Tenant & Branch Settings — UI Pages
  - [x] 10.1 Create `src/app/(dashboard)/pengaturan/page.tsx` — tab shell with role guard
    - `'use client'` directive
    - On mount: decode session JWT using `src/core/auth/client.ts`; if `role === 'cashier'` → `router.replace('/kasir')` before render
    - Render Shadcn `Tabs` with five tabs: "Cabang", "Kasir", "Perangkat", "Produk", "Info Toko"
    - Lazy-import each tab component to keep bundle lean
    - Pass `tenantId` and `branchId` from decoded JWT as props to each tab
    - _Requirements: 8.1, 8.2_

  - [x] 10.2 Create `src/app/(dashboard)/pengaturan/tabs/BranchTab.tsx`
    - `'use client'` directive
    - Fetch `GET /api/branches` (add this endpoint if not present) to list branches for tenant
    - Display table: branch name, address, active device count
    - "Tambah Cabang" button → inline form or dialog → `POST /api/branches` with `{ name, address }` (no tenantId in body)
    - _Requirements: 8.3, 8.4_

  - [x] 10.3 Create `src/app/(dashboard)/pengaturan/tabs/CashierTab.tsx`
    - `'use client'` directive
    - Fetch `GET /api/users?role=cashier` to list cashiers for tenant
    - Display table: name, assigned branch, isActive status
    - "Tambah Kasir" form → on submit: hash PIN client-side with `bcryptjs` (`await bcrypt.hash(pin, 10)`), then `POST /api/users` with `{ name, hashedPin, branchId }`
    - "Nonaktifkan" button → `PATCH /api/users/[id]` → update row in local state
    - _Requirements: 8.5, 8.6, 8.7_

  - [x] 10.4 Create `src/app/(dashboard)/pengaturan/tabs/DeviceTab.tsx`
    - `'use client'` directive
    - Fetch `GET /api/devices` (add endpoint if not present) to list registered devices
    - Display table: device name, registration date, last sync timestamp, active/revoked status
    - "Cabut Akses" button → `DELETE /api/devices/[id]` → update row status in local state
    - _Requirements: 8.8, 8.9_

  - [x] 10.5 Create `src/app/(dashboard)/pengaturan/tabs/ProductTab.tsx`
    - `'use client'` directive
    - Fetch `GET /api/products` to list all products for tenant
    - Display table: name, SKU, unit, sellingPrice, status (active/deleted)
    - "Tambah Produk" → form dialog → `POST /api/products` with `{ name, sku, unit, sellingPrice }` (tenantId from JWT server-side)
    - "Edit" → prefill form → `PUT /api/products/[id]`
    - "Nonaktifkan" → `DELETE /api/products/[id]` which triggers soft delete (`deletedAt = now()`) — the next sync pull will include this ID in the `deleted` array
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.6 Create `src/app/(dashboard)/pengaturan/tabs/StoreTab.tsx`
    - `'use client'` directive
    - Fetch `GET /api/tenants/[id]` (or derive from JWT) to load current store name and address
    - Display editable form: store name, address
    - On submit: `PATCH /api/tenants/[id]` with `{ storeName, address }` — `id` taken from decoded JWT, NOT from form
    - Show success toast on update
    - _Requirements: 8.10_

- [x] 11. Final Checkpoint — All tasks complete
  - Ensure all tests pass and TypeScript compiles cleanly. Verify `next build` completes without errors. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Property tests (1.3, 1.4) require `fast-check` — check `package.json` before adding; install with `npm install --save-dev fast-check` if missing
- `bcryptjs` is used for client-side PIN hashing in CashierTab — verify it's in `package.json`; install with `npm install bcryptjs` if missing
- All API routes use `export const runtime = 'nodejs'` — required for Prisma compatibility
- `tenantId`/`branchId` are NEVER accepted from request body — always extracted from `x-tenant-id` / `x-branch-id` headers injected by middleware
- Soft deletes only: `deletedAt` timestamp, no hard SQL DELETE statements

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "3.1", "5.1", "5.2", "7.1", "7.2", "9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "3.2", "5.3", "6.1", "7.3"] },
    { "id": 2, "tasks": ["4.1", "6.2", "7.4", "10.1"] },
    { "id": 3, "tasks": ["6.3", "10.2", "10.3", "10.4", "10.5", "10.6"] }
  ]
}
```
