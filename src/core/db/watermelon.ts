'use client'

import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import schema from './schema'
import { modelClasses } from './models'

// Guard: WatermelonDB is browser-only — adapters must not initialize on SSR
let database: Database | null = null

if (typeof window !== 'undefined') {
  const isDev = process.env.NODE_ENV === 'development'

  const adapter = new LokiJSAdapter({
    schema,
    // Dev: in-memory only (no IndexedDB persistence, faster reloads)
    // Prod: persist to IndexedDB via incremental adapter
    useWebWorker: false,
    useIncrementalIndexedDB: !isDev,
    dbName: 'offline-pos-db',
  })

  database = new Database({
    adapter,
    modelClasses,
  })
}

export { database as watermelonDB }
export default database
