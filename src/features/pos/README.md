# features/pos
Point-of-Sale interface.
- Cart: Zustand-backed cart state (transient UI state only)
- Scanner: barcode scanner input handler
- Hardware: WebUSB ESC/POS thermal printer integration with hidden-iframe fallback
- CRITICAL: POS MUST NOT use fetch/axios for transactions. All transaction data is written to WatermelonDB locally; the sync engine pushes to backend in background.
