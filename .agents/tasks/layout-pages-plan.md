# Implementation Plan: Retail Layout and Pages

## Exploration Summary

**Current State:**
- RetailShell and PageHeader already exist in `src/shared/layouts/` with basic navigation
- RetailShell has navigation items: /pos, /inventory, /reports, /settings (English paths)
- Only `/pos` page exists at `src/app/(dashboard)/pos/page.tsx` (basic stub)
- shadcn/ui components installed: button, badge, card, input, table, dialog, dropdown-menu, sonner
- Sheet component is NOT installed yet (needed for mobile navigation in RetailShell)
- Design tokens configured in `tailwind.config.ts`: primary #0f6d5f, accent #12507f, danger #a52b22
- No login page exists yet at `/login`
- Dashboard layout at `src/app/(dashboard)/layout.tsx` already uses RetailShell with offline detection

**Requirements from User:**
- Use English for route paths (already done in RetailShell)
- Implement 6 pages based on DPAI context:
  1. Login/Role Selection page (`/login`)
  2. POS Register (`/pos`) - needs replacement
  3. Inbound Receiving (`/receiving`)
  4. Inventory Overview (`/inventory`)
  5. Expiry FEFO (`/expiry`)
  6. Reports Profit (`/reports`)

**Key Findings:**
- Product requirements define 3 user roles: Cashier (POS), Store Manager (Inventory/FEFO), Owner (Reports)
- Technical spec requires feature-driven structure: `src/features/{pos,inventory,tenants}`
- All components must be touch-friendly (min 44px), keyboard accessible with ARIA labels
- NO custom CSS - Tailwind classes only
- NO data fetching - placeholder/static data only
- Design system documented at `.kiro/steering/design-system.md`

**Build Commands:**
- Build: `npm run build`
- Dev: `npm run dev`
- Lint: `npm run lint`

**Verification Strategy:**
After each step, run `npm run build` to ensure no TypeScript or build errors. Fix any errors before proceeding.

---

## Design Decisions

### Decision 1: Route Path Mapping
**Rationale:** User requested English paths. Product requirements mention specific feature names that map to existing RetailShell navigation.

| Feature | Indonesian Name | Route Path | RetailShell Nav |
|---------|----------------|------------|-----------------|
| Login/Role Select | Masuk | `/login` | Not in nav |
| POS Register | Kasir | `/pos` | ✓ Existing |
| Inbound Receiving | Barang Masuk | `/receiving` | Need to add |
| Inventory | Inventaris | `/inventory` | ✓ Existing |
| Expiry FEFO | Kedaluwarsa | `/expiry` | Need to add |
| Reports | Laporan | `/reports` | ✓ Existing |

**Action Required:** Update RetailShell navigation to include `/receiving` and `/expiry` links.

### Decision 2: Install Sheet Component First
**Rationale:** RetailShell uses Sheet for mobile navigation but it's not installed. This will cause build errors when implementing pages that import RetailShell.

**Action Required:** Install shadcn Sheet component before modifying RetailShell.

### Decision 3: Page Metadata Pattern
**Rationale:** Existing `src/app/layout.tsx` exports metadata using Next.js 14 App Router pattern. All pages should follow this pattern for SEO.

**Pattern:**
```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
};
```

### Decision 4: Server vs Client Components
**Rationale:** Next.js 14 defaults to server components. Only use 'use client' when necessary (interactive state, hooks like useState/usePathname).

- Pages: Server components (default)
- RetailShell: Client component (uses useState, usePathname)
- PageHeader: Server component (pure presentation)
- Interactive widgets: Client components when needed

### Decision 5: Placeholder Content Strategy
**Rationale:** User specified NO data fetching, placeholder/static data only. Technical spec requires WatermelonDB integration (future work).

**Pattern:** Each page will have Card sections with placeholder text and `{/* TODO: WatermelonDB integration */}` comments marking where data fetching will be added later.

---

## Implementation Plan

### Step 1: Install Sheet Component and Update RetailShell Navigation

**What:** Install shadcn Sheet component via CLI, then update RetailShell.tsx to add missing navigation items (/receiving, /expiry) and fix any import issues.

**Files:**
- `src/shared/components/ui/sheet.tsx` (create via `npx shadcn@latest add sheet`)
- `src/shared/layouts/RetailShell.tsx` (modify - update navigationItems array)

**Changes to RetailShell:**
```typescript
const navigationItems: NavigationItem[] = [
  { label: 'POS', href: '/pos', icon: ShoppingCart },
  { label: 'Receiving', href: '/receiving', icon: PackagePlus }, // NEW
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Expiry', href: '/expiry', icon: AlertCircle }, // NEW
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];
```

**Verify:** 
```bash
npm run build
```
Expected: Build succeeds with no errors. Check that sheet.tsx exists in ui/ folder.

---

### Step 2: Create Login/Role Selection Page

**What:** Create standalone login page at `/login` with role selection cards (Cashier, Manager, Owner). No RetailShell wrapper. Uses Card and Button from shadcn.

**Files:**
- `src/app/login/page.tsx` (create)

**Key Requirements:**
- Export metadata: `{ title: 'Login — Role Selection', description: 'Select your role to continue' }`
- Three role cards with descriptions
- Each card navigates to appropriate route on click
- Footer note about offline capability
- NO authentication implementation (just navigation)
- Server component (no 'use client')

**Content:**
- Cashier → /pos ("Fast transaction processing")
- Manager → /inventory ("Inventory oversight and reporting")  
- Owner → /reports ("Multi-location analytics")

**Verify:**
```bash
npm run build && npm run dev
```
Navigate to http://localhost:3000/login and verify:
- Three role cards render correctly
- Clicking each card navigates to correct route
- Responsive layout works on mobile

---

### Step 3: Replace POS Page

**What:** Replace existing stub at `src/app/(dashboard)/pos/page.tsx` with full POS interface layout (placeholder content).

**Files:**
- `src/app/(dashboard)/pos/page.tsx` (replace)

**Key Requirements:**
- Export metadata: `{ title: 'POS Register' }`
- PageHeader with title "POS Register", description, breadcrumb
- Two-column layout (responsive: stacks on mobile)
  - Left: Product search + product grid (6-8 placeholder cards)
  - Right: Cart/order summary (line items + totals)
- Checkout button (primary variant, full width, touch-friendly)
- Quantity +/- controls in cart (h-11 minimum for 44px touch target)
- `{/* TODO: WatermelonDB integration for products and transactions */}` comments
- Server component with note about future client components for cart state

**Verify:**
```bash
npm run build && npm run dev
```
Navigate to /pos and verify:
- Layout renders correctly
- Responsive: 2 columns on desktop, stacks on mobile
- All buttons meet 44px touch target minimum

---

### Step 4: Create Receiving Page

**What:** Create inbound goods receiving page at `/receiving` with form and table placeholders.

**Files:**
- `src/app/(dashboard)/receiving/page.tsx` (create)

**Key Requirements:**
- Export metadata: `{ title: 'Inbound Receiving & Pricing' }`
- PageHeader with title "Inbound Receiving & Pricing", description
- Card: Receive goods form (supplier, items, quantity, cost price fields) - placeholder
- Card: Recent inbound transactions table with Badge for status
- `{/* TODO: WatermelonDB integration for batch tracking */}` comments
- Server component

**Verify:**
```bash
npm run build && npm run dev
```
Navigate to /receiving and verify form and table render.

---

### Step 5: Create Inventory Page

**What:** Create inventory overview page at `/inventory` with stats and table placeholders.

**Files:**
- `src/app/(dashboard)/inventory/page.tsx` (create)

**Key Requirements:**
- Export metadata: `{ title: 'Inventory & Stock Count' }`
- PageHeader with title "Inventory & Stock Count", action button "Stock Opname"
- Card: Inventory stats grid (total items, low stock count) - placeholder numbers
- Card: Inventory table with columns: SKU, Name, Current Stock, Status
- Badge variants: success (In Stock), warning (Low Stock), danger (Out of Stock)
- `{/* TODO: WatermelonDB integration for real-time stock */}` comments
- Server component

**Verify:**
```bash
npm run build && npm run dev
```
Navigate to /inventory and verify stats and table render with badges.

---

### Step 6: Create Expiry/FEFO Page

**What:** Create expiry management page at `/expiry` with timeline and FEFO queue placeholders.

**Files:**
- `src/app/(dashboard)/expiry/page.tsx` (create)

**Key Requirements:**
- Export metadata: `{ title: 'Expiry & FEFO Management' }`
- PageHeader with title "Expiry & FEFO Management", description
- Card: Expiry timeline showing items expiring in 7/14/30 days - placeholder
- Card: FEFO queue table (First Expired First Out priority list)
- Badge variants: danger (Expired), warning (Expiring Soon < 7 days), info (< 30 days)
- `{/* TODO: WatermelonDB integration for batch expiry tracking */}` comments
- Server component

**Verify:**
```bash
npm run build && npm run dev
```
Navigate to /expiry and verify timeline and queue render.

---

### Step 7: Create Reports Page

**What:** Create profit and shift reports page at `/reports` with summary cards and transaction table.

**Files:**
- `src/app/(dashboard)/reports/page.tsx` (create)

**Key Requirements:**
- Export metadata: `{ title: 'Reports & Analytics' }`
- PageHeader with title "Reports & Analytics", action buttons for date range
- Card: Profit summary grid (Today, This Week, This Month) - placeholder numbers
- Card: Shift summary (Expected Cash vs Physical Cash) - placeholder
- Card: Recent transactions table with amount and payment method
- `{/* TODO: WatermelonDB integration for COGS and profit calculation */}` comments
- Server component

**Verify:**
```bash
npm run build && npm run dev
```
Navigate to /reports and verify all cards render with placeholder data.

---

### Step 8: Final Build Verification and Cleanup

**What:** Run full build, fix any remaining TypeScript errors, verify all routes work, ensure consistent styling.

**Files:** All modified files

**Verification Steps:**
1. `npm run build` - Must succeed with no errors
2. `npm run lint` - Must pass (or only existing warnings)
3. Manual testing in dev mode:
   - Navigate to /login → click each role card
   - Test all dashboard routes: /pos, /receiving, /inventory, /expiry, /reports
   - Test mobile responsive behavior (Chrome DevTools)
   - Verify RetailShell navigation highlights active route
   - Verify offline badge appears when toggling network
   - Test keyboard navigation (Tab through interactive elements)

**Fix any issues found:**
- TypeScript errors: add missing types or fix imports
- Build errors: resolve module resolution issues
- Styling inconsistencies: ensure all pages use same Card/Button patterns
- Touch targets: verify all buttons/links are minimum 44px

**Verify:**
```bash
npm run build
```
Expected: Build completes successfully with exit code 0.

---

## Key Constraints & Patterns

### Touch-Friendly Sizing
- Buttons: `h-10` (40px) is standard, but add `py-3` to reach effective 44px with padding
- Icon buttons: `h-11 w-11` (44px minimum)
- Table rows: Add `min-h-[52px]` class
- Input fields: `h-10` (40px) standard

### Tailwind Class Patterns
```typescript
// Card wrapper
<Card padding="md" className="space-y-4">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Button with full width
<Button variant="primary" fullWidth className="min-h-[44px]">
  Checkout
</Button>

// Badge with status
<Badge variant="success" dot>Active</Badge>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### Import Patterns
```typescript
import { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/shared/components';
```

### Metadata Pattern
```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
};
```

---

## Files Summary

**New Files (7):**
1. `src/shared/components/ui/sheet.tsx` - shadcn Sheet component (via CLI)
2. `src/app/login/page.tsx` - Login/role selection page
3. `src/app/(dashboard)/receiving/page.tsx` - Inbound receiving page
4. `src/app/(dashboard)/inventory/page.tsx` - Inventory overview page
5. `src/app/(dashboard)/expiry/page.tsx` - Expiry FEFO page
6. `src/app/(dashboard)/reports/page.tsx` - Reports and analytics page
7. `src/app/(dashboard)/settings/page.tsx` - Settings page (minimal stub for nav completion)

**Modified Files (2):**
1. `src/shared/layouts/RetailShell.tsx` - Add /receiving and /expiry navigation items
2. `src/app/(dashboard)/pos/page.tsx` - Replace with full POS interface layout

**Total:** 9 files (7 new, 2 modified)

---

## Post-Implementation Notes

### Not Implemented (Future Work)
- Authentication logic (JWT, device registration)
- WatermelonDB integration and sync
- Real data fetching from API
- Form validation and submission
- Hardware integration (barcode scanner, thermal printer)
- Dark mode toggle UI (CSS variables ready, toggle not implemented)
- Settings page functionality (only stub created)

### Ready for Next Phase
After this implementation, the UI shell is complete and ready for:
- WatermelonDB schema definition
- Prisma backend API routes
- Sync engine implementation (push/pull)
- Feature-specific business logic in `src/features/`

### Accessibility Compliance
All pages implement:
- Semantic HTML (headings, nav, tables)
- ARIA labels on interactive elements
- Keyboard navigation support (focus states via shadcn)
- Sufficient color contrast (design tokens pre-validated)
- Touch-friendly targets (44px minimum)

Note: Full WCAG AA compliance requires manual testing with assistive technologies and expert accessibility review.
