# Implementation Plan: Phase 2 — WatermelonDB Offline Engine

## Overview

Build the complete offline-first data layer using WatermelonDB. App stores all data locally in the browser (IndexedDB in production, LokiJS in dev), syncs with the backend when online, and works fully without internet. Tasks run in dependency order: schema → models → adapter instance → sync engine → React provider + hooks.

## Tasks

- [x] 1. TASK-2.1 · WatermelonDB: Database Instance & Adapter
  - [x] 1.1 Create babel.config.js at project root to enable WatermelonDB decorators
    - Add @babel/plugin-proposal-decorators (legacy mode) and @babel/plugin-proposal-class-properties
    - Add @nozbe/babel-preset-watermelondb preset
    - Required because WatermelonDB model decorators (@field, @date, @children, @relation) need babel transform
    - Install missing babel packages if needed: @babel/plugin-proposal-decorators, @babel/plugin-proposal-class-properties
  - [x] 1.2 Create src/core/db/watermelon.ts with LokiJSAdapter for development and IndexedDBAdapter for production
    - Add 'use client' directive at top
    - Guard entire initialization with typeof window !== 'undefined' check
    - Adapter selection: process.env.NODE_ENV === 'development' uses LokiJSAdapter, else IndexedDBAdapter
    - LokiJSAdapter options: dbName 'offline-pos-db', useWebWorker false, useIncrementalIndexedDB false
    - IndexedDBAdapter options: dbName 'offline-pos-db'
    - Instantiate Database with schema (from schema.ts) and modelClasses (from models/index.ts) and adapter
    - Export singleton watermelonDB instance as default and named export

- [x] 2. TASK-2.2 · WatermelonDB: Schema Definition
  - [x] 2.1 Create src/core/db/schema.ts with appSchema defining all four tables
    - products table columns: tenant_id (string), name (string), sku (string), selling_price (number), unit (string), reorder_point (number), deleted_at (number, isOptional true)
    - inventory_batches table columns: product_id (string), tenant_id (string), branch_id (string), batch_number (string), expiry_date (number), received_date (number), current_qty (number), unit_cost (number), selling_price (number), is_blocked (boolean), has_anomaly_flag (boolean)
    - transactions table columns: branch_id (string), cashier_id (string), payment_method (string), total_amount (number), cash_received (number), status (string), synced_at (number, isOptional true), created_at (number)
    - transaction_items table columns: transaction_id (string), product_id (string), product_name (string), quantity (number), selling_price (number)
    - Use tableSchema and columnSchema imports from @nozbe/watermelondb/Schema
    - Use appSchema with version 1
    - Export schema as default export

- [x] 3. TASK-2.3 · WatermelonDB: Model Classes
  - [x] 3.1 Create src/core/db/models/Product.ts
    - Add 'use client' directive
    - Extend Model from @nozbe/watermelondb
    - static table = 'products'
    - @field('tenant_id') tenantId, @field('name') name, @field('sku') sku, @field('unit') unit
    - @field('selling_price') sellingPrice, @field('reorder_point') reorderPoint (type number)
    - @date('deleted_at') deletedAt (nullable)
    - @children('inventory_batches') batches relation
    - Export default Product
  - [x] 3.2 Create src/core/db/models/InventoryBatch.ts
    - Add 'use client' directive
    - Extend Model from @nozbe/watermelondb
    - static table = 'inventory_batches'
    - @field for: product_id, tenant_id, branch_id, batch_number
    - @date for: expiry_date, received_date
    - @field (number) for: current_qty, unit_cost, selling_price
    - @field (boolean) for: is_blocked, has_anomaly_flag
    - @relation('products', 'product_id') product
    - Export default InventoryBatch
  - [x] 3.3 Create src/core/db/models/Transaction.ts
    - Add 'use client' directive
    - Extend Model from @nozbe/watermelondb
    - static table = 'transactions'
    - @field for: branch_id, cashier_id, payment_method, status
    - @field (number) for: total_amount, cash_received
    - @date for: created_at with @readonly, synced_at (nullable)
    - @children('transaction_items') items relation
    - Export default Transaction
  - [x] 3.4 Create src/core/db/models/TransactionItem.ts
    - Add 'use client' directive
    - Extend Model from @nozbe/watermelondb
    - static table = 'transaction_items'
    - @field for: transaction_id, product_id, product_name
    - @field (number) for: quantity, selling_price
    - @relation('transactions', 'transaction_id') transaction
    - Export default TransactionItem
  - [x] 3.5 Create src/core/db/models/index.ts
    - Re-export all four model classes as named exports
    - Export modelClasses array: [Product, InventoryBatch, Transaction, TransactionItem]

- [x] 4. TASK-2.4 · WatermelonDB: Sync Engine
  - [x] 4.1 Implement syncDatabase(db: Database) in src/core/sync/index.ts
    - Add 'use client' directive
    - Import synchronize from @nozbe/watermelondb/sync
    - pullChanges({ lastPulledAt, schemaVersion, migration }): fetch GET /api/sync?lastPulledAt={timestamp} with Authorization: Bearer header using token from localStorage key 'deviceToken'
    - If response not ok, throw Error with response status text
    - Return { changes: response.changes, timestamp: response.timestamp }
    - pushChanges({ changes, lastPulledAt }): POST /api/sync with body { changes } and same Bearer token header
    - If response not ok, throw Error
    - After successful synchronize() call, store lastPulledAt timestamp in localStorage key 'wmdb_last_pulled_at'
    - Export syncDatabase as named export
  - [x] 4.2 Create src/core/sync/useSyncManager.ts
    - Add 'use client' directive
    - React hook useSyncManager(db: Database)
    - Internal state: isSyncing (boolean), lastSyncAt (Date or null), syncError (string or null)
    - triggerSync(): sets isSyncing true, calls syncDatabase(db), updates lastSyncAt, catches errors and sets syncError, always sets isSyncing false in finally
    - On mount useEffect: call triggerSync() once, then attach window 'online' event listener that calls triggerSync()
    - Interval effect: setInterval every 30000ms, only calls triggerSync if navigator.onLine, clears on unmount
    - Cleanup: remove event listener and clearInterval on unmount
    - Return { isSyncing, lastSyncAt, syncError, triggerSync }
    - Export default useSyncManager

- [x] 5. TASK-2.5 · WatermelonDB: React Provider & Hooks
  - [x] 5.1 Create src/core/db/DatabaseProvider.tsx
    - Add 'use client' directive
    - Create DatabaseContext with React.createContext<Database | null>(null)
    - DatabaseProvider component: accepts { children: React.ReactNode }
    - State: db (Database | null), initialized (boolean)
    - On mount useEffect: dynamically import watermelonDB singleton from ./watermelon, set db state
    - Render: if not initialized, render children anyway (avoid blocking render), pass db through context
    - Export DatabaseProvider as default, DatabaseContext as named export
  - [x] 5.2 Create src/core/db/hooks.ts
    - Add 'use client' directive
    - useDatabase(): useContext(DatabaseContext), throw Error if null
    - useProducts(search?: string): 
      - Get db from useDatabase()
      - State: products Product[], isLoading true initially
      - useEffect: subscribe to db.collections.get<Product>('products').query(...conditions).observe()
      - Conditions: where('deleted_at', null) for non-deleted, plus optional name/sku LIKE search using Q.where and Q.or
      - Update products state on emission, set isLoading false after first emission
      - Unsubscribe on cleanup
      - Return { products, isLoading }
    - useInventoryBatches(productId?: string):
      - Get db from useDatabase()
      - State: batches InventoryBatch[], isLoading true
      - Query inventory_batches collection, optionally filter by product_id if provided
      - Subscribe with observe(), return { batches, isLoading }
    - useActiveTransactions():
      - Returns Transaction[] where synced_at is null (unsynced offline transactions)
      - Return { transactions, isLoading }
    - Export all hooks as named exports
  - [x] 5.3 Update src/app/layout.tsx to wrap children with DatabaseProvider
    - Import DatabaseProvider from @/core/db/DatabaseProvider
    - Wrap children inside body tag: <DatabaseProvider>{children}</DatabaseProvider>
    - Keep existing Toaster component in place (inside or after DatabaseProvider)

## Notes

- CRITICAL: All WatermelonDB files MUST have 'use client' directive — WatermelonDB is browser-only and crashes on SSR
- SSR guard: watermelon.ts must check typeof window !== 'undefined' before initializing adapters
- babel.config.js is REQUIRED — without it, WatermelonDB @field/@date/@children/@relation decorators will not compile
- Execution order matters: schema (2.2) and models (2.3) must exist before adapter (2.1) can import them
- @nozbe/watermelondb 0.27.1 already installed
- uuid 10.0.0 already installed for Transaction ID generation on the frontend
- IndexedDB adapter persists data across browser sessions (production)
- LokiJS adapter is in-memory (development, faster, no persistence between reloads)
- NEVER call fetch/axios directly for POS transactions — write to WatermelonDB only, sync engine pushes to backend
- Phase 3 (Feature Integration) depends on this entire phase being complete

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2"] },
    { "id": 1, "tasks": ["3"] },
    { "id": 2, "tasks": ["1"] },
    { "id": 3, "tasks": ["4"] },
    { "id": 4, "tasks": ["5"] }
  ]
}
```
