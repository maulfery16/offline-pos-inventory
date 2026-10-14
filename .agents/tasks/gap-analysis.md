# Gap Analysis: Offline POS Inventory System
*Tanggal analisis: berdasarkan state codebase saat ini*

---

## 1. Status Summary

**Estimasi completion keseluruhan: ~30%**

| Layer | Status | % Done |
|-------|--------|--------|
| Design System & UI Shell | ✅ Selesai | ~90% |
| Login Page | ✅ Selesai | ~85% |
| UI Pages (Placeholder/Demo) | ✅ Selesai | ~80% |
| Database Schema | ✅ Selesai | ~95% |
| Core: Prisma client | ✅ Selesai | ~100% |
| Core: Auth (JWT Guard) | ❌ Belum dimulai | 0% |
| Core: WatermelonDB Sync | ❌ Belum dimulai | 0% |
| Features: POS Logic | ❌ Belum dimulai | 0% |
| Features: Inventory Logic | ❌ Belum dimulai | 0% |
| Features: Tenants | ❌ Belum dimulai | 0% |
| API Routes (Backend) | ❌ Belum dimulai | 0% |
| WatermelonDB (Frontend DB) | ❌ Belum dimulai | 0% |
| WebUSB / Hardware Printing | ❌ Belum dimulai | 0% |
| PWA / Service Worker | ⚠️ Config saja | ~10% |

**Kesimpulan**: Proyek ini memiliki **UI shell yang sangat lengkap dan berkualitas tinggi** dengan semua halaman dashboard menggunakan data hardcoded/mock. Backend, offline engine (WatermelonDB), API routes, dan business logic belum diimplementasikan sama sekali. UI sudah production-ready dari sisi tampilan, tapi sistem belum "nyala" secara fungsional.

---

## 2. Completed — Sudah Selesai dan Berfungsi

### 2.1. Design System & Tailwind Configuration
- **`tailwind.config.ts`**: Design tokens lengkap — primary `#0f6d5f`, accent `#12507f`, success, warning, danger, gray scale, border radius custom (`sm:6px`, `md:10px`, `lg:14px`), spacing 4px scale
- **`src/app/globals.css`**: CSS variables HSL format untuk light/dark mode, shadcn-compatible (`--primary`, `--destructive`, `--border`, dll)
- **`src/shared/styles/tokens.ts`**: TypeScript constants untuk design tokens

### 2.2. Shadcn/UI Base Components (`src/shared/components/ui/`)
File yang sudah ada: `button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `table.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `sonner.tsx`
- Badge dengan 9 variant termasuk custom: `success`, `warning`, `danger`, `info`, `offline`, `neutral`
- Button dengan `primary`, `secondary`, `danger`, `ghost`, `outline`, `link` variants
- `components.json` dikonfigurasi untuk shadcn CLI

### 2.3. Wrapper Components (`src/shared/components/`)
`Button.tsx`, `Badge.tsx`, `Card.tsx`, `Input.tsx`, `Table.tsx`, `Modal.tsx`, `Toast.tsx`, `SearchInput.tsx` — semua adalah re-export dari `ui/` dengan backward-compatible API.

### 2.4. Layout System
- **`RetailShell.tsx`** (`src/shared/layouts/`): Sidebar desktop 248px (dark navy `#101828`), mobile drawer via `<dialog>`, navigation items (Kasir, Barang Masuk, Inventaris, Kedaluwarsa, Laporan), offline badge indicator, active route detection via `usePathname`
- **`PageHeader.tsx`**: Reusable header dengan title, description, breadcrumbs, actions slot
- **`(dashboard)/layout.tsx`**: Client component yang detect `navigator.onLine`, wrap children dengan `RetailShell`

### 2.5. Halaman Dashboard (UI Lengkap — Data Mock)
Semua 5 halaman ini sudah memiliki **UI lengkap yang sangat fungsional** dengan interaksi client-side menggunakan data hardcoded:

**`/kasir` (KasirPage)**:
- Product catalog dengan quick-select cards
- Scanner input dengan autocomplete suggestions
- Cart management (add/update qty/remove)
- Void item dengan PIN admin dialog
- Payment methods (Tunai/QRIS/Kartu) dengan quick cash shortcuts
- Hold & restore transactions
- Receipt dialog
- Online/offline mode indicator (simulasi manual)

**`/barang-masuk` (BarangMasukPage)**:
- Document details form (supplier, invoice, date, warehouse)
- Barcode scan input → auto-populate lines dari catalog
- Per-line editing: qty, HPP/unit, margin, batch number, expiry date
- Auto-calculate selling price dan subtotal HPP
- Status per baris (complete/incomplete/expired warning)
- Cost summary sidebar
- Validation checklist
- Save confirmation dialog

**`/inventaris` (InventarisPage)**:
- KPI cards (inventory value, reorder alerts, expiring batches, variance)
- Filter tabs (Semua/Menipis/Kedaluwarsa/Selisih opname)
- Search by name/SKU
- Table dengan inline physical count input
- Variance calculation (real-time)
- Status badges per item
- Adjust dialog dengan alasan & catatan
- Stock opname session management (start/reset/save)
- Low stock alert sidebar

**`/kedaluwarsa` (KedaluwarsaPage)**:
- Bucket cards per range (expired/≤7/8-14/15-30/>30 hari) dengan nilai HPP
- Bar chart visualisasi sebaran batch
- FEFO table dengan kolom lengkap
- Filter by range + sort (FEFO/latest/value)
- Block/unblock batch dari kasir
- Request retur
- Blocked list sidebar
- Audit log

**`/laporan` (LaporanPage)**:
- KPI cards (sales, COGS, gross profit, margin, avg transaction)
- SVG line chart penjualan vs laba kotor
- Period toggle (today/7 hari/30 hari)
- Branch selector dengan bar chart
- Product contribution table (qty, sales, COGS, profit, margin)
- Shift reconciliation form (input kas fisik, hitung selisih, close shift)
- Shift result dialog

### 2.6. Login Page (`/masuk`)
- Role selector: Kasir (PIN keypad), Admin/Manajer (email+password), Owner
- PIN keypad dengan dot indicators
- Kasir selector dropdown, cabang selector
- Remember device checkbox
- Brand panel dengan feature highlights
- Routing ke `/kasir`, `/inventaris`, atau `/laporan` sesuai role
- Offline simulation toggle

### 2.7. Database Schema (`prisma/schema.prisma`)
Schema lengkap dengan semua model yang diperlukan:
- `Tenant` (multi-tenant base)
- `Branch` (per-tenant)
- `Product` (master data dengan soft delete `deletedAt`)
- `InventoryBatch` (FEFO engine — `expiryDate`, `unitCost`, `currentQty` bisa negatif)
- `Transaction` (ID dari frontend/WatermelonDB UUID)
- `TransactionItem`
- `TransactionItemBatch` (ledger FEFO deduction — accurate COGS)
- Index FEFO: `[tenantId, branchId, productId, expiryDate ASC, receivedDate ASC]`

### 2.8. Prisma Client (`src/core/db/prisma.ts`)
Singleton pattern dengan dev logging, production-safe global instance.

### 2.9. Dependencies
Semua dependencies sudah terpasang:
- `@nozbe/watermelondb: 0.27.1` ✅
- `zustand: 4.5.4` ✅
- `@prisma/client: 5.14.0` ✅
- `jose: 5.2.4`, `jsonwebtoken: 9.0.2` ✅ (JWT)
- `@radix-ui/*` ✅
- `lucide-react` ✅
- `next-pwa: 5.6.0` ✅
- `sonner: 2.0.8` ✅

---

## 3. In Progress / Partial — Ada Tapi Belum Lengkap

### 3.1. `src/app/page.tsx` — Root Route
Hanya menampilkan placeholder "System is initializing..." — seharusnya redirect ke `/masuk` (login page).

### 3.2. `src/core/auth/index.ts`
File ada tapi isinya hanya `export {}` dengan komentar "implementations added in next phase". Belum ada:
- JWT generation/verification (meski `jose` dan `jsonwebtoken` sudah terpasang)
- Device registration logic
- JWT middleware/guard untuk API routes

### 3.3. `src/core/sync/index.ts`
File ada tapi kosong. WatermelonDB sudah terpasang (`0.27.1`) tapi:
- Schema WatermelonDB belum didefinisikan
- Model WatermelonDB (client-side tables) belum ada
- Sync engine (pull/push `GET/POST /api/sync`) belum ada

### 3.4. `src/features/pos/index.ts`, `src/features/inventory/index.ts`, `src/features/tenants/index.ts`
Semua kosong (`export {}`). Zustand store untuk cart belum ada, WebUSB belum ada.

### 3.5. Tailwind `tailwindcss-animate` Plugin
Plugin terpasang sebagai dev dependency tapi **belum ditambahkan ke `tailwind.config.ts`**. Ini perlu untuk shadcn animations (dialog, dropdown, dll).

### 3.6. `src/app/page.tsx`
Root route belum diarahkan ke `/masuk`. User yang mengakses `/` hanya melihat placeholder.

---

## 4. Missing / Not Started — Sama Sekali Belum Ada

### 4.1. API Routes (Backend) — CRITICAL
Tidak ada direktori `src/app/api/`. Semua backend logic belum dibuat:
- `POST /api/auth/device-register` — device registration, issue long-lived JWT
- `POST /api/auth/pin-verify` — verify kasir PIN, return short session token
- `GET /api/sync?lastPulledAt={timestamp}` — pull changes (products, batches)
- `POST /api/sync` — push transactions (dengan Prisma `$transaction` + row-level locking)
- `GET /api/products` — product listing per tenant/branch
- `POST /api/inbound` — receive goods, create InventoryBatch records
- `GET /api/inventory` — stock overview per branch
- `GET /api/reports/profit` — FEFO-accurate COGS & gross profit
- `GET /api/batches/expiring` — batch expiry listing

### 4.2. WatermelonDB Frontend Database — CRITICAL
- `src/core/db/watermelon.ts` — WatermelonDB instance/adapter belum ada
- Model definitions (WatermelonDB schema): Product, InventoryBatch (local), Transaction, TransactionItem belum ada
- `src/core/sync/` — Pull phase dan Push phase engine belum ada

### 4.3. Zustand Store — CRITICAL untuk POS
- `src/features/pos/store.ts` — Cart state, scanner state belum ada
- Pages saat ini menggunakan `useState` lokal, data hilang saat navigate

### 4.4. Authentication Real — CRITICAL
- JWT guard untuk melindungi API routes belum ada
- Device registration flow belum ada
- PIN login sekarang hanya redirect tanpa verifikasi

### 4.5. WebUSB Thermal Printing
- `src/features/pos/hardware/` — WebUSB ESC/POS belum ada
- Fallback `<iframe>` print belum ada
- Struk saat ini hanya dialog simulasi tanpa cetak nyata

### 4.6. WatermelonDB ↔ UI Integration
Semua halaman (`/kasir`, `/barang-masuk`, `/inventaris`, `/kedaluwarsa`, `/laporan`) saat ini menggunakan data hardcoded/mock. Belum ada yang terhubung ke WatermelonDB atau API.

### 4.7. Environment Configuration
- `.env.local` / `.env` belum ada (`DATABASE_URL` diperlukan Prisma)
- `prisma migrate` belum dijalankan (database belum ada)

### 4.8. Tenant & Branch Management UI
- Tidak ada halaman `/settings/` atau `/tenant/` untuk manajemen tenant
- Tech spec menyebut `src/features/tenants/` tapi masih kosong

### 4.9. PWA Manifest & Service Worker
- `next-pwa` terkonfigurasi tapi `public/manifest.json` belum dicek/dibuat secara eksplisit
- Service worker hanya di-generate saat `npm run build`

---

## 5. Prioritized Next Steps

Urutan berdasarkan dependency — item sebelumnya harus selesai sebelum item berikutnya bisa dimulai:

### Phase 1: Foundation Backend (BLOCKER untuk segalanya)

**Step 1 — Environment & Database Setup**
- Buat `.env.local` dengan `DATABASE_URL`
- Jalankan `npx prisma generate` (generate client)
- Jalankan `npx prisma migrate dev` (buat tabel di PostgreSQL)
- Test koneksi dengan `npx prisma studio`

**Step 2 — Authentication Backend** (`src/core/auth/`)
- Implementasi `verifyJWT()` dan `signJWT()` menggunakan `jose`
- Buat `src/app/api/auth/register/route.ts` — device registration, issue long-lived JWT
- Buat middleware `src/middleware.ts` — guard `/api/*` routes kecuali `/api/auth/*`
- **Critical constraint**: Extract `tenantId`/`branchId` dari JWT payload, TIDAK dari request body

**Step 3 — Core API Routes** (`src/app/api/`)
- `GET /api/sync` — Pull: return Products dan InventoryBatches yang berubah sejak `lastPulledAt`
- `POST /api/sync` — Push: proses Transactions dengan Prisma `$transaction` + `SELECT FOR UPDATE`
- FEFO deduction algorithm dalam Push handler (backend kalkulasi `TransactionItemBatch`)
- Negative stock tolerance flag (anomaly detection jika `currentQty < 0`)

### Phase 2: WatermelonDB Frontend Database

**Step 4 — WatermelonDB Setup**
- Buat `src/core/db/watermelon.ts` — SQLiteAdapter + Database instance
- Definisi schema WatermelonDB: tabel `products`, `inventory_batches`, `transactions`, `transaction_items`
- Buat Model classes: `Product`, `InventoryBatch`, `Transaction`, `TransactionItem`
- Lokasi: `src/core/db/models/`

**Step 5 — Sync Engine**
- Implementasi `src/core/sync/index.ts` — `pullChanges()` dan `pushChanges()` functions
- Integrasikan dengan WatermelonDB `synchronize()` function
- Background sync trigger (online event listener, periodic)

### Phase 3: Feature Integration

**Step 6 — Zustand Cart Store**
- `src/features/pos/store.ts` — CartState (items, total, heldTransactions)
- Replace `useState` lokal di `KasirPage` dengan Zustand store
- Memungkinkan state persist saat navigate antar halaman

**Step 7 — Koneksi UI ke WatermelonDB**
Setiap halaman perlu di-update untuk membaca dari WatermelonDB:
- `KasirPage` — products dari WatermelonDB, write transactions ke WatermelonDB
- `BarangMasukPage` — submit creates InventoryBatch di WatermelonDB (→ sync ke server)
- `InventarisPage` — real-time stock dari WatermelonDB queries
- `KedaluwarsaPage` — batch expiry dari WatermelonDB
- `LaporanPage` — query TransactionItemBatch untuk FEFO-accurate COGS (dari server)

**Step 8 — Authentication Frontend**
- Device registration flow di login `/masuk`
- PIN verification via `POST /api/auth/pin-verify`
- JWT storage (localStorage atau IndexedDB)
- Protected routes (redirect ke `/masuk` jika belum authenticated)

### Phase 4: Hardware & Polish

**Step 9 — WebUSB Thermal Printing**
- `src/features/pos/hardware/webusb.ts` — ESC/POS command builder
- `navigator.usb.requestDevice()` untuk printer selection
- Fallback `<iframe>` + `window.print()` jika WebUSB tidak didukung
- Integrasi di `KasirPage` receipt flow

**Step 10 — PWA & Offline Polish**
- Pastikan `public/manifest.json` ada dan benar (app name, icons, theme color)
- Test offline behavior — apakah service worker cache pages dengan benar
- IndexedDB persistence untuk WatermelonDB di production
- Push notification untuk low stock alerts (opsional)

**Step 11 — Root Route & Navigation Guards**
- `src/app/page.tsx` → redirect ke `/masuk`
- Implementasi proper auth guard middleware
- Role-based access (kasir hanya bisa akses `/kasir`, owner bisa semua)

**Step 12 — Tenant/Branch Management (Nice-to-have)**
- `src/app/(dashboard)/pengaturan/` — settings page
- `src/features/tenants/` — tenant/branch CRUD API
- User management untuk kasir/admin/owner accounts

---

## 6. Dependencies & Risks

### 6.1. Database Tersedia
**Risk**: Belum ada PostgreSQL instance. `DATABASE_URL` belum dikonfigurasi.
**Action**: Setup PostgreSQL (local dengan Docker, atau managed service seperti Neon/Supabase) sebelum apapun yang menyentuh backend.

### 6.2. WatermelonDB Web Adapter
**Risk**: WatermelonDB untuk web menggunakan `LokiJSAdapter` (in-memory, tidak persist) atau `IndexedDBAdapter`. Di Next.js App Router, ada potensi SSR conflict karena WatermelonDB hanya bisa berjalan di browser.
**Action**: Pastikan semua WatermelonDB code ada di dalam `'use client'` components, dan inisialisasi dengan `typeof window !== 'undefined'` guard.

### 6.3. Prisma di Next.js Edge Runtime
**Risk**: `next-pwa` dan beberapa Next.js features menggunakan Edge runtime; Prisma tidak kompatibel dengan Edge runtime.
**Action**: Semua API routes yang menggunakan Prisma harus menggunakan Node.js runtime, bukan Edge. Tambahkan `export const runtime = 'nodejs'` di setiap API route.

### 6.4. UUID di Frontend vs Backend
**Risk**: Tech spec mengharuskan UUID untuk `Transaction.id` di-generate di frontend (WatermelonDB). `uuid` package sudah terpasang (`10.0.0`). Pastikan format UUID v4 yang digunakan konsisten di `schema.prisma` (`@db.Uuid`).

### 6.5. `tailwindcss-animate` Missing dari Config
**Risk**: Plugin sudah terpasang di `devDependencies` tapi belum ditambahkan ke `tailwind.config.ts`. Shadcn components yang menggunakan animasi (dialog, dropdown) mungkin tidak beranimasi.
**Action**: Tambahkan `require('tailwindcss-animate')` ke array `plugins` di `tailwind.config.ts`.

### 6.6. FEFO Algorithm Complexity
**Risk**: Push sync handler harus atomically deduct dari multiple InventoryBatch dalam urutan FEFO, handle partial deduction lintas batch, dan menangani race conditions saat multi-device sync.
**Action**: Implementasikan sebagai Prisma `$transaction` dengan `SELECT ... FOR UPDATE` per product per branch. Test dengan scenario concurrent push dari 2 device.

### 6.7. Offline Conflict Resolution
**Risk**: Jika 2 kasir offline menjual barang yang sama dan keduanya sync bersamaan, bisa terjadi oversell (stock negatif). Tech spec memperbolehkan ini dengan anomaly flag.
**Action**: Backend HARUS allow `currentQty < 0` dan generate AnomalyLog entry. Tampilkan warning di `/inventaris` jika ada anomali.

### 6.8. `pos/page.tsx` vs `kasir/page.tsx` Naming
**Risk**: Review sebelumnya menemukan inconsistency — ada `src/app/(dashboard)/pos/page.tsx` (placeholder dengan PageHeader saja) dan `src/app/(dashboard)/kasir/page.tsx` (implementasi penuh).
**Action**: Hapus `/pos/page.tsx` yang redundant, atau redirect ke `/kasir`. RetailShell navigation sudah benar menunjuk ke `/kasir`.

### 6.9. No Test Framework
**Risk**: Tidak ada Jest/Vitest terpasang. FEFO algorithm dan sync logic adalah area berisiko tinggi tanpa test coverage.
**Action**: Pasang Vitest + React Testing Library sebelum atau bersamaan dengan Phase 1-2. FEFO deduction dan sync conflict resolution wajib punya unit tests.

### 6.10. Halaman Pages sebagai 'use client'
**Observation**: Semua halaman dashboard (`kasir`, `barang-masuk`, `inventaris`, `kedaluwarsa`, `laporan`) menggunakan `'use client'` directive karena menggunakan `useState`. Setelah WatermelonDB diintegrasikan, pattern idealnya adalah server component untuk initial data fetch + client component untuk interactivity. Namun untuk offline-first dengan WatermelonDB (yang hanya bisa di browser), `'use client'` memang diperlukan — ini sudah benar.
