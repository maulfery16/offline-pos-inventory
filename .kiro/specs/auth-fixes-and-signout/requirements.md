# Requirements Document

## Introduction
Fix authentication flash of unauthenticated content (FOUC) in the dashboard layout, add a dual-mode signout mechanism to RetailShell, fix the security gap in void-item PIN verification, wire live data to the laporan page, wire the branch dropdown on the login page, and expose a real pending sync count on the login page.

## Requirements

### 1. Auth Guard in Dashboard Layout

#### 1.1
WHEN a user navigates to any dashboard route (e.g., `/kasir`, `/inventaris`) AND the browser has not yet confirmed whether `deviceToken` exists in localStorage, THEN the layout SHALL render a centered full-page spinner instead of the RetailShell content.

#### 1.2
WHEN auth state is resolved AND no `deviceToken` is present in localStorage, THEN the layout SHALL redirect the user to `/masuk` and SHALL NOT render any dashboard content.

#### 1.3
WHEN auth state is resolved AND a valid `deviceToken` is present, THEN the layout SHALL render the RetailShell with its children as normal, without delay or flash.

#### 1.4
The auth check SHALL be performed client-side using `isDeviceRegistered()` from `src/core/auth/client.ts`. The layout SHALL NOT make any network request for this check.

### 2. Signout Mechanism in RetailShell

#### 2.1
WHEN a user is viewing any dashboard page, THEN the sidebar user footer section in `RetailShell.tsx` SHALL display two signout options accessible via a button or dropdown adjacent to the user info row.

#### 2.2
WHEN a user selects "Keluar sesi" (session signout), THEN the system SHALL call `clearAllTokens()` minus `deviceToken` — i.e., clear only the `sessionToken` from localStorage — and SHALL redirect to `/masuk`.

#### 2.3
WHEN a user selects "Keluarkan perangkat" (device deregistration), THEN the system SHALL call `clearAllTokens()` (clears both `sessionToken` and `deviceToken`) and SHALL redirect to `/masuk`.

#### 2.4
The signout options SHALL be rendered in both the desktop sidebar and the mobile drawer, because both use the shared `NavContent` component.

#### 2.5
The signout UI SHALL be accessible via keyboard and SHALL have visible focus styles consistent with the rest of the sidebar.

### 3. Void-Item PIN Security in Kasir Page

#### 3.1
WHEN a cashier attempts to void a cart item, THEN the system SHALL verify the entered PIN by calling `POST /api/auth/pin-verify` with `{ userId, pin }` before allowing the void to proceed.

#### 3.2
The `userId` sent to `POST /api/auth/pin-verify` SHALL be derived from the decoded session token using `decodeSessionToken()` from `src/core/auth/client.ts`. If no session token is present, the system SHALL show an error and block the void.

#### 3.3
WHEN the `POST /api/auth/pin-verify` call returns HTTP 200, THEN the void SHALL proceed (item removed from cart). WHEN the call returns a non-200 status, THEN the system SHALL display an inline error and block the void.

#### 3.4
WHILE the PIN verification request is in flight, the confirm button in the void dialog SHALL be disabled to prevent double submission.

#### 3.5
The Authorization header for the `POST /api/auth/pin-verify` request SHALL use `getAuthHeaders()` from `src/core/auth/client.ts`.

### 4. Wire Laporan Page Data

#### 4.1
WHEN the laporan page mounts, THEN the profit trend chart, branch breakdown table, and top products table SHALL fetch data from `GET /api/reports/profit?from=&to=` using the currently selected date range.

#### 4.2
WHEN a date range is selected on the laporan page, THEN the page SHALL re-fetch profit report data using the new `from` and `to` ISO date string parameters.

#### 4.3
WHEN the shift report section is visible, THEN data SHALL be fetched from `GET /api/reports/shift?shiftId=` using the active shift ID.

#### 4.4
WHILE data is loading, the chart and tables SHALL display a skeleton or loading state. WHEN an API error occurs, the sections SHALL display a user-visible error message in Indonesian.

#### 4.5
All fetch calls to `/api/reports/*` SHALL include the Authorization header via `getAuthHeaders()`.

### 5. Wire Login Branch Dropdown

#### 5.1
WHEN the masuk page detects a registered device (i.e., `deviceToken` is present in localStorage), THEN the Admin/Owner branch dropdown SHALL be populated by calling `GET /api/branches` instead of using the hardcoded `cabangOptions` array.

#### 5.2
The `GET /api/branches` request SHALL include the Authorization header via `getAuthHeaders()`.

#### 5.3
WHILE branches are loading, the dropdown SHALL display a loading state. WHEN the API call fails, the dropdown SHALL fall back to an empty list with a visible error prompt.

#### 5.4
WHEN no `deviceToken` is present, the branch dropdown SHALL NOT call `GET /api/branches` (device is not yet registered, API requires tenant context from JWT).

### 6. Wire Pending Sync Count

#### 6.1
WHEN the masuk page renders, THEN the `pendingSyncCount` value SHALL reflect the actual number of local WatermelonDB `transactions` records where `syncedAt IS NULL`.

#### 6.2
The pending count SHALL be derived by querying the WatermelonDB database using `useDatabase()` and counting `Transaction` records with `syncedAt === null`.

#### 6.3
WHEN the database is not yet initialised (returns null from `useDatabase()`), the pending count SHALL default to `0`.

#### 6.4
The count SHALL update reactively whenever a new transaction is created locally or a sync completes.
