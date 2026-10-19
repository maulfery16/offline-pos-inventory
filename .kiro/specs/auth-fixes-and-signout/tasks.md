# Implementation Plan: Auth Fixes and Signout

## Overview
Nine tasks across auth guard, signout UI, void PIN security, data wiring (laporan, branches, sync count). Tasks 1–3 are foundational and can be done sequentially. Tasks 4–9 are independent of each other after Task 1.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Add clearSessionToken utility — unblocks signout and layout auth guard"
    },
    {
      "wave": 2,
      "tasks": ["2", "3", "4", "5", "6", "7", "9"],
      "description": "Parallel: auth guard, signout UI, void PIN fix, sync hook, branches wiring, laporan wiring"
    },
    {
      "wave": 3,
      "tasks": ["8"],
      "description": "Wire pending count on login page — requires Tasks 5 and 6"
    }
  ]
}
```

## Tasks

- [x] 1. Add `clearSessionToken` export to `src/core/auth/client.ts`
  - Add `export function clearSessionToken()` that removes only `SESSION_TOKEN_KEY` from localStorage
  - Verify `clearAllTokens` still removes both keys (no regression)
  - **File:** `src/core/auth/client.ts`

- [x] 2. Fix auth guard FOUC in dashboard layout
  - Add `authState: 'loading' | 'authorized' | 'redirecting'` state initialised to `'loading'`
  - Add `useEffect` that calls `isDeviceRegistered()`: if true → `'authorized'`, else → `'redirecting'` + `router.replace('/masuk')`
  - Render a centered spinner (`Loader2` from lucide-react with `animate-spin`, full-screen `bg-[#f2f4f7]`) when `authState === 'loading'`
  - Render `null` when `authState === 'redirecting'`
  - Render `<RetailShell ...>` only when `authState === 'authorized'`
  - Import `useRouter` from `next/navigation`, `isDeviceRegistered` from `@/core/auth/client`
  - **File:** `src/app/(dashboard)/layout.tsx`

- [x] 3. Add signout to RetailShell sidebar user footer
  - Add `isSignoutOpen` local state and a `signoutRef` ref for click-outside handling
  - Add a `LogOut` icon button to the right of the user info row in `NavContent`
  - On click: toggle `isSignoutOpen`; show a popover with two options: "Keluar sesi" and "Keluarkan perangkat"
  - "Keluar sesi" handler: call `clearSessionToken()`, then `router.replace('/masuk')`
  - "Keluarkan perangkat" handler: call `clearAllTokens()`, then `router.replace('/masuk')`
  - Add `useEffect` for outside-click close: if click target is not inside `signoutRef`, set `isSignoutOpen = false`
  - Import `LogOut` from lucide-react; import `clearSessionToken`, `clearAllTokens` from `@/core/auth/client`; import `useRouter` from `next/navigation`
  - Apply focus-visible ring styles matching existing sidebar buttons (`focus-visible:outline-2 focus-visible:outline-[#7fe3c9]`)
  - **File:** `src/shared/layouts/RetailShell.tsx`

- [x] 4. Fix void-item PIN security in kasir page
  - Add `isVoidVerifying: boolean` state initialised to `false`
  - Rewrite `confirmVoid` as an `async` function:
    1. Decode session token via `decodeSessionToken<{ userId: string; role: string }>(getSessionToken()!)`; if null, set `voidError = true` and return
    2. Set `isVoidVerifying = true`
    3. `POST /api/auth/pin-verify` with body `{ userId: session.userId, pin: voidPin }` and `getAuthHeaders()`
    4. If response ok → call `removeFromCart(voidTargetSku!)`, close dialog, reset `voidPin`
    5. If response not ok → set `voidError = true`
    6. Finally → set `isVoidVerifying = false`
  - Disable the confirm button when `isVoidVerifying === true`
  - Remove the old `// TODO` comment
  - Import `decodeSessionToken`, `getSessionToken`, `getAuthHeaders` from `@/core/auth/client`
  - **File:** `src/app/(dashboard)/kasir/page.tsx`

- [x] 5. Create `usePendingSyncCount` hook
  - Create `src/core/sync/usePendingSyncCount.ts`
  - Export `usePendingSyncCount(): number` that:
    - Reads `localStorage.getItem('pendingSyncCount')` on mount
    - Listens to `storage` window event to update reactively when `useSyncManager` writes the key
    - Returns `parseInt(value) || 0`
  - **File:** `src/core/sync/usePendingSyncCount.ts` (new file)

- [x] 6. Write pending count to localStorage in `useSyncManager`
  - After `syncDatabase(db)` resolves successfully, query WatermelonDB for `transactions` records where `syncedAt IS NULL` and write the count to `localStorage.setItem('pendingSyncCount', String(count))`
  - Use `db.get<Transaction>('transactions').query(Q.where('synced_at', null)).fetchCount()`
  - Import `Q` from `@nozbe/watermelondb`; import `Transaction` model
  - Also write count on mount (before first sync) so the login page sees a non-stale value immediately
  - **File:** `src/core/sync/useSyncManager.ts`

- [x] 7. Wire branch dropdown on login page
  - Remove the hardcoded `cabangOptions` const array
  - Add `const [cabangOptions, setCabangOptions] = useState<{ value: string; label: string }[]>([])`
  - Add `const [cabangLoading, setCabangLoading] = useState(false)`
  - Add `useEffect` keyed on `deviceToken` state: if null return; else fetch `/api/branches` with `getAuthHeaders()`, map response `data` array to `{ value: b.id, label: b.name }`, call `setCabangOptions`
  - Handle error: `setCabangOptions([])` + set an error state for the dropdown label
  - **File:** `src/app/masuk/page.tsx`

- [x] 8. Wire pending sync count on login page
  - Import `usePendingSyncCount` from `@/core/sync/usePendingSyncCount`
  - Replace `const pendingSyncCount = 0` with `const pendingSyncCount = usePendingSyncCount()`
  - Remove the `// TODO` comment
  - **File:** `src/app/masuk/page.tsx`

- [x] 9. Wire laporan page to live API data
  - Remove all hardcoded mock arrays (`mockData`, branch data, top products data)
  - Add states: `reportData`, `isLoadingReport`, `isErrorReport`, `dateRange` (default last 30 days)
  - Add `useEffect` keyed on `dateRange`: fetch `GET /api/reports/profit?from=&to=` with `getAuthHeaders()`; map response to chart/table data structures
  - Add `useEffect` keyed on `activeShiftId`: fetch `GET /api/reports/shift?shiftId=` with `getAuthHeaders()` when shift ID is known
  - Show skeleton rows (or spinner) in chart + tables while `isLoadingReport`
  - Show Indonesian error message + retry button on `isErrorReport`
  - **File:** `src/app/(dashboard)/laporan/page.tsx`
