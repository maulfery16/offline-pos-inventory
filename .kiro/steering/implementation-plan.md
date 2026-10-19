---
inclusion: manual
name: implementation-plan
description: Rencana implementasi bertahap (Phase 1-4, 24 tasks) untuk project offline POS inventory. Load saat ingin melihat status task, merencanakan sesi kerja berikutnya, atau mengerjakan task baru.
---

# Implementation Plan: Offline POS Inventory System

> **Status keseluruhan**: ~90% complete  
> **Yang sudah ada**: UI shell lengkap, Prisma schema, design system, semua dependencies terpasang, **Phase 1 selesai semua** (auth, sync, products, inbound, reports, middleware), **Phase 2 selesai semua** (WatermelonDB instance, schema, models, sync engine, provider & hooks), **Phase 3 selesai semua** (Zustand store, auth frontend, route guards, semua 5 halaman dashboard terhubung ke data nyata)  
> **Yang belum ada**: Hardware & polish (Phase 4)

Dokumen ini adalah **panduan implementasi bertahap** yang harus diikuti saat mengerjakan fitur baru. Setiap task di bawah adalah atomic dan dapat dikerjakan secara independen dalam satu sesi agent.

---

## Phase Overview

| Phase | Fokus | Prereq |
|-------|-------|--------|
| **Phase 1** | Backend Foundation | — |
| **Phase 2** | WatermelonDB Offline Engine | Phase 1 |
| **Phase 3** | Feature Integration (UI → Data) | Phase 2 |
| **Phase 4** | Hardware & Polish | Phase 3 |

---

## Phase 1 — Backend Foundation

> Goal: Backend "nyala" — database terhubung, API dapat menerima request, auth berfungsi.

### TASK-1.1 · Environment & Database Bootstrap
**Status**: ✅ Done  
**File target**: `.env.local`, `prisma/migrations/`  
**Apa yang dikerjakan**:
- Buat `.env.local` dari `.env.example` dengan nilai placeholder yang jelas
- Tambahkan `DATABASE_URL` (PostgreSQL connection string)
- Tambahkan `JWT_SECRET` (random string ≥32 karakter)
- Jalankan `npx prisma generate` untuk generate Prisma Client
- Jalankan `npx prisma migrate dev --name init` untuk buat semua tabel
- Verifikasi koneksi dengan `npx prisma studio` atau query langsung

**Catatan penting**:
- `.env.local` JANGAN di-commit (sudah ada di `.gitignore`)
- Gunakan `Neon`, `Supabase`, atau PostgreSQL lokal via Docker
- `prisma/schema.prisma` sudah lengkap — TIDAK perlu modifikasi schema

---

### TASK-1.2 · Auth Core: JWT Utilities
**Status**: ✅ Done  
**File target**: `src/core/auth/index.ts`, `src/core/auth/types.ts`  
**Apa yang dikerjakan**:
- Implementasikan `signJWT(payload, expiresIn)` menggunakan library `jose` (sudah terpasang)
- Implementasikan `verifyJWT(token)` — return payload atau throw jika invalid/expired
- Type `JWTPayload` harus include: `tenantId`, `branchId`, `deviceId`, `role`
- **CRITICAL**: `tenantId` dan `branchId` HANYA boleh di-set saat JWT dibuat, TIDAK boleh diambil dari request body

**Constraint**:
- Gunakan `jose` bukan `jsonwebtoken` (kompatibel dengan Edge runtime jika diperlukan)
- `JWT_SECRET` dibaca dari `process.env.JWT_SECRET`

---

### TASK-1.3 · API Route: Device Registration
**Status**: ✅ Done  
**File target**: `src/app/api/auth/register/route.ts`  
**Apa yang dikerjakan**:
- `POST /api/auth/register`
- Request body: `{ tenantCode, branchCode, deviceName, adminPassword }`
- Validasi `tenantCode` + `branchCode` + `adminPassword` di database
- Generate long-lived JWT (30 hari) dengan payload `{ tenantId, branchId, deviceId, role: 'device' }`
- Response: `{ token, deviceId, tenantName, branchName }`
- Error cases: tenant not found, branch not found, wrong password → 401

**Constraint**:
- Gunakan `export const runtime = 'nodejs'` di setiap API route yang menggunakan Prisma

---

### TASK-1.4 · API Route: PIN Verification (Kasir Login)
**Status**: ✅ Done  
**File target**: `src/app/api/auth/pin-verify/route.ts`  
**Apa yang dikerjakan**:
- `POST /api/auth/pin-verify`
- Request header: `Authorization: Bearer <device-jwt>`
- Request body: `{ userId, pin }` (userId adalah ID kasir yang dipilih)
- Verifikasi device JWT dulu — extract `tenantId`, `branchId`
- Cari User dengan `id = userId AND tenantId = (dari JWT)` — JANGAN percaya tenantId dari body
- Verifikasi PIN hash (bcrypt)
- Return short-lived session token (8 jam): `{ sessionToken, userName, role }`

---

### TASK-1.5 · Next.js Middleware: API Route Guard
**Status**: ✅ Done  
**File target**: `src/middleware.ts`  
**Apa yang dikerjakan**:
- Guard semua `/api/*` routes kecuali `/api/auth/*`
- Extract dan verify JWT dari `Authorization: Bearer` header
- Inject `tenantId`, `branchId`, `deviceId` ke request headers untuk diakses API routes
- Return 401 jika token invalid/missing/expired
- TIDAK guard halaman frontend (hanya API routes)

---

### TASK-1.6 · API Route: Sync Pull (GET /api/sync)
**Status**: ✅ Done  
**File target**: `src/app/api/sync/route.ts` (GET handler)  
**Apa yang dikerjakan**:
- `GET /api/sync?lastPulledAt={timestamp}`
- Extract `tenantId` + `branchId` dari JWT (via request headers yang di-inject middleware)
- Pull Products: `WHERE tenantId = ? AND (createdAt > lastPulledAt OR updatedAt > lastPulledAt)`
- Pull InventoryBatches: `WHERE tenantId = ? AND branchId = ? AND (createdAt > lastPulledAt OR updatedAt > lastPulledAt)`
- Response shape (WatermelonDB sync protocol):
  ```json
  {
    "changes": {
      "products": { "created": [], "updated": [], "deleted": [] },
      "inventory_batches": { "created": [], "updated": [], "deleted": [] }
    },
    "timestamp": 1234567890
  }
  ```
- Soft deletes: `deleted` array berisi IDs produk dengan `deletedAt != null`

---

### TASK-1.7 · API Route: Sync Push (POST /api/sync)
**Status**: ✅ Done  
**File target**: `src/app/api/sync/route.ts` (POST handler)  
**Apa yang dikerjakan**:
- `POST /api/sync`
- Body: array of Transactions dengan TransactionItems (UUID dari frontend)
- Untuk setiap Transaction, dalam Prisma `$transaction`:
  1. Upsert Transaction (idempotent — jika UUID sudah ada, skip)
  2. Untuk setiap TransactionItem:
     - Query InventoryBatches untuk product ini, sorted by `expiryDate ASC, receivedDate ASC` (FEFO order)
     - Deduct quantity dari batch pertama, lanjut ke batch berikutnya jika habis
     - Insert `TransactionItemBatch` record per deduction (ledger FEFO)
     - Update `currentQty` per batch (boleh negatif — negative stock tolerance)
     - Jika `currentQty < 0`, set `hasAnomalyFlag = true` di batch
- Return: `{ processedCount, anomalies: [] }`

**Constraint**:
- Gunakan `SELECT ... FOR UPDATE` via Prisma raw query atau `$queryRaw` untuk row-level locking
- Satu Prisma `$transaction` per Transaction (bukan per seluruh batch push)
- Backend TIDAK menerima `tenantId`/`branchId` dari body — ambil dari JWT

---

### TASK-1.8 · API Route: Products Listing
**Status**: ✅ Done  
**File target**: `src/app/api/products/route.ts`  
**Apa yang dikerjakan**:
- `GET /api/products?search=&page=&limit=`
- Filter by `tenantId` dari JWT
- Include active InventoryBatch count per product
- `POST /api/products` — create new product (admin only)
- `PUT /api/products/[id]` — update product
- `DELETE /api/products/[id]` — soft delete (`deletedAt = now()`)

---

### TASK-1.9 · API Route: Inbound / Barang Masuk
**Status**: ✅ Done  
**File target**: `src/app/api/inbound/route.ts`  
**Apa yang dikerjakan**:
- `POST /api/inbound`
- Body: `{ supplierId, invoiceNumber, items: [{ productId, qty, unitCost, batchNumber, expiryDate, sellingPrice }] }`
- Untuk setiap item: create `InventoryBatch` record
- Update atau create `Product` jika `sellingPrice` berubah
- Return summary dengan total HPP

---

### TASK-1.10 · API Route: Reports
**Status**: ✅ Done  
**File target**: `src/app/api/reports/profit/route.ts`, `src/app/api/reports/shift/route.ts`  
**Apa yang dikerjakan**:
- `GET /api/reports/profit?from=&to=&branchId=`
- Join `Transaction → TransactionItem → TransactionItemBatch → InventoryBatch`
- Kalkulasi: `revenue = qty × sellingPrice`, `cogs = qty × unitCost (dari batch)`, `grossProfit = revenue - cogs`
- `GET /api/reports/shift?shiftId=`
- Return expected cash vs actual cash (dari TransactionItems yang payment = Tunai)

---

### TASK-1.11 · Fix: tailwindcss-animate Plugin
**Status**: ✅ Done  
**File target**: `tailwind.config.ts`  
**Apa yang dikerjakan**:
- Tambahkan `require('tailwindcss-animate')` ke array `plugins` di `tailwind.config.ts`
- Plugin sudah terpasang di devDependencies tapi belum aktif
- Ini fix animasi Shadcn (dialog enter/exit, dropdown, dll)

---

## Phase 2 — WatermelonDB Offline Engine

> Goal: App bisa bekerja offline penuh — data tersimpan lokal di browser, sync otomatis saat online.

### TASK-2.1 · WatermelonDB: Database Instance & Adapter
**Status**: ✅ Done  
**File target**: `src/core/db/watermelon.ts`  
**Apa yang dikerjakan**:
- Setup `LokiJSAdapter` untuk development / `IndexedDBAdapter` untuk production (cek platform)
- Instantiate `Database` dengan schema dan adapter
- Export singleton `watermelonDB` instance
- Guard: hanya run di browser (`typeof window !== 'undefined'`)
- Gunakan `'use client'` di semua file yang menggunakan instance ini

**Dependencies**: `@nozbe/watermelondb` (sudah terpasang `0.27.1`)

---

### TASK-2.2 · WatermelonDB: Schema Definition
**Status**: ✅ Done  
**File target**: `src/core/db/schema.ts`  
**Apa yang dikerjakan**:
- Define `appSchema` dengan tabel:
  - `products`: `id (string)`, `tenant_id`, `name`, `sku`, `selling_price`, `unit`, `deleted_at`
  - `inventory_batches`: `id`, `product_id`, `tenant_id`, `branch_id`, `batch_number`, `expiry_date`, `received_date`, `current_qty`, `unit_cost`, `is_blocked`
  - `transactions`: `id (uuid dari frontend)`, `branch_id`, `cashier_id`, `payment_method`, `total_amount`, `status`, `synced_at`, `created_at`
  - `transaction_items`: `id`, `transaction_id`, `product_id`, `quantity`, `selling_price`
- Gunakan `tableSchema()` dan `columnSchema()` dari WatermelonDB

---

### TASK-2.3 · WatermelonDB: Model Classes
**Status**: ✅ Done  
**File target**: `src/core/db/models/Product.ts`, `InventoryBatch.ts`, `Transaction.ts`, `TransactionItem.ts`  
**Apa yang dikerjakan**:
- Extend `Model` dari WatermelonDB
- Dekorasi `@field`, `@date`, `@readonly`, `@relation`, `@children` per kolom
- `Product` → `@children('inventory_batches')` untuk query batch per product
- `Transaction` → `@children('transaction_items')`
- Export `database.collections.get<Product>('products')` helper

---

### TASK-2.4 · WatermelonDB: Sync Engine
**Status**: ✅ Done  
**File target**: `src/core/sync/index.ts`  
**Apa yang dikerjakan**:
- Implementasikan `syncDatabase()` function menggunakan `synchronize()` dari WatermelonDB
- `pullChanges({ lastPulledAt })`: fetch `GET /api/sync?lastPulledAt=` dengan device JWT
- `pushChanges({ changes })`: post `POST /api/sync` dengan array transactions yang belum sync
- Simpan `lastPulledAt` di localStorage
- Trigger sync: saat `window` event `'online'`, dan setiap 30 detik jika online
- Error handling: jika sync gagal, log error tapi jangan block UI

---

### TASK-2.5 · WatermelonDB: React Provider & Hooks
**Status**: ✅ Done  
**File target**: `src/core/db/DatabaseProvider.tsx`, `src/core/db/hooks.ts`  
**Apa yang dikerjakan**:
- `<DatabaseProvider>` — wrap app, provide database instance via context
- `useDatabase()` — hook untuk akses database instance
- `useProducts(search?: string)` — observe products collection dengan optional search
- `useInventoryBatches(productId?: string)` — observe batches, filter by product
- Gunakan WatermelonDB `observe()` pattern untuk reactive updates
- Tambahkan `<DatabaseProvider>` ke `src/app/layout.tsx`

---

## Phase 3 — Feature Integration (UI → Real Data)

> Goal: Semua 5 halaman dashboard terhubung ke WatermelonDB + API, bukan data hardcoded.

### TASK-3.1 · Zustand: POS Cart Store
**Status**: ✅ Done  
**File target**: `src/features/pos/store.ts`  
**Apa yang dikerjakan**:
- Define `CartItem`: `{ productId, name, sku, quantity, sellingPrice, expiryStatus }`
- Define `CartState`:
  - `items: CartItem[]`
  - `heldTransactions: { id, items, timestamp }[]`
  - `paymentMethod: 'tunai' | 'qris' | 'kartu' | null`
  - `cashReceived: number`
- Actions: `addItem`, `updateQty`, `removeItem`, `voidItem`, `holdTransaction`, `restoreTransaction`, `clearCart`, `setPayment`
- Computed: `subtotal`, `change`
- State persists selama session (tidak perlu localStorage untuk cart)

---

### TASK-3.2 · Kasir Page: Koneksi ke WatermelonDB
**Status**: ✅ Done  
**File target**: `src/app/(dashboard)/kasir/page.tsx`  
**Apa yang dikerjakan**:
- Ganti product catalog hardcoded → query `useProducts()` dari WatermelonDB
- Scan barcode → lookup product dari WatermelonDB by SKU
- Cek expiry: jika semua batch expired → block scan, tampilkan error toast
- Connect cart UI ke Zustand store (`TASK-3.1`)
- Submit payment → write Transaction ke WatermelonDB (bukan ke API langsung)
- Tampilkan offline indicator dari `navigator.onLine`
- Trigger sync setelah berhasil submit (background)

---

### TASK-3.3 · Barang Masuk Page: Koneksi ke API
**Status**: ✅ Done  
**File target**: `src/app/(dashboard)/barang-masuk/page.tsx`  
**Apa yang dikerjakan**:
- Scan barcode → lookup product dari WatermelonDB by SKU
- Jika product belum ada → form create product baru
- Submit form → `POST /api/inbound` (ini butuh koneksi internet, bukan offline)
- Tampilkan loading state + success/error toast
- Setelah berhasil inbound → trigger sync untuk update local WatermelonDB

---

### TASK-3.4 · Inventaris Page: Koneksi ke WatermelonDB
**Status**: ✅ Done  
**File target**: `src/app/(dashboard)/inventaris/page.tsx`  
**Apa yang dikerjakan**:
- Ganti product list hardcoded → query `useProducts()` dengan real-time observe
- Stock qty → dari `inventory_batches` sum per product
- Low stock threshold → dari `Product.reorderPoint`
- Stock opname: physical count input → simpan ke WatermelonDB lokal dulu
- Submit stock opname → `POST /api/inventory/opname` (jika online) atau queue sync
- Variance calculation tetap real-time di client

---

### TASK-3.5 · Kedaluwarsa Page: Koneksi ke WatermelonDB
**Status**: ✅ Done  
**File target**: `src/app/(dashboard)/kedaluwarsa/page.tsx`  
**Apa yang dikerjakan**:
- Ganti batch list hardcoded → query `useInventoryBatches()` observe
- Sort by `expiryDate ASC` (FEFO order)
- Bucket cards (expired/≤7/8-14/15-30/>30) dihitung dari data WatermelonDB
- Block batch → update `is_blocked = true` di WatermelonDB → sync ke server
- Return request → `POST /api/batches/return` jika online

---

### TASK-3.6 · Laporan Page: Koneksi ke API
**Status**: ✅ Done  
**File target**: `src/app/(dashboard)/laporan/page.tsx`  
**Apa yang dikerjakan**:
- KPI cards + line chart → fetch dari `GET /api/reports/profit?from=&to=`
- Ini halaman online-only (laporan butuh server-side FEFO calculation)
- Tampilkan "Data tidak tersedia offline" jika tidak ada koneksi
- Shift reconciliation → `POST /api/reports/shift/close`
- Loading skeleton saat fetch

---

### TASK-3.7 · Authentication Frontend
**Status**: ✅ Done  
**File target**: `src/app/masuk/page.tsx` (update), `src/core/auth/client.ts`  
**Apa yang dikerjakan**:
- `src/core/auth/client.ts`:
  - `getDeviceToken()` — baca JWT dari localStorage
  - `setDeviceToken(token)` — simpan JWT
  - `clearDeviceToken()` — logout, clear localStorage
  - `isAuthenticated()` — cek apakah token ada dan belum expired (tanpa network call)
- Update login page:
  - Kasir login: call `POST /api/auth/pin-verify` → simpan session token
  - Device belum terdaftar: tampilkan form device registration → call `POST /api/auth/register`
  - Redirect ke `/kasir` (kasir), `/inventaris` (manager/admin), `/laporan` (owner) setelah login sukses
- `src/app/page.tsx` — redirect ke `/masuk` jika belum authenticated, ke `/kasir` jika sudah

---

### TASK-3.8 · Root Route & Navigation Guards
**Status**: ✅ Done  
**File target**: `src/app/page.tsx`, `src/middleware.ts` (update)  
**Apa yang dikerjakan**:
- `src/app/page.tsx` → ganti placeholder dengan redirect ke `/masuk`
- Update middleware untuk guard halaman dashboard juga (bukan hanya API)
- Redirect ke `/masuk` jika belum ada session token di cookie/localStorage
- Role-based access: kasir redirect ke `/kasir`, manager ke `/inventaris`

---

## Phase 4 — Hardware & Polish

> Goal: Fitur hardware berfungsi, PWA siap deploy, semua edge case ditangani.

### TASK-4.1 · WebUSB: Thermal Printer ESC/POS
**Status**: ❌ Not started  
**File target**: `src/features/pos/hardware/webusb.ts`, `src/features/pos/hardware/receipt.ts`  
**Apa yang dikerjakan**:
- `requestPrinterDevice()` — `navigator.usb.requestDevice({ filters: [{ classCode: 7 }] })`
- `connectPrinter(device)` — open USB device, select configuration
- `printReceipt(transaction)` — build ESC/POS command buffer:
  - ESC `@` (initialize)
  - Center align, store name
  - Item lines: name + qty + price
  - Separator line
  - Total, payment method, change
  - Cut paper command
- Fallback: jika WebUSB tidak tersedia atau error → gunakan `<iframe>` + `window.print()`
- Hook di `KasirPage`: `usePrinter()` → expose `print(transaction)`, `isConnected`, `connect()`

---

### TASK-4.2 · PWA: Manifest & Offline Pages
**Status**: ⚠️ Partial  
**File target**: `public/manifest.json`, `public/offline.html`  
**Apa yang dikerjakan**:
- Verifikasi `public/manifest.json` ada dan benar:
  - `name: "Kasir POS"`, `short_name: "Kasir"`
  - `theme_color: "#0f6d5f"` (primary color)
  - `background_color: "#ffffff"`
  - `display: "standalone"`
  - Icons di `/public/icons/` (192×192, 512×512)
- Buat `public/offline.html` — fallback page yang ditampilkan service worker jika halaman belum di-cache
- Konfigurasi `next.config.js` untuk `next-pwa` dengan runtime caching strategy

---

### TASK-4.3 · Low Stock Notifications
**Status**: ❌ Not started  
**File target**: `src/features/inventory/notifications.ts`  
**Apa yang dikerjakan**:
- Query products dengan `currentQty <= reorderPoint` dari WatermelonDB
- Tampilkan notifikasi di dashboard sidebar (badge count)
- Gunakan `sonner` toast untuk alert saat pertama kali login
- (Opsional) Web Push notification dengan service worker

---

### TASK-4.4 · Expiry Auto-Block di POS
**Status**: ❌ Not started  
**File target**: `src/features/pos/` (update scan logic)  
**Apa yang dikerjakan**:
- Saat kasir scan produk: cek `inventory_batches` di WatermelonDB
- Jika semua batch `expiryDate < today` atau `is_blocked = true` → tampilkan error dialog "Produk tidak dapat dijual — semua batch kedaluwarsa"
- Jika ada batch expired mix dengan yang masih valid → tampilkan warning tapi izinkan
- FEFO deduction order ditentukan di backend saat sync push, BUKAN di frontend

---

### TASK-4.5 · Anomaly Dashboard
**Status**: ❌ Not started  
**File target**: `src/app/(dashboard)/inventaris/page.tsx` (update)  
**Apa yang dikerjakan**:
- Tampilkan section "Anomali Stok" di halaman inventaris
- Query batches dengan `hasAnomalyFlag = true` dari server via `GET /api/inventory/anomalies`
- Tampilkan produk yang stok-nya negatif akibat offline sync
- Action: "Selesaikan" → admin bisa adjust manual

---

### TASK-4.6 · Tenant & Branch Management
**Status**: ❌ Not started  
**File target**: `src/app/(dashboard)/pengaturan/`, `src/features/tenants/`  
**Apa yang dikerjakan**:
- Halaman pengaturan (hanya accessible oleh Owner/Admin)
- CRUD untuk: Cabang, Kasir (users), Produk master
- Device management: list registered devices, revoke token
- Tenant info: nama toko, alamat, NPWP

---

## Dependency Map

```
TASK-1.1 (DB)
  └── TASK-1.2 (JWT Utils)
        ├── TASK-1.3 (Device Register API)
        ├── TASK-1.4 (PIN Verify API)
        └── TASK-1.5 (Middleware)
              ├── TASK-1.6 (Sync Pull API)
              ├── TASK-1.7 (Sync Push API)
              ├── TASK-1.8 (Products API)
              ├── TASK-1.9 (Inbound API)
              └── TASK-1.10 (Reports API)

TASK-2.1 (WDB Instance)
  └── TASK-2.2 (WDB Schema)
        └── TASK-2.3 (WDB Models)
              ├── TASK-2.4 (Sync Engine)  ← requires TASK-1.6 + TASK-1.7
              └── TASK-2.5 (React Hooks/Provider)

TASK-3.1 (Zustand Store)
  └── TASK-3.2 (Kasir Page)  ← requires TASK-2.5 + TASK-2.4

TASK-2.5 (WDB Hooks) →
  ├── TASK-3.2 (Kasir)
  ├── TASK-3.4 (Inventaris)
  └── TASK-3.5 (Kedaluwarsa)

TASK-1.6 + TASK-1.7 →
  ├── TASK-3.3 (Barang Masuk → API)
  └── TASK-3.6 (Laporan → API)

TASK-1.3 + TASK-1.4 →
  └── TASK-3.7 (Auth Frontend)
        └── TASK-3.8 (Route Guards)
```

---

## Constraint Reminders (CRITICAL)

1. **Multi-tenant**: JANGAN pernah percaya `tenantId`/`branchId` dari request body. SELALU extract dari JWT payload.
2. **POS offline**: KasirPage TIDAK boleh `fetch`/`axios` untuk transactions. Semua write ke WatermelonDB, sync engine yang push ke backend.
3. **FEFO**: Frontend TIDAK menghitung COGS. Frontend hanya kirim `quantity` + `sellingPrice`. Backend Prisma yang deduct batch dan generate `TransactionItemBatch`.
4. **Negative stock**: Backend HARUS allow `currentQty < 0`. Set `hasAnomalyFlag = true` di batch jika terjadi.
5. **Soft delete**: Gunakan `deletedAt` untuk Products dan Branches. TIDAK ada hard `DELETE`.
6. **SSR guard**: Semua WatermelonDB code harus dalam `'use client'` component, dengan `typeof window !== 'undefined'` guard.
7. **Prisma + Edge**: Semua API routes yang pakai Prisma harus `export const runtime = 'nodejs'`.
8. **UUID**: `Transaction.id` di-generate di frontend (`uuid` package sudah terpasang), dikirim ke backend saat sync push. Backend menerima UUID apa adanya (idempotent upsert).
