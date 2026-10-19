# Design Document

## Overview

Phase 4 melengkapi sistem POS multi-tenant dengan lapisan hardware dan polish akhir. Fase ini menambahkan tujuh kelompok kapabilitas di atas tiga fase sebelumnya yang telah selesai:

1. **WebUSB Thermal Printer** — koneksi langsung ke printer ESC/POS dari browser tanpa dialog cetak.
2. **ESC/POS Receipt Builder** — buffer perintah terformat untuk struk fisik, plus fallback iframe.
3. **PWA Manifest & Offline Page** — konfigurasi installability dan halaman fallback service worker.
4. **Low-Stock Notifications** — badge sidebar + toast berdasarkan data WatermelonDB reaktif.
5. **POS Expiry Auto-Block** — guard scan produk menggunakan batch lokal tanpa network request.
6. **Anomaly Stock Dashboard** — tampilkan dan selesaikan batch stok negatif via API.
7. **Tenant & Branch Settings** — halaman `/pengaturan` CRUD cabang, kasir, perangkat, dan produk.

Semua komponen baru mengikuti constraint teknis yang sudah ditetapkan: `tenantId`/`branchId` hanya dari JWT, transaksi POS hanya tulis ke WatermelonDB, FEFO tetap di backend.

---

## Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Client)                                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React / Next.js App Router (App Shell)                      │  │
│  │                                                              │  │
│  │  /kasir          /inventaris       /pengaturan              │  │
│  │  ├ Expiry Guard  ├ Anomaly Section  ├ Branch CRUD            │  │
│  │  └ usePrinter()  └ Low-Stock Badge  ├ Cashier CRUD           │  │
│  │                                    ├ Device Mgmt             │  │
│  │                                    └ Product Master          │  │
│  │                                                              │  │
│  │  ┌───────────────────────────────────────────────────────┐  │  │
│  │  │  Feature Modules (src/features/)                      │  │  │
│  │  │  pos/hardware/webusb.ts   → WebUSB + ESC/POS          │  │  │
│  │  │  pos/hardware/receipt.ts  → Receipt buffer builder    │  │  │
│  │  │  pos/hooks/usePrinter.ts  → React hook facade         │  │  │
│  │  │  inventory/notifications.ts → Low-stock query         │  │  │
│  │  │  inventory/expiryGuard.ts → Batch expiry check        │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │  Core Layer                                          │   │  │
│  │  │  WatermelonDB (IndexedDB) ←→ Sync Engine ←→ /api   │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  WebUSB API ──→ Thermal Printer (ESC/POS)                          │
│  Service Worker ──→ Cache / Offline Fallback                       │
└─────────────────────────────────────────────────────────────────────┘
                            │ HTTPS (JWT Bearer)
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js API Routes (Node.js runtime)                               │
│  /api/inventory/anomalies  GET  → list hasAnomalyFlag=true batches  │
│  /api/inventory/anomalies/resolve  POST  → manual qty adjustment    │
│  /api/branches             POST  → create branch                    │
│  /api/users                POST/PATCH  → create/disable cashier     │
│  /api/devices/[id]         DELETE  → revoke device token            │
│  /api/products             POST/PUT/DELETE → product master CRUD    │
│  /api/tenants/[id]         PATCH  → update store name/address       │
└─────────────────────────────────────────────────────────────────────┘
                            │ Prisma ORM
┌─────────────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                         │
│  InventoryBatch(hasAnomalyFlag, isBlocked, expiryDate, currentQty)  │
│  Branch / User / Device / Product / Tenant                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Expiry Guard (Offline-First)

```
Cashier scans barcode
        │
        ▼
expiryGuard.checkProduct(sku, db)
        │
        ├─ query inventory_batches WHERE product_id = productId
        │                                    (WatermelonDB — no network)
        │
        ├─ no batches found → BLOCK + "Stok tidak ditemukan"
        │
        ├─ all batches expired or isBlocked → BLOCK + error dialog
        │
        └─ some expired → ALLOW + warning toast → addItem(cart)
```

### Data Flow: WebUSB Print

```
processPayment() → write to WatermelonDB
        │
        ▼
print(transaction)   [usePrinter hook]
        │
        ├─ isConnected=true → Receipt_Builder.build(transaction) → Uint8Array
        │         └─ Printer_Service.send(buffer) via transferOut
        │
        └─ isConnected=false / !isSupported → iframe fallback → window.print()
```

---

## Components and Interfaces

### 1. `src/features/pos/hardware/webusb.ts`

Modul singleton yang mengelola koneksi WebUSB ke printer termal.

```typescript
export interface PrinterState {
  isConnected: boolean
  isSupported: boolean
  device: USBDevice | null
}

// Singleton state (module-level, tidak perlu Zustand)
let printerState: PrinterState = {
  isConnected: false,
  isSupported: typeof navigator !== 'undefined' && 'usb' in navigator,
  device: null,
}

export async function requestPrinterDevice(): Promise<USBDevice>
// Calls navigator.usb.requestDevice({ filters: [{ classCode: 7 }] })

export async function connectPrinter(device: USBDevice): Promise<void>
// device.open() → device.selectConfiguration(1) → device.claimInterface(0)
// Registers 'disconnect' event handler on navigator.usb

export function disconnectPrinter(): void
// Releases interface, closes device, resets state

export async function sendBuffer(buffer: Uint8Array): Promise<void>
// Finds bulk-out endpoint → device.transferOut(endpointNumber, buffer)
// Throws if not connected

export function getPrinterState(): PrinterState
// Returns current state snapshot (for hook polling)
```

**Endpoint detection**: Iterates `device.configuration.interfaces[0].alternate.endpoints` untuk menemukan endpoint dengan `direction === 'out'` dan `type === 'bulk'`.

**Disconnect handler**: `navigator.usb.addEventListener('disconnect', (event) => { if (event.device === state.device) disconnectPrinter() })`

### 2. `src/features/pos/hardware/receipt.ts`

Builder untuk command buffer ESC/POS. Semua method mengembalikan `Uint8Array` yang dapat digabung.

```typescript
export interface ReceiptData {
  storeName: string
  branchName: string
  receiptRef: string
  transactionDate: Date
  items: Array<{
    name: string
    quantity: number
    sellingPrice: number
  }>
  subtotal: number
  paymentMethod: string
  cashReceived: number
  change: number
}

export function buildReceipt(data: ReceiptData): Uint8Array
```

**ESC/POS command sequence (dalam urutan)**:

| Command | Bytes | Fungsi |
|---|---|---|
| ESC `@` | `0x1B 0x40` | Initialize printer |
| ESC `a` 1 | `0x1B 0x61 0x01` | Center align |
| Text + LF | UTF-8 bytes + `0x0A` | Store name |
| ESC `a` 0 | `0x1B 0x61 0x00` | Left align |
| Text + LF | — | Date, ref number |
| `-` × 32 + LF | — | Separator |
| Per-item: name + tab + qty + × + price | — | Item lines |
| `-` × 32 + LF | — | Separator |
| `Subtotal:` + price | — | Subtotal |
| Payment method line | — | Metode bayar |
| `Kembalian:` + change | — | Kembalian |
| LF × 3 | `0x0A 0x0A 0x0A` | Paper feed |
| GS `V` 66 3 | `0x1D 0x56 0x42 0x03` | Partial cut |

**Format currency**: `Rp ${value.toLocaleString('id-ID')}` (tanpa desimal untuk nilai bulat).

### 3. `src/features/pos/hooks/usePrinter.ts`

React hook sebagai facade atas webusb.ts.

```typescript
export interface UsePrinterReturn {
  isConnected: boolean
  isSupported: boolean
  connect: () => Promise<void>
  print: (data: ReceiptData) => Promise<void>
}

export function usePrinter(): UsePrinterReturn
```

- State disimpan lokal di hook menggunakan `useState` yang disinkronkan ke module state `webusb.ts`.
- `connect()` memanggil `requestPrinterDevice()` lalu `connectPrinter(device)` dan memperbarui state lokal.
- `print(data)` jika `isConnected`: build buffer lalu `sendBuffer()`. Jika gagal atau tidak connected: render iframe fallback.
- Fallback iframe: buat `<iframe>` tersembunyi, set `srcdoc` ke HTML receipt, call `contentWindow.print()`, hapus iframe dari DOM dalam `onload` handler.

### 4. `src/features/inventory/notifications.ts`

Modul untuk menghitung dan mengekspos low-stock state.

```typescript
export interface LowStockSummary {
  count: number
  productNames: string[]  // max 3 untuk toast preview
}

export async function getLowStockSummary(
  db: Database,
  branchId: string
): Promise<LowStockSummary>
// Query: products JOIN inventory_batches WHERE currentQty <= reorderPoint
// WatermelonDB: products.query() lalu filter di memory (reorderPoint dari product)
```

**React integration**: Hook `useLowStockBadge()` di `src/features/inventory/hooks/useLowStockBadge.ts` menggunakan `useEffect` dengan WatermelonDB observable untuk update reaktif saat sync selesai.

```typescript
export function useLowStockBadge(): { count: number }
```

Badge count diexpose ke sidebar via context atau prop drilling dari layout.

### 5. `src/features/inventory/expiryGuard.ts`

Pure function untuk pengecekan expiry sebelum item masuk cart.

```typescript
export type ExpiryCheckResult =
  | { status: 'ok' }
  | { status: 'warning'; message: string }
  | { status: 'blocked'; message: string }

export async function checkProductExpiry(
  productId: string,
  db: Database
): Promise<ExpiryCheckResult>
```

**Logika**:
1. Query `inventory_batches WHERE product_id = productId` dari WatermelonDB.
2. Jika hasilnya kosong → `{ status: 'blocked', message: 'Stok tidak ditemukan untuk produk ini' }`.
3. Filter batch: `expiryDate < new Date()` atau `isBlocked === true` → expired.
4. Jika semua batch expired → `{ status: 'blocked', message: 'Produk tidak dapat dijual — semua batch telah kedaluwarsa atau diblokir' }`.
5. Jika sebagian batch expired → `{ status: 'warning', message: 'Beberapa batch telah kedaluwarsa. FEFO otomatis diterapkan.' }`.
6. Sinon → `{ status: 'ok' }`.

**Constraint**: Tidak ada network request. `new Date()` digunakan langsung.

### 6. Anomaly Dashboard Section (`src/app/(dashboard)/inventaris/page.tsx` — update)

Ditambahkan sebagai section terpisah di bawah tabel inventaris utama. Hanya dirender jika `role !== 'cashier'`.

```typescript
// Component baru: src/features/inventory/AnomalySection.tsx
interface AnomalyBatch {
  id: string
  productName: string
  sku: string
  batchNumber: string
  currentQty: number   // bisa negatif
  flaggedAt: string    // ISO date string
}
```

**API calls**:
- `GET /api/inventory/anomalies` — menggunakan device JWT dari localStorage.
- `POST /api/inventory/anomalies/resolve` — body `{ batchId, correctedQty }`. `tenantId` diextract backend dari JWT.

### 7. Tenant Manager (`src/app/(dashboard)/pengaturan/`)

Halaman baru dengan tab navigation: Cabang | Kasir | Perangkat | Produk | Info Toko.

```
/pengaturan/page.tsx           → tab shell + role guard
/pengaturan/tabs/BranchTab.tsx → CRUD cabang
/pengaturan/tabs/CashierTab.tsx → CRUD kasir
/pengaturan/tabs/DeviceTab.tsx  → device list + revoke
/pengaturan/tabs/ProductTab.tsx → product master CRUD
/pengaturan/tabs/StoreTab.tsx   → tenant name/address
```

**Role guard**: Di `page.tsx`, baca role dari decoded JWT (`src/core/auth/client.ts`). Jika `role === 'cashier'` → `router.replace('/kasir')`.

### 8. New API Routes

| Method | Path | Handler file | Fungsi |
|---|---|---|---|
| GET | `/api/inventory/anomalies` | `src/app/api/inventory/anomalies/route.ts` | List batches hasAnomalyFlag=true |
| POST | `/api/inventory/anomalies/resolve` | `src/app/api/inventory/anomalies/resolve/route.ts` | Update currentQty, clear flag |
| POST | `/api/branches` | `src/app/api/branches/route.ts` | Create branch |
| POST | `/api/users` | `src/app/api/users/route.ts` | Create cashier user |
| PATCH | `/api/users/[id]` | `src/app/api/users/[id]/route.ts` | Deactivate cashier (soft) |
| DELETE | `/api/devices/[id]` | `src/app/api/devices/[id]/route.ts` | Revoke device (isRevoked=true) |
| PATCH | `/api/tenants/[id]` | `src/app/api/tenants/[id]/route.ts` | Update store name/address |

Semua route menggunakan `export const runtime = 'nodejs'` dan mengambil `tenantId` dari header yang diinject middleware (`x-tenant-id`).

---

## Data Models

### WatermelonDB (Frontend — sudah ada, tidak berubah)

Schema yang ada sudah mencakup semua kolom yang dibutuhkan Phase 4:
- `inventory_batches.has_anomaly_flag` (boolean)
- `inventory_batches.is_blocked` (boolean)
- `inventory_batches.expiry_date` (number/timestamp)
- `inventory_batches.current_qty` (number, bisa negatif)
- `products.reorder_point` (number)

Tidak ada perubahan schema WatermelonDB.

### PostgreSQL via Prisma (sudah ada, tidak berubah)

Schema Prisma sudah lengkap mencakup:
- `InventoryBatch.hasAnomalyFlag`, `isBlocked`, `expiryDate`, `currentQty`
- `Branch`, `User` (dengan `isActive`), `Device` (dengan `isRevoked`), `Tenant`

Tidak ada migrasi Prisma baru yang dibutuhkan.

### PWA: `public/manifest.json`

```json
{
  "name": "Kasir POS",
  "short_name": "Kasir",
  "description": "Sistem POS offline-first multi-cabang",
  "start_url": "/kasir",
  "display": "standalone",
  "theme_color": "#0f6d5f",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### `public/offline.html`

Static HTML dengan meta refresh dan tombol manual. Tidak menggunakan Next.js — harus standalone HTML untuk dapat diserve service worker tanpa bundler.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Expiry guard blocks fully-expired products

*For any* product where all inventory batches have `expiryDate < now` or `isBlocked = true`, calling `checkProductExpiry` SHALL return `status: 'blocked'`, never `status: 'ok'` or `status: 'warning'`.

**Validates: Requirements 6.2**

### Property 2: Expiry guard allows products with at least one valid batch

*For any* product where at least one batch has `expiryDate >= now` AND `isBlocked = false`, calling `checkProductExpiry` SHALL return either `status: 'ok'` or `status: 'warning'`, never `status: 'blocked'`.

**Validates: Requirements 6.3**

### Property 3: Expiry guard blocks products with no batches

*For any* product ID that has zero matching records in `inventory_batches`, calling `checkProductExpiry` SHALL return `status: 'blocked'`.

**Validates: Requirements 6.4**

### Property 4: Receipt builder includes all required fields

*For any* valid `ReceiptData` input, the output of `buildReceipt` decoded as Latin-1/UTF-8 SHALL contain the store name, each item name, each item quantity, subtotal value, payment method string, and change amount.

**Validates: Requirements 2.2, 2.6**

### Property 5: Receipt currency format is Indonesian Rupiah

*For any* non-negative numeric amount passed through the currency formatter in `receipt.ts`, the resulting string SHALL start with `"Rp"` and the numeric part SHALL match the Indonesian locale format (period as thousands separator, no decimal for whole numbers).

**Validates: Requirements 2.6**

### Property 6: Low-stock query is monotone with threshold

*For any* set of products in WatermelonDB, the count returned by `getLowStockSummary` SHALL be less than or equal to the total product count, and SHALL equal the count of products where `currentQty <= reorderPoint`.

**Validates: Requirements 5.1, 5.3**

---

## Error Handling

### WebUSB Errors

| Scenario | Handling |
|---|---|
| `navigator.usb` undefined (non-Chrome/Edge) | `isSupported = false`; UI hides connect button, shows fallback print only |
| User cancels device picker | `DOMException: NotFoundError` caught silently; state remains disconnected |
| `claimInterface` fails (device in use) | Catch error; show toast "Printer sedang digunakan oleh aplikasi lain" |
| `transferOut` fails (print error) | Catch error; show toast "Gagal mencetak — coba lagi"; do NOT roll back transaction |
| Device disconnected mid-session | `disconnect` event handler calls `disconnectPrinter()`; UI updates indicator |

### Expiry Guard Errors

| Scenario | Handling |
|---|---|
| WatermelonDB query fails | Catch → treat as `status: 'blocked'` (fail-safe, prevent sale) |
| `expiryDate` is null/undefined on batch | Treat batch as non-expired (batch without expiry = non-perishable) |

### Anomaly API Errors

| Scenario | Handling |
|---|---|
| Network unavailable (GET anomalies) | Display "Anomali tidak tersedia secara offline" in section placeholder |
| POST resolve returns non-200 | Show error toast "Gagal menyelesaikan anomali"; keep entry in list |
| 401 Unauthorized | Redirect to `/masuk` via middleware (existing behavior) |

### Low-Stock Notification Errors

| Scenario | Handling |
|---|---|
| WatermelonDB not initialized | Return `count: 0`; no badge, no toast |
| `useProducts` returns empty list | Return `count: 0` (not an error, just no products) |

### Tenant Manager Errors

| Scenario | Handling |
|---|---|
| POST /api/branches fails validation | Show field-level error from API response |
| PIN is empty on cashier create | Client-side validation before submit |
| Device revoke fails | Show error toast; keep device in list |
| Role is cashier accessing `/pengaturan` | `router.replace('/kasir')` before page renders |

---

## Testing Strategy

Phase 4 terdiri dari kombinasi logika bisnis murni (expiry guard, receipt builder, currency formatter) dan UI/integrasi (WebUSB, API routes, anomaly dashboard). Strategi testing dibagi sesuai jenis komponen.

### Unit Tests (Vitest)

Fokus pada module yang bisa ditest tanpa DOM dan tanpa network:

- **`expiryGuard.ts`**: Test semua cabang — no batches, all blocked, all expired, mix, all valid. Mock `Database` dengan factory data.
- **`receipt.ts`**: Test `buildReceipt` dengan berbagai `ReceiptData`. Assert buffer berisi byte ESC `@`, store name bytes, item count, cut command. Test `formatRupiah` untuk edge cases (0, nilai bulat, nilai besar).
- **`notifications.ts`**: Test `getLowStockSummary` dengan mock WatermelonDB collection. Assert count dan productNames correct untuk berbagai kombinasi qty vs reorderPoint.

### Property-Based Tests (fast-check)

Digunakan untuk `expiryGuard.ts` dan `receipt.ts` yang memiliki logika universal dan input space besar:

- **Property 1–3**: Generate arbitrary arrays of `InventoryBatch` objects dengan kombinasi `expiryDate` dan `isBlocked`. Verify guard result sesuai komposisi batch.
  - Tag: `Feature: phase-4-hardware-polish, Property 1-3: expiry guard classification`
  - Min 100 iterations per property.

- **Property 4–5**: Generate arbitrary `ReceiptData` (random items, amounts, payment methods). Verify output buffer berisi semua required strings dan format Rupiah valid.
  - Tag: `Feature: phase-4-hardware-polish, Property 4-5: receipt builder completeness`
  - Min 100 iterations per property.

- **Property 6**: Generate arbitrary array of `{ currentQty, reorderPoint }` pairs. Verify count returned matches manual filter.
  - Tag: `Feature: phase-4-hardware-polish, Property 6: low-stock count correctness`
  - Min 100 iterations.

### Integration Tests

- **`/api/inventory/anomalies` (GET)**: Test dengan mock Prisma — assert only `hasAnomalyFlag=true` batches returned, filtered by `tenantId` dari JWT (tidak dari query param).
- **`/api/inventory/anomalies/resolve` (POST)**: Assert `tenantId` dari JWT digunakan, bukan dari body. Assert batch `currentQty` di-update, `hasAnomalyFlag` di-set false.
- **`/api/branches` (POST)**, **`/api/users` (POST/PATCH)**, **`/api/devices/[id]` (DELETE)**: Test happy path dan 401 jika JWT missing.
- **`/api/products` soft-delete**: Assert `deletedAt` set dan record muncul di deleted array sync response berikutnya.

### E2E / Manual Checks

- **WebUSB**: Harus ditest secara manual dengan printer fisik (WebUSB tidak bisa di-mock di Jest/Vitest karena browser API). Dokumen test case: connect → print → disconnect → reconnect.
- **PWA installability**: Verify via Chrome DevTools Application → Manifest. Check Lighthouse PWA audit.
- **Offline fallback page**: Buka DevTools → Network → Offline → navigate ke halaman baru. Verify `offline.html` ditampilkan.
- **Service worker caching**: Audit cache storage via DevTools Application → Cache Storage.
