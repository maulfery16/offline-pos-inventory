# shared/utils
Shared utility functions.
- currency.ts: formatIDR / parseIDR — Indonesian Rupiah formatting
- date.ts: formatDate, formatDateTime, formatRelative, isExpired, isNearExpiry — date-fns wrappers with id locale
- env.ts: Server-side environment variable validator — import directly, NOT via index.ts barrel (avoids client-side bundle issues)
