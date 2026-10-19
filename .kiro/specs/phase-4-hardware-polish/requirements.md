# Requirements Document

## Introduction

Phase 4 adalah fase terakhir dari sistem Offline POS Inventory. Fase ini mencakup integrasi hardware printer termal via WebUSB, konfigurasi PWA (Progressive Web App) untuk penggunaan offline yang andal, notifikasi stok rendah secara real-time, pemblokiran otomatis produk kedaluwarsa di POS, dasbor anomali stok, serta halaman manajemen tenant dan cabang. Setelah Phase 4 selesai, sistem siap digunakan secara penuh di lingkungan produksi toko ritel multi-cabang.

## Glossary

- **POS_System**: Antarmuka kasir (halaman `/kasir`) yang digunakan untuk memproses transaksi penjualan.
- **Printer_Service**: Modul `src/features/pos/hardware/webusb.ts` yang mengelola koneksi WebUSB ke printer termal.
- **Receipt_Builder**: Modul `src/features/pos/hardware/receipt.ts` yang membangun command buffer ESC/POS untuk struk.
- **ESC/POS**: Protokol standar untuk printer termal yang menggunakan byte command sequence.
- **WebUSB_API**: Browser API (`navigator.usb`) untuk komunikasi langsung dengan perangkat USB dari browser.
- **PWA**: Progressive Web App — aplikasi web yang dapat diinstall dan berfungsi offline seperti aplikasi native.
- **Service_Worker**: Script background browser yang mengintersep request jaringan dan mengaktifkan caching offline.
- **WatermelonDB**: Database relasional offline-first yang tersimpan di browser (IndexedDB).
- **Notification_Service**: Modul `src/features/inventory/notifications.ts` yang memproses dan menampilkan peringatan stok.
- **Expiry_Guard**: Logika pengecekan kedaluwarsa batch saat kasir melakukan scan produk.
- **Anomaly_Dashboard**: Bagian halaman inventaris yang menampilkan batch dengan flag anomali stok negatif.
- **Tenant_Manager**: Halaman pengaturan (`/pengaturan`) untuk manajemen cabang, kasir, dan perangkat.
- **JWT_Payload**: Token yang divalidasi server, berisi `tenantId`, `branchId`, `deviceId`, dan `role`.
- **Device_Token**: JWT long-lived yang disimpan di localStorage, mewakili perangkat terdaftar.
- **reorderPoint**: Ambang batas stok minimum sebuah produk; ketika `currentQty <= reorderPoint`, produk dianggap stok rendah.
- **hasAnomalyFlag**: Flag boolean pada `InventoryBatch` yang di-set `true` oleh backend ketika `currentQty` turun di bawah nol.
- **FEFO**: First Expired First Out — strategi deduction batch berdasarkan tanggal kedaluwarsa terdekat.

---

## Requirements

### Requirement 1: WebUSB Thermal Printer Connection

**User Story:** As a cashier, I want to connect a thermal printer via USB so that I can print physical receipts for customers without leaving the browser.

#### Acceptance Criteria

1. WHEN a cashier clicks "Hubungkan Printer" for the first time, THE Printer_Service SHALL call `navigator.usb.requestDevice` with `filters: [{ classCode: 7 }]` to prompt the browser device picker.
2. WHEN a USB printer device is selected by the user, THE Printer_Service SHALL open the device, claim its interface, and store the active connection in module state.
3. WHILE a printer is connected, THE POS_System SHALL display a connected indicator on the kasir page.
4. IF the WebUSB connection attempt fails or throws an error, THEN THE Printer_Service SHALL catch the error and set connection state to disconnected without crashing the application.
5. IF `navigator.usb` is not available in the current browser environment, THEN THE Printer_Service SHALL expose `isSupported = false` so the UI can show the fallback print option.
6. WHEN the printer device is disconnected externally, THE Printer_Service SHALL handle the `disconnect` event from `navigator.usb` and update connection state to disconnected.
7. THE `usePrinter()` React hook SHALL expose `{ isConnected, isSupported, connect, print }` to the POS_System component.

---

### Requirement 2: ESC/POS Receipt Printing

**User Story:** As a cashier, I want the system to print a formatted receipt automatically after a transaction is completed so that customers receive proof of purchase.

#### Acceptance Criteria

1. WHEN a transaction is successfully saved to WatermelonDB, THE POS_System SHALL call `print(transaction)` from the `usePrinter()` hook.
2. WHEN `print(transaction)` is called and a printer is connected, THE Receipt_Builder SHALL construct an ESC/POS command buffer containing: store name centered, transaction date and time, a separator line, each item's name, quantity, and price, a separator line, subtotal, payment method, and change amount.
3. WHEN the ESC/POS buffer is ready, THE Printer_Service SHALL send the buffer to the USB device using the `transferOut` method and append a paper cut command at the end.
4. IF the print transfer fails, THEN THE Printer_Service SHALL display a toast notification with an error message and SHALL NOT roll back the completed transaction.
5. WHERE a printer is not connected or WebUSB is not supported, THE POS_System SHALL offer a fallback print action that renders the receipt in a hidden `<iframe>` and calls `window.print()`.
6. THE Receipt_Builder SHALL format all currency values using Indonesian Rupiah format (e.g., `Rp 15.000`).
7. WHEN a receipt is printed via the fallback iframe method, THE POS_System SHALL remove the `<iframe>` from the DOM after `window.print()` completes.

---

### Requirement 3: PWA Manifest and Installability

**User Story:** As a store admin, I want the POS application to be installable on tablets and smartphones so that cashiers can use it like a native app without needing a browser URL bar.

#### Acceptance Criteria

1. THE PWA SHALL have a valid `public/manifest.json` with `name: "Kasir POS"`, `short_name: "Kasir"`, `display: "standalone"`, `theme_color: "#0f6d5f"`, and `background_color: "#ffffff"`.
2. THE PWA manifest SHALL include icon entries for 192×192 and 512×512 pixel PNG icons located in `/public/icons/`.
3. WHEN a user visits the application on a supported mobile browser, THE PWA SHALL be eligible for the browser's "Add to Home Screen" prompt.
4. THE `next.config.js` SHALL configure `next-pwa` with a runtime caching strategy that caches static assets and API responses for offline use.

---

### Requirement 4: Offline Fallback Page

**User Story:** As a cashier, I want to see a meaningful page when the app is offline and a cached page is unavailable so that I am not confused by a blank browser error screen.

#### Acceptance Criteria

1. THE Service_Worker SHALL intercept navigation requests and serve `public/offline.html` when the requested page is not in the cache and the network is unavailable.
2. THE offline fallback page SHALL display the application name, a message indicating the device is offline, and instructions to check the network connection.
3. WHEN the network connection is restored, THE offline fallback page SHALL automatically redirect the user to the home page within 5 seconds or provide a manual "Coba Lagi" button.

---

### Requirement 5: Low Stock Notifications

**User Story:** As a store manager, I want to be alerted when product stock falls below the reorder point so that I can restock before items run out.

#### Acceptance Criteria

1. WHEN the dashboard application loads, THE Notification_Service SHALL query WatermelonDB for all products where `currentQty <= reorderPoint` within the current branch.
2. WHEN low-stock products are found on first load, THE Notification_Service SHALL display a `sonner` toast listing the count of low-stock items and linking to the inventaris page.
3. WHILE low-stock products exist, THE dashboard sidebar SHALL display a numeric badge on the "Inventaris" navigation item showing the count of low-stock products.
4. WHEN WatermelonDB data is updated via sync, THE Notification_Service SHALL re-evaluate low-stock status and update the sidebar badge count reactively.
5. IF no products are below reorder point, THEN THE Notification_Service SHALL display no badge and SHALL NOT show a toast notification.

---

### Requirement 6: POS Expiry Auto-Block

**User Story:** As a store owner, I want the POS to automatically block the sale of fully expired products so that customers are never sold expired goods.

#### Acceptance Criteria

1. WHEN a barcode is scanned in the POS_System, THE Expiry_Guard SHALL query all `inventory_batches` records for the matching product from WatermelonDB before adding the item to the cart.
2. IF all inventory batches for a scanned product have `expiryDate < today` OR `isBlocked = true`, THEN THE Expiry_Guard SHALL block the item from being added to the cart and SHALL display an error dialog with the message "Produk tidak dapat dijual — semua batch telah kedaluwarsa atau diblokir".
3. IF some but not all inventory batches for a scanned product are expired or blocked, THEN THE Expiry_Guard SHALL add the item to the cart AND display a warning toast indicating that some batches are expired.
4. IF a scanned product has no inventory batches in WatermelonDB, THEN THE Expiry_Guard SHALL block the item and display a warning "Stok tidak ditemukan untuk produk ini".
5. THE Expiry_Guard SHALL use the device's local date (`new Date()`) to evaluate expiry, and SHALL NOT make a network request during the scan check.
6. THE FEFO batch deduction order SHALL remain the responsibility of the backend sync push handler and SHALL NOT be calculated by the Expiry_Guard.

---

### Requirement 7: Anomaly Stock Dashboard

**User Story:** As a store admin, I want to see which products have negative stock anomalies so that I can investigate and manually correct discrepancies caused by offline transactions.

#### Acceptance Criteria

1. WHEN an admin or manager opens the inventaris page, THE Anomaly_Dashboard SHALL fetch a list of batches with `hasAnomalyFlag = true` from `GET /api/inventory/anomalies` using the device JWT for authentication.
2. THE Anomaly_Dashboard SHALL display each anomalous batch showing: product name, SKU, batch number, current quantity (which may be negative), and the date the anomaly was flagged.
3. WHEN an admin clicks "Selesaikan" on an anomaly entry, THE Anomaly_Dashboard SHALL open a modal form for manual quantity adjustment.
4. WHEN the admin submits the adjustment form with a new quantity, THE Anomaly_Dashboard SHALL send a `POST /api/inventory/anomalies/resolve` request with the batch ID and corrected quantity, extracted `tenantId` from the JWT, and SHALL NOT accept `tenantId` from the form body.
5. WHEN an anomaly is successfully resolved, THE Anomaly_Dashboard SHALL remove that entry from the anomaly list and display a success toast.
6. IF the anomaly fetch request fails due to network unavailability, THEN THE Anomaly_Dashboard SHALL display an "Anomali tidak tersedia secara offline" message in the section and SHALL NOT show an error dialog.
7. WHEN a cashier role accesses the inventaris page, THE Anomaly_Dashboard section SHALL NOT be rendered.

---

### Requirement 8: Tenant and Branch Settings

**User Story:** As a store owner, I want a settings page to manage branches, cashiers, and registered devices so that I can control who and what has access to the system.

#### Acceptance Criteria

1. THE Tenant_Manager page at `/pengaturan` SHALL only be accessible to users with `role = 'owner'` or `role = 'admin'` as determined by the JWT_Payload.
2. WHEN a cashier role attempts to navigate to `/pengaturan`, THE system SHALL redirect the user to the `/kasir` page.
3. THE Tenant_Manager SHALL display a list of all branches belonging to the current tenant, showing branch name, address, and active device count.
4. WHEN an admin clicks "Tambah Cabang", THE Tenant_Manager SHALL display a form and on submit call `POST /api/branches` with `tenantId` extracted from the JWT only.
5. THE Tenant_Manager SHALL display a list of cashier users (role = 'cashier') for the current tenant, showing name, assigned branch, and account status.
6. WHEN an admin creates a new cashier, THE Tenant_Manager SHALL call `POST /api/users` with name, PIN (hashed client-side using bcrypt before sending), branch assignment, and `tenantId` from JWT.
7. WHEN an admin deactivates a cashier, THE Tenant_Manager SHALL call `PATCH /api/users/[id]` to set `isActive = false` using a soft-disable approach.
8. THE Tenant_Manager SHALL display a list of registered devices showing device name, registration date, last sync timestamp, and an active/inactive status.
9. WHEN an admin clicks "Cabut Akses" on a device, THE Tenant_Manager SHALL call `DELETE /api/devices/[id]` to revoke the device token, rendering the device's JWT invalid on next API request.
10. THE Tenant_Manager SHALL allow an admin to update the tenant's store name and address via `PATCH /api/tenants/[id]` with `tenantId` from JWT.

---

### Requirement 9: Master Product Management

**User Story:** As a store admin, I want to manage master product data from the settings page so that I can add, edit, or deactivate products without going through the inbound goods flow.

#### Acceptance Criteria

1. THE Tenant_Manager SHALL include a "Produk" tab displaying all master products for the current tenant with name, SKU, unit, selling price, and status.
2. WHEN an admin clicks "Tambah Produk", THE Tenant_Manager SHALL display a form and on submit call `POST /api/products` with `tenantId` extracted from the JWT.
3. WHEN an admin edits a product, THE Tenant_Manager SHALL call `PUT /api/products/[id]` with the updated fields and `tenantId` from JWT.
4. WHEN an admin deactivates a product, THE Tenant_Manager SHALL call `DELETE /api/products/[id]` which sets `deletedAt = now()` (soft delete) and SHALL NOT issue a hard SQL DELETE.
5. WHEN a product is soft-deleted, THE system SHALL include its ID in the `deleted` array of the next sync pull response so WatermelonDB clients remove it from local cache.
