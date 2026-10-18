# Implementation Plan: Phase 3 — Feature Integration (UI → Real Data)

## Overview

Connect all 5 dashboard pages to real data. Replace hardcoded mock data with WatermelonDB queries and live API calls. Implement authentication frontend, Zustand POS cart store, and route guards. All POS writes go to WatermelonDB — never directly to API.

## Tasks

- [x] 1. TASK-3.1 · Zustand: POS Cart Store
  - [x] 1.1 Create src/features/pos/store.ts with Zustand cart store
    - Install zustand if not already present (check package.json first)
    - Define CartItem interface: productId string, name string, sku string, quantity number, sellingPrice number, expiryStatus string
    - Define HeldTransaction interface: id string, items CartItem[], timestamp number
    - Define CartState with: items CartItem[], heldTransactions HeldTransaction[], paymentMethod ('tunai' | 'qris' | 'kartu' | null), cashReceived number
    - Actions: addItem(product), updateQty(productId, qty), removeItem(productId), voidItem(productId), holdTransaction(), restoreTransaction(id), clearCart(), setPaymentMethod(method), setCashReceived(amount)
    - Computed getters: subtotal (sum of qty * sellingPrice), change (cashReceived - subtotal, 0 if negative)
    - addItem: if product already in cart, increment qty; else push new CartItem
    - holdTransaction: move current items to heldTransactions with uuid as id and Date.now() timestamp, then clearCart
    - restoreTransaction: find held transaction by id, set items to it, remove from heldTransactions
    - Use create from zustand
    - Export useCartStore as named export

- [x] 2. TASK-3.2 · Auth Frontend: Token Management
  - [x] 2.1 Create src/core/auth/client.ts with client-side auth utilities
    - getDeviceToken(): string | null — localStorage.getItem('deviceToken')
    - setDeviceToken(token: string): void — localStorage.setItem('deviceToken', token)
    - clearDeviceToken(): void — localStorage.removeItem('deviceToken') and localStorage.removeItem('sessionToken')
    - getSessionToken(): string | null — localStorage.getItem('sessionToken')
    - setSessionToken(token: string): void — localStorage.setItem('sessionToken', token)
    - isDeviceRegistered(): boolean — returns !!getDeviceToken()
    - All functions guard with typeof window !== 'undefined' check (return null/false if SSR)
    - Export all as named exports

- [x] 3. TASK-3.3 · Auth Frontend: Login Page Connection
  - [x] 3.1 Update src/app/masuk/page.tsx to connect to real auth APIs
    - Replace hardcoded kasirOptions with fetch from GET /api/users?role=kasir using device token
    - On kasir PIN submit: call POST /api/auth/pin-verify with { userId: selectedKasir, pin }, store returned sessionToken via setSessionToken()
    - On admin/owner login: call POST /api/auth/pin-verify or use email+password flow if implemented
    - On device not registered: show device registration form, call POST /api/auth/register with { tenantCode, branchCode, deviceName, adminPassword }, store returned token via setDeviceToken()
    - After successful login: redirect kasir to /kasir, admin to /inventaris, owner to /laporan using useRouter
    - Show loading state on submit buttons
    - Show error toast on failed auth (wrong PIN, network error)
    - Keep existing UI layout and styling — only replace data + handlers
    - pendingSyncCount: read from useSyncManager or default to 0 if not yet initialized

- [x] 4. TASK-3.4 · Root Route & Navigation Guards
  - [x] 4.1 Update src/app/page.tsx to redirect based on auth state
    - 'use client' directive
    - On mount: check isDeviceRegistered() from auth client
    - If not registered: redirect to /masuk
    - If registered: redirect to /kasir (default, can be role-based later)
    - Show loading spinner while checking
  - [x] 4.2 Update src/middleware.ts to also guard dashboard pages
    - Current middleware only guards /api/* routes
    - Add check for dashboard routes: /(dashboard)/* or specific paths /kasir, /inventaris, /laporan, /barang-masuk, /kedaluwarsa
    - Check for sessionToken in cookies or Authorization header for page requests
    - Redirect to /masuk if no valid session (use NextResponse.redirect)
    - Keep existing /api/* JWT guard unchanged
    - Skip guard for /masuk and /api/auth/* routes

- [x] 5. TASK-3.5 · Kasir Page: Connect to WatermelonDB + Zustand
  - [x] 5.1 Connect kasir page product lookup to WatermelonDB
    - Replace hardcoded products array with useProducts() hook from @/core/db/hooks
    - Barcode scan: find product in WatermelonDB by SKU using collection query
    - Expiry check: query inventory_batches for this product, check if ALL batches have expiryDate < today OR isBlocked = true → block scan with error toast
    - If some batches expired but not all → allow scan but show warning
    - Keep existing scan input UX (keyboard emulation, auto-clear, shake animation on error)
  - [x] 5.2 Connect kasir page cart to Zustand store
    - Replace local useState cart with useCartStore from @/features/pos/store
    - addItem, updateQty, removeItem, holdTransaction, restoreTransaction, clearCart → all from store
    - paymentMethod, cashReceived, change, subtotal → from store
    - Keep existing UI (cart table, hold dialog, void dialog, payment modal)
  - [x] 5.3 Connect kasir page checkout to WatermelonDB write
    - On payment confirmed: do NOT call fetch/axios
    - Generate transaction UUID using uuidv4() from 'uuid'
    - Create Transaction record in WatermelonDB using db.write(() => db.collections.get('transactions').create(...))
    - Create TransactionItem records for each cart item in same db.write
    - Set transaction status = 'pending_sync', synced_at = null
    - After write: call triggerSync() from useSyncManager to attempt background push
    - Show receipt dialog after successful write (offline or online)
    - Add offline indicator: check navigator.onLine, show WifiOff icon if offline
  - [x] 5.4 Integrate useSyncManager into kasir page
    - Import useDatabase from @/core/db/hooks
    - Import useSyncManager from @/core/sync/useSyncManager
    - Pass db to useSyncManager, destructure { isSyncing, syncError, triggerSync }
    - Show sync status indicator in header (spinning icon when isSyncing)
    - Use triggerSync() after each completed transaction

- [x] 6. TASK-3.6 · Inventaris Page: Connect to WatermelonDB
  - [x] 6.1 Replace hardcoded inventory items with WatermelonDB queries
    - Use useProducts(search) hook for product list with real-time search
    - For each product: query inventory_batches to sum currentQty as available stock
    - Low stock: compare totalQty to product.reorderPoint
    - Expiring: count batches where expiryDate is within 30 days from today
    - Keep existing filter tabs (all, low, expiry, variance) and table UI
  - [x] 6.2 Connect stock opname (physical count) to WatermelonDB
    - Physical count input → update local state as before (no change)
    - Submit opname: write adjustment record to WatermelonDB (or call API if online)
    - For now: if online, POST to /api/inventory/opname; if offline, queue in a pending_opname WatermelonDB table (skip the offline queue for now — just disable submit when offline and show message)

- [x] 7. TASK-3.7 · Kedaluwarsa Page: Connect to WatermelonDB
  - [x] 7.1 Replace hardcoded batch list with useInventoryBatches() hook
    - Use useInventoryBatches() from @/core/db/hooks (no productId filter — all batches)
    - Calculate daysLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24))
    - Bucket cards (expired / ≤7 / 8-14 / 15-30 / >30) computed from live data
    - Sort by expiryDate ASC (FEFO order) — already how WatermelonDB returns them if queried with orderBy
    - Keep existing table UI and color coding
  - [x] 7.2 Connect block batch action to WatermelonDB
    - Block batch button: call db.write(() => batch.update(b => { b.isBlocked = true }))
    - This updates WatermelonDB locally — sync engine pushes to server in background
    - Show optimistic UI update immediately (WatermelonDB observe() auto-updates the list)

- [x] 8. TASK-3.8 · Barang Masuk Page: Connect to API
  - [x] 8.1 Connect barcode scan to WatermelonDB product lookup
    - Replace hardcoded catalog object with WatermelonDB query by SKU
    - If SKU not found in WatermelonDB → show "Produk baru" state, allow manual name/unit input
    - Keep existing line item table and form UI
  - [x] 8.2 Connect submit to POST /api/inbound
    - On save confirmed: POST /api/inbound with { items: lines.map(...) }
    - Map lines to API format: { productId, qty, unitCost: cost, batchNumber: batch, expiryDate: expiry, sellingPrice }
    - Show loading spinner on save button
    - On success: trigger WatermelonDB sync (to pull new batches into local DB), show success toast, clear form
    - On error: show error toast with message
    - Disable save button when offline (this operation requires internet)

- [x] 9. TASK-3.9 · Laporan Page: Connect to API
  - [x] 9.1 Connect KPI cards and chart to GET /api/reports/profit
    - Replace hardcoded periodsData with fetch to /api/reports/profit?from=&to=
    - Date range from the period selector (default: current month)
    - Show loading skeleton while fetching
    - On error or offline: show "Data tidak tersedia offline" empty state
    - Use sessionToken for Authorization header on this fetch
  - [x] 9.2 Connect shift reconciliation to API
    - End shift button: POST /api/reports/shift/close with shift data
    - Show offline-disabled state if navigator.onLine is false

## Notes

- TASK-3.1 (Zustand store) and TASK-3.2 (auth client) are independent — can run in parallel
- TASK-3.3 (login page) depends on TASK-3.2 (auth client utilities)
- TASK-3.4 (route guards) depends on TASK-3.2
- TASK-3.5 (kasir) depends on TASK-3.1 (Zustand) + Phase 2 complete
- TASK-3.6, 3.7 depend only on Phase 2 (WatermelonDB hooks)
- TASK-3.8, 3.9 depend on Phase 2 (for WatermelonDB queries) + Phase 1 APIs
- CRITICAL: Kasir page MUST NOT use fetch/axios for transactions — WatermelonDB write only
- CRITICAL: tenantId and branchId always from JWT, never from UI state
- Keep all existing UI layout, styling, and Shadcn components unchanged — only replace data sources

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3", "4", "6", "7", "8", "9"] },
    { "id": 2, "tasks": ["5"] }
  ]
}
```
