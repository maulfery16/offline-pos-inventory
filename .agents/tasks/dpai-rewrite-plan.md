# Implementation Plan: DPAI Design Rewrite

## Overview

This plan rewrites all Next.js pages and the dashboard layout to faithfully reproduce the corresponding dpai HTML designs. The designs use a consistent design system with CSS custom properties that map directly to the existing Tailwind tokens.

## Design Token Mapping

| dpai CSS Variable | Tailwind Class | Value |
|-------------------|----------------|-------|
| `--color-primary` | `primary` | `#0f6d5f` |
| `--color-primary-hover` | `primary-hover` | `#0b564a` |
| `--color-primary-soft` | `primary-soft` | `#e2f2ee` |
| `--color-accent` | `accent` | `#12507f` |
| `--color-accent-soft` | `accent-soft` / `info-soft` | `#e8eef7` |
| `--color-success` | `success` | `#136b3f` |
| `--color-success-soft` | `success-soft` | `#e3f4e9` |
| `--color-warning` | `warning` | `#8a5300` |
| `--color-warning-soft` | `warning-soft` | `#fdf0da` |
| `--color-danger` | `danger` | `#a52b22` |
| `--color-danger-soft` | `danger-soft` | `#fbe8e5` |
| `--color-surface` | `white` | `#fff` |
| `--color-surface-sunken` | `gray-50` | `#f7f8fa` |
| `--color-surface-strong` | `gray-800` | `#101828` |
| `--color-canvas` | `gray-100` | `#f2f4f7` |
| `--color-border` | `gray-200` | `#e2e6ec` |
| `--color-border-strong` | `gray-300` | `#cbd2dc` |
| `--color-text` | `gray-900` | `#182230` |
| `--color-text-muted` | `gray-500` | `#5a6675` |
| `--color-text-subtle` | `gray-400` | `#8a94a3` |
| `--radius-sm` | `rounded-sm` | `6px` |
| `--radius-md` | `rounded-md` | `10px` |
| `--radius-lg` | `rounded-lg` | `14px` |
| `--radius-pill` | `rounded-pill` | `999px` |
| `--space-*` | `p-*` / `gap-*` | 4px scale (1=4px) |

## Font Stack

The designs use **Plus Jakarta Sans**. Add to `app/layout.tsx`:
```tsx
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />
```

Body font-family: `font-family: 'Plus Jakarta Sans', system-ui, sans-serif`

## Icon System

The designs use **Iconify** with Lucide icons (`lucide:icon-name`). The project has `lucide-react` installed, so we'll use that directly instead of Iconify for consistency.

---

## Implementation Steps

### 1. Rewrite Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

**Status**: The current layout uses a custom RetailShell component that differs significantly from the dpai design.

**Key Structural Differences**:
- dpai: Fixed 248px sidebar with dark theme (`bg-gray-800`), brand mark, store info card, navigation with labels, user avatar in footer
- Current: 256px sidebar with light theme, no store info card, emoji icons instead of Lucide, no user avatar footer

**Changes Required**:
1. **Sidebar** (`l-retail__sidebar`):
   - Dark background: `bg-gray-800` (#101828)
   - Width: `w-[248px]`
   - Brand section with green mark: Store icon in `bg-primary` rounded box
   - Store info card: Darker background `bg-gray-900` / `#1b2534` with branch name, sync status
   - Navigation with two groups: "Operasional" and "Analitik" labels
   - Nav items: `min-h-[40px]`, `rounded-md`, hover state, active state with `bg-primary`
   - Footer: User avatar with initials, role info, offline status

2. **Mobile Drawer** (`l-retail__drawer`):
   - Native `<dialog>` element with `showModal()` API
   - Dark theme matching sidebar
   - Close button at top

3. **Header** (`l-retail__header`):
   - Sticky, white background, border bottom
   - Mobile menu button visible only below 900px
   - Eyebrow text (small label) + h1 title
   - Actions slot on the right

4. **Responsive Breakpoint**:
   - Sidebar hidden below 900px, drawer shown instead
   - Use CSS `@media (max-width: 900px)` equivalent in Tailwind: `lg:` breakpoint

**Files to Modify**:
- `src/shared/layouts/RetailShell.tsx` — Complete rewrite
- `src/app/(dashboard)/layout.tsx` — May need minor updates for header actions

**Verification**: Visual comparison with `retail-shell.layout.html`

---

### 2. Rewrite Login Page (`src/app/masuk/page.tsx`)

**Status**: Current page is a simple role selection grid; dpai design is a full two-panel login with brand identity and role-specific forms.

**Key Structural Differences**:
- dpai: Two-panel layout (brand left, form right), role selection buttons with detailed descriptions, PIN keypad for kasir, email form for admin/owner
- Current: Single centered card with three role cards using emojis

**Changes Required**:
1. **Two-panel Layout** (`login` class):
   - Left: Brand panel with gradient overlay, tagline, feature points, branch status
   - Right: Form panel with card containing role selection + forms

2. **Role Selection** (`login__roles`):
   - Three buttons: Kasir, Admin/Manajer Toko, Owner/Pemilik Usaha
   - Each has icon, title, description, checkmark when selected
   - `aria-pressed="true/false"` for accessibility

3. **PIN Form (Kasir)** (`login__pin`):
   - Cashier dropdown select
   - PIN dot indicators (6 dots, filled state)
   - Keypad grid (1-9, 0, clear, backspace)
   - Hidden actual input for keyboard support

4. **Email Form (Admin/Owner)** (`login__form[data-panel="staf"]`):
   - Email input, password with reveal toggle
   - Branch select dropdown
   - Remember checkbox

5. **Client Component**: `'use client'` required for interactive state

**Files to Modify**:
- `src/app/masuk/page.tsx` — Complete rewrite as client component

**Verification**: Visual comparison with `login-akses.html`

---

### 3. Rewrite POS Register Page (`src/app/(dashboard)/kasir/page.tsx`)

**Status**: Current page has basic product grid and cart; dpai design has comprehensive POS with status bar, scanner, FEFO chips, payment methods, dialogs.

**Key Structural Differences**:
- dpai: Two-column layout (catalog left, cart right), status bar with cashier/shift info, network status, scanner input, product tiles with batch/expiry chips, FEFO auto-selection, payment methods (Tunai/QRIS/Kartu), held transactions, void dialog, receipt dialog
- Current: Simple product grid and cart summary, no status bar, no payment methods

**Changes Required**:
1. **Status Bar** (`pos__panel` at top):
   - Cashier name, shift info, transaction count
   - Queue chip, network status with online/offline indicator
   - Full width, spans both columns

2. **Catalog Panel** (`pos__panel`):
   - Scanner input with icon, "Aktifkan kamera" button
   - Product grid with tiles showing: name, stock chip (ok/warn/danger), batch + days, price
   - Blocked items show red background

3. **Cart Panel** (`pos__cart`):
   - Sticky position, item count, FEFO chip
   - Cart lines with quantity stepper, void button
   - Totals: subtotal, discount, total
   - Payment method buttons (Tunai/QRIS/Kartu)
   - Cash input with quick amount buttons
   - Change calculation
   - Hold/Clear actions, Pay button

4. **Held Transactions**:
   - List of held transactions with restore option

5. **Dialogs**:
   - Void dialog with admin PIN input
   - Receipt dialog with transaction summary

6. **Client Component**: `'use client'` required for cart state, payment logic

**Files to Modify**:
- `src/app/(dashboard)/kasir/page.tsx` — Complete rewrite as client component

**Verification**: Visual comparison with `pos-register.html`

---

### 4. Rewrite Inbound Receiving Page (`src/app/(dashboard)/barang-masuk/page.tsx`)

**Status**: Current page has simple two-column form/recent list; dpai design has stats row, document details, receiving lines with batch/expiry inputs, cost summary sidebar.

**Key Structural Differences**:
- dpai: Stats row at top, document details form, scan input, receiving lines with inline editing, sidebar with cost summary and validation issues
- Current: Simple form with basic fields, recent list

**Changes Required**:
1. **Stats Row** (`recv__stats`):
   - Receipt number, supplier, total lines/units, total HPP

2. **Document Details** (`recv__form`):
   - Supplier select, invoice number, date, warehouse

3. **Receiving Lines** (`recv__lines`):
   - Each line: product name, SKU, qty, HPP/unit, margin%, batch number, expiry date
   - Perishable indicator, validation status chip
   - Selling price readout, subtotal HPP readout
   - Remove button

4. **Scan Input**:
   - SKU scan field with hint text

5. **Sidebar** (`recv__aside`):
   - Cost summary: total units, total HPP, estimated sales, estimated profit, average margin
   - Validation issues list with warn/error/ok states

6. **Client Component**: `'use client'` required for form state, line management

**Files to Modify**:
- `src/app/(dashboard)/barang-masuk/page.tsx` — Complete rewrite as client component

**Verification**: Visual comparison with `inbound-receiving.html`

---

### 5. Rewrite Inventory Overview Page (`src/app/(dashboard)/inventaris/page.tsx`)

**Status**: Current page has stats cards and table; dpai design has KPI row, tabbed table with physical counts, alerts sidebar, stock opname session.

**Key Structural Differences**:
- dpai: KPI row, tabbed table (All/Low/Expiry/Variance), inline physical count inputs, variance indicators, low stock alerts panel, opname session panel with dialog
- Current: Simple stats, basic table with stock status badges

**Changes Required**:
1. **KPI Row** (`inv__kpis`):
   - Inventory value (HPP), low stock count, expiry ≤30 days, variance from last opname

2. **Tabbed Table** (`inv__tabs` + `inv__list`):
   - Tabs: Semua, Menipis, Akan kedaluwarsa, Selisih opname
   - Table columns: Barang, Tersedia, Fisik (input), Selisih, Status, Aksi
   - Variance coloring (red negative, green positive)
   - "Sesuaikan" button opens dialog

3. **Adjust Dialog**:
   - Physical count input, reason select, notes textarea
   - Variance preview

4. **Alerts Sidebar**:
   - Low stock warnings with suggested order quantities

5. **Opname Session Panel**:
   - Progress (X of Y counted)
   - Variance count
   - Save/Reset buttons

6. **Client Component**: `'use client'` required for tab state, opname state

**Files to Modify**:
- `src/app/(dashboard)/inventaris/page.tsx` — Complete rewrite as client component

**Verification**: Visual comparison with `inventory-overview.html`

---

### 6. Rewrite Expiry/FEFO Page (`src/app/(dashboard)/kedaluwarsa/page.tsx`)

**Status**: Current page has three expiry columns and FEFO table; dpai design has bucket cards, bar chart, full FEFO table with actions, rules sidebar.

**Key Structural Differences**:
- dpai: Bucket cards (expired/≤7/8-14/15-30/>30), bar chart, FEFO table with batch details, blocked items sidebar, rules list, log
- Current: Three static cards (7/14/30 days), basic table

**Changes Required**:
1. **Bucket Cards** (`exp__buckets`):
   - Five clickable cards showing value at risk
   - Click filters the table

2. **Bar Chart** (`exp__chart`):
   - SVG bar chart showing batch distribution
   - Legend

3. **FEFO Table** (`exp__table`):
   - Columns: Barang, No. batch, Kedaluwarsa, Sisa hari, Cabang, Stok batch, Nilai HPP, Status, Tindakan
   - Range filter buttons: ≤7, ≤14, ≤30, Semua
   - Sort select: FEFO, Latest, Value
   - Actions: Retur, Blokir/Buka blokir

4. **Sidebar**:
   - FEFO rules list
   - Blocked items list with unblock buttons
   - Recent warnings log

5. **Server Component**: Can remain server component with static data, but filtering/sorting needs client state

**Files to Modify**:
- `src/app/(dashboard)/kedaluwarsa/page.tsx` — Significant rewrite

**Verification**: Visual comparison with `expiry-fefo.html`

---

### 7. Rewrite Reports/Profit Page (`src/app/(dashboard)/laporan/page.tsx`)

**Status**: Current page has summary cards and shift table; dpai design has KPI row, line chart, branch bars, product contribution table, shift reconciliation panel.

**Key Structural Differences**:
- dpai: KPI row (sales/COGS/profit/margin/basket), SVG line chart, branch profit bars, product table, shift reconciliation with cash input and variance calculation
- Current: Simple cards, shift table, top products list

**Changes Required**:
1. **KPI Row** (`rep__kpis`):
   - Net sales, actual COGS (FEFO), gross profit, gross margin %, average basket
   - Trend indicators

2. **Line Chart** (`rep__line-chart`):
   - SVG chart showing sales vs profit trend
   - Period selector: Hari ini, 7 hari, 30 hari

3. **Branch Bars** (`rep__bars`):
   - Profit per branch with percentage bars

4. **Product Table** (`rep__table`):
   - Columns: Produk, Qty terjual, Penjualan, HPP, Laba kotor, Margin
   - Limited to top contributors

5. **Shift Reconciliation Panel**:
   - Expected cash (system), QRIS, Card totals
   - Physical cash input field
   - Variance calculation with color indicator
   - Notes textarea
   - Close/Review buttons
   - Result dialog

6. **Client Component**: `'use client'` required for period selection, shift input

**Files to Modify**:
- `src/app/(dashboard)/laporan/page.tsx` — Complete rewrite as client component

**Verification**: Visual comparison with `reports-profit.html`

---

## Files Summary

| File | Effort | Client Component |
|------|--------|------------------|
| `src/shared/layouts/RetailShell.tsx` | High | Yes |
| `src/app/(dashboard)/layout.tsx` | Low | No change |
| `src/app/masuk/page.tsx` | High | Yes |
| `src/app/(dashboard)/kasir/page.tsx` | Very High | Yes |
| `src/app/(dashboard)/barang-masuk/page.tsx` | High | Yes |
| `src/app/(dashboard)/inventaris/page.tsx` | High | Yes |
| `src/app/(dashboard)/kedaluwarsa/page.tsx` | Medium | Yes (for interactivity) |
| `src/app/(dashboard)/laporan/page.tsx` | High | Yes |

---

## Build Verification Command

After all changes, run:

```bash
npm run build --no-progress 2>&1 | cat
```

**Expected Outcome**: Build completes with zero TypeScript errors. The pages should visually match the dpai designs when viewed in the browser.

**Timeout**: 300 seconds (5 minutes)

---

## Implementation Order (Dependency-Based)

1. **RetailShell Layout** — Foundation for all dashboard pages
2. **Login Page** — Entry point, standalone
3. **Inventaris Page** — Moderate complexity
4. **Kedaluwarsa Page** — Moderate complexity
5. **Laporan Page** — Moderate complexity
6. **Barang Masuk Page** — Higher complexity with forms
7. **Kasir Page** — Highest complexity, most interactive elements

This order ensures the layout is ready first, then progressively builds more complex pages.
