# core/sync
WatermelonDB synchronization engine.
- Pull: GET /api/sync?lastPulledAt={timestamp} — returns created/updated/deleted records
- Push: POST /api/sync — client sends locally-created transactions with UUIDs; backend processes with Prisma $transaction and row-level locking
