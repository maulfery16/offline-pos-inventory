# Design Document

## Overview
Six targeted fixes across the authentication, UI, security, and data-wiring layers of the offline-pos-inventory application. All changes are client-side or API-route consumers — no new backend routes are created. The dominant language is TypeScript (Next.js App Router + React).

## Architecture

### Auth Guard in Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

The current layout renders `RetailShell` unconditionally on first paint, causing a flash of protected content on unregistered devices. The fix adds a three-state client-side auth check.

**State machine:**
```
hydrating → (isDeviceRegistered() = false) → redirect /masuk
          → (isDeviceRegistered() = true)  → render RetailShell
```

`isDeviceRegistered()` reads `localStorage`, which is unavailable during SSR. The component therefore uses a `useEffect` to check auth after hydration and stores the result in a `authState: 'loading' | 'authorized' | 'redirecting'` local state. During `'loading'`, a centered spinner (consistent with the design system — `Loader2` from lucide-react with `animate-spin`, on `bg-[#f2f4f7]`) is rendered.

```tsx
// Pseudocode — not a code block to be copied verbatim
useEffect(() => {
  if (isDeviceRegistered()) {
    setAuthState('authorized')
  } else {
    setAuthState('redirecting')
    router.replace('/masuk')
  }
}, [])
```

No network call is needed. This prevents FOUC without a skeleton component.

### Signout in RetailShell (`src/shared/layouts/RetailShell.tsx`)

The user footer section in `NavContent` currently shows a hardcoded name/role. A signout popover is added adjacent to the user row. Because `NavContent` is rendered inside both the desktop sidebar and the mobile drawer, both surfaces get the button automatically.

**Two signout modes:**

| Label | Action | Effect |
|---|---|---|
| Keluar sesi | `clearSessionOnly()` | Remove `sessionToken` only; `deviceToken` stays |
| Keluarkan perangkat | `clearAllTokens()` | Remove both tokens; forces device re-registration |

`clearSessionOnly()` is a one-liner added to `src/core/auth/client.ts`:
```ts
export function clearSessionToken(): void {
  if (!isBrowser()) return
  localStorage.removeItem(SESSION_TOKEN_KEY)
}
```

After either action, `router.replace('/masuk')` is called. The signout UI is a small dropdown/popover triggered by a `LogOut` icon button on the right of the user row. It uses a simple local `isOpen` state (no external library needed) and closes on outside click via `useEffect` + `ref`.

### Void-Item PIN Security (`src/app/(dashboard)/kasir/page.tsx`)

The `confirmVoid` function currently checks `voidPin.length >= 4` only. The fix replaces this with an async call to `POST /api/auth/pin-verify`.

The `userId` for the admin who must authorise the void is decoded from the current session token:
```ts
const session = decodeSessionToken<{ userId: string; role: string }>(getSessionToken()!)
```

If no session exists or the role is not `admin`/`owner`, the dialog shows an error immediately without making a network call.

**`confirmVoid` flow:**
1. Set `isVoidVerifying = true`, disable confirm button.
2. Call `POST /api/auth/pin-verify` with `{ userId: session.userId, pin: voidPin }` + `getAuthHeaders()`.
3. On 200 → call `removeFromCart(voidTargetSku)`, close dialog.
4. On non-200 → set `voidError = true`, keep dialog open.
5. Finally → set `isVoidVerifying = false`.

New state: `const [isVoidVerifying, setIsVoidVerifying] = useState(false)`.

### Laporan Page Data Wiring (`src/app/(dashboard)/laporan/page.tsx`)

Replace hardcoded mock arrays with fetch calls inside a `useEffect` keyed on the selected date range.

**API mapping:**

| Section | Endpoint | Params |
|---|---|---|
| Profit trend chart | `GET /api/reports/profit` | `from`, `to` (ISO strings) |
| Branch breakdown table | `GET /api/reports/profit` | `from`, `to`, per-branch aggregation from `items` |
| Top products table | `GET /api/reports/profit` | `from`, `to`, group `items` by `productId` |
| Shift report | `GET /api/reports/shift` | `shiftId` (active shift from state) |

The profit endpoint returns `{ totalRevenue, totalCOGS, grossProfit, grossMarginPct, items[] }`. The chart, branch table, and top-products table are all derived from this single response — one fetch call covers three sections. A `isLoadingReport` boolean drives skeleton placeholders.

### Login Branch Dropdown Wiring (`src/app/masuk/page.tsx`)

Remove the hardcoded `cabangOptions` array. Add a `useEffect` that fires when `deviceToken` is non-null:
```ts
useEffect(() => {
  if (!deviceToken) return
  fetch('/api/branches', { headers: getAuthHeaders() })
    .then(r => r.json())
    .then(j => setCabangOptions(j.data ?? []))
    .catch(() => setCabangOptions([]))
}, [deviceToken])
```
`cabangOptions` becomes `useState<{id: string; name: string}[]>([])`. The dropdown maps `{ value: b.id, label: b.name }`.

### Pending Sync Count Wiring (`src/app/masuk/page.tsx`)

`useSyncManager` does not expose a pending count, and the masuk page does not have access to the WatermelonDB `Database` instance (that lives inside `<DatabaseProvider>` which wraps the dashboard layout, not the login page).

**Approach:** Add a standalone `usePendingSyncCount` hook in `src/core/sync/usePendingSyncCount.ts` that:
1. Reads the database via `useDatabase()` from `@/core/db/hooks`.
2. Queries `transactions` table for records where `syncedAt === null` using WatermelonDB's `Q.where('synced_at', null)`.
3. Returns a reactive count using WatermelonDB's `observe()`.

However, `useDatabase()` requires `<DatabaseProvider>` in the component tree. The masuk page is outside `(dashboard)` layout, so `DatabaseProvider` is not available.

**Resolution:** The masuk page conditionally initialises a read-only WatermelonDB instance directly (same `watermelon.ts` setup), or, more pragmatically, exposes the count through `localStorage` — after each sync in `useSyncManager`, write `localStorage.setItem('pendingSyncCount', count)`. The masuk page reads this value on mount.

**Implementation:** Extend `useSyncManager` to write a `pendingSyncCount` key to localStorage after each sync cycle. Add a `usePendingSyncCount()` helper that reads this key from localStorage and returns it as a number, defaulting to `0`.

## Components and Interfaces

### Modified Files

| File | Change |
|---|---|
| `src/app/(dashboard)/layout.tsx` | Add `authState` state + spinner render during `'loading'`, `router.replace` on `'redirecting'` |
| `src/shared/layouts/RetailShell.tsx` | Add signout popover to `NavContent` user footer; import `clearAllTokens`, `clearSessionToken`, `useRouter` |
| `src/core/auth/client.ts` | Export `clearSessionToken()` (removes `sessionToken` only) |
| `src/app/(dashboard)/kasir/page.tsx` | Replace `confirmVoid` length check with async `POST /api/auth/pin-verify`; add `isVoidVerifying` state |
| `src/app/(dashboard)/laporan/page.tsx` | Replace mock arrays with `useEffect` fetch to `/api/reports/profit` and `/api/reports/shift`; add loading/error states |
| `src/app/masuk/page.tsx` | Replace hardcoded `cabangOptions` with `GET /api/branches` fetch; replace `const pendingSyncCount = 0` with `usePendingSyncCount()` |
| `src/core/sync/useSyncManager.ts` | After each sync cycle, write `localStorage.setItem('pendingSyncCount', String(pendingCount))` |
| `src/core/sync/usePendingSyncCount.ts` | New hook: reads `localStorage.getItem('pendingSyncCount')`, returns parsed number defaulting to `0` |

### New Hook Interface

```ts
// src/core/sync/usePendingSyncCount.ts
export function usePendingSyncCount(): number
// Returns: number of locally-created transactions not yet synced to backend.
// Source: localStorage key 'pendingSyncCount' written by useSyncManager after each sync.
// Default: 0 if key absent or parse fails.
```

### New Auth Utility

```ts
// src/core/auth/client.ts — new export
export function clearSessionToken(): void
// Removes sessionToken from localStorage only. Device registration token is preserved.
```

## Data Models

No new data models. Changes consume existing models:
- `Transaction` (WatermelonDB) — `syncedAt` field used to count pending records.
- `Branch` (Prisma) — consumed from `GET /api/branches` response `{ data: Branch[] }`.
- Profit report response — `{ totalRevenue, totalCOGS, grossProfit, grossMarginPct, items[] }` from existing route.

## Error Handling

- Auth guard: redirect is always via `router.replace` (no history entry left).
- Signout: both actions are synchronous localStorage operations — no error handling needed.
- Void PIN: non-200 sets `voidError` state, error message displayed inline in dialog.
- Laporan fetch: `isErrorReport` state, error text in Indonesian, retry button.
- Branches fetch: empty array fallback, inline warning on dropdown.
- Pending count: defaults to `0` if localStorage key absent.

## Security Considerations

- The `confirmVoid` fix closes a privilege escalation gap where any 4-digit input would allow a cashier to void items. After the fix, an active admin session token is required and the PIN is verified server-side.
- `tenantId` / `branchId` for `POST /api/auth/pin-verify` come from the JWT verified server-side — the client only sends `userId` and `pin` in the body, consistent with PRD §2 multi-tenant constraint.
- `clearAllTokens()` on "Keluarkan perangkat" ensures no stale device token remains after deregistration intent.
