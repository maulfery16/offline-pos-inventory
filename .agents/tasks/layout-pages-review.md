# Retail Shell Layout and DPAI Pages Implementation Review

**Verdict**: CHANGES_REQUESTED

This review covers the implementation of the retail-shell layout and 6 dashboard pages for the offline POS inventory system. The implementation is mostly complete with good adherence to design patterns, but has one blocking issue.

## Summary

The implementation includes a responsive sidebar layout (`RetailShell`) with offline detection, a reusable `PageHeader` component with breadcrumb support, and 6 dashboard pages with proper Indonesian localization. The code follows the project's design system using Tailwind CSS and shadcn/ui components. Touch targets meet the 44px minimum requirement consistently.

**Watch for:** POS page is missing `metadata` export (blocking for server components), and the navigation uses `/kasir` route while there's also a `/pos` page in the dashboard routes.

---

## High-level view

The `RetailShell` component provides a responsive sidebar layout with mobile hamburger menu and desktop persistent sidebar. It correctly uses `'use client'` directive since it relies on `useState` and `usePathname` hooks. The offline indicator badge appears in the top bar when `isOffline` prop is true. Navigation covers 5 dashboard routes: Kasir, Barang Masuk, Inventaris, Kedaluwarsa, and Laporan.

The `PageHeader` component is a server component that renders breadcrumbs, title, description, and optional action buttons. It uses proper TypeScript interfaces and exports both the component and props type. Breadcrumbs support both linked and non-linked items with proper accessibility attributes.

The dashboard layout wraps all pages with `RetailShell` and implements online/offline detection via browser events. This is a client component that manages `isOffline` state and passes it to the shell.

All 6 expected pages exist: `masuk` (role selection), `kasir` (POS), `barang-masuk` (inbound goods), `inventaris` (inventory management), `kedaluwarsa` (expiry/FEFO), and `laporan` (reports). The `masuk` page is outside the dashboard route group and provides role-based entry points.

---

<details>
<summary>Issues (3)</summary>

1. **POS page missing metadata export** — The `/pos/page.tsx` file is a server component (no `'use client'` directive) but does not export `metadata`. All other dashboard pages export metadata. Add `export const metadata: Metadata = { title: 'Point of Sale', description: '...' };` to make this consistent and enable proper SEO/static generation.

2. **Route naming inconsistency** — The navigation in `RetailShell` points to `/kasir` for the cashier/POS function, but there's also a `/pos` page. The spec mentions "POS" as the module name, and the user request referenced "POS" pages. The masuk page links cashier role to `/kasir`. This appears intentional (Indonesian "Kasir" = Cashier), but the `/pos` page may be redundant or a planning artifact. Confirm which route should be the primary.

3. **POS page has minimal content** — Unlike other dashboard pages which have full placeholder UIs with tables, cards, and forms, the POS page at `/pos/page.tsx` only has a PageHeader and placeholder text. The `/kasir` page has a full POS interface with product grid and cart. This suggests `/pos` may be an incomplete or duplicate implementation.

</details>

---

<details>
<summary>Details</summary>

### RetailShell Layout Component

The `RetailShell` component is well-structured with proper responsive behavior. It renders a desktop sidebar (hidden on mobile, visible via `md:flex`), a mobile slide-out sidebar with overlay, and a top header bar. The component correctly uses:

- `useState` for sidebar toggle state
- `usePathname` from `next/navigation` for active route detection
- Tailwind CSS for all styling (no custom CSS)
- Touch-friendly targets with `min-h-[44px]` and `min-w-[44px]` classes

The sidebar navigation items are defined as a constant array with proper TypeScript interface:

```typescript
interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}
```

Navigation covers the 5 main routes: `/kasir`, `/barang-masuk`, `/inventaris`, `/kedaluwarsa`, `/laporan`. Active state is detected using `pathname?.startsWith(item.href)`.

The offline indicator uses the `Badge` component with `variant="offline"` and a `WifiOff` icon from lucide-react.

### PageHeader Component

A clean, reusable server component for page headers. Supports:

- Breadcrumb navigation with linked and non-linked items
- Title and optional description
- Optional actions slot for buttons
- Additional children content

The component uses `ChevronRight` from lucide-react as breadcrumb separator and properly implements accessibility with `aria-label`, `aria-current`, and `aria-hidden` attributes.

### Dashboard Layout

The `(dashboard)/layout.tsx` correctly implements online/offline detection:

```typescript
useEffect(() => {
  setIsOffline(!navigator.onLine);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => { /* cleanup */ };
}, []);
```

This pattern is appropriate for a Progressive Web App with offline-first architecture.

### Page Implementations

**masuk/page.tsx** (outside dashboard group): Role selection page with 3 cards linking to `/kasir`, `/inventaris`, and `/laporan`. Uses Card, Button, and Badge components. Has proper metadata export.

**kasir/page.tsx**: Full POS interface with product grid and cart sidebar. Has metadata export. Uses Input, Button, Card components with proper touch targets.

**barang-masuk/page.tsx**: Goods receiving form with supplier, product, quantity, cost, selling price, and expiry date fields. Includes recent transactions list. Has metadata export.

**inventaris/page.tsx**: Inventory management with stats cards and product table. Has metadata export.

**kedaluwarsa/page.tsx**: FEFO expiry management with 7/14/30 day timelines and priority queue table. Has metadata export.

**laporan/page.tsx**: Reports page with profit summary cards, shift report table, and top products list. Has metadata export.

**pos/page.tsx**: Minimal implementation with only PageHeader and placeholder text. **Missing metadata export.**

### Component Imports and Exports

All imports resolve correctly:

- `@/shared/layouts` exports `RetailShell`, `RetailShellProps`, `PageHeader`, `PageHeaderProps`
- `@/shared/components` exports Badge, Button, Card, Input, and other UI components
- `@/shared/utils` exports `cn` utility
- `lucide-react` provides icon components (Menu, X, WifiOff, ChevronRight)

The component barrel files properly re-export from shadcn/ui components with backward compatibility layers.

### Design System Adherence

All pages use Tailwind CSS classes exclusively. The design tokens defined in the spec are applied:

- Touch targets: `min-h-[44px]` used consistently on buttons and navigation items
- Card padding: `p-4 md:p-6` matches spec
- Border radius: `rounded-lg` (14px) for cards, `rounded-md` (10px) for inputs
- Badge variants: `success`, `warning`, `danger`, `info`, `offline` available

One minor deviation: Pages use inline color classes like `text-red-600`, `text-yellow-600`, `bg-red-50` for status indicators rather than the Badge variants. This is acceptable for placeholder/demo content but should use semantic Badge variants in production.

</details>

---

<details>
<summary>File Map</summary>

| File | Status | Notes |
|------|--------|-------|
| `src/shared/layouts/RetailShell.tsx` | ✅ Complete | Client component with responsive sidebar, offline indicator |
| `src/shared/layouts/PageHeader.tsx` | ✅ Complete | Server component with breadcrumbs, title, actions |
| `src/shared/layouts/index.ts` | ✅ Complete | Exports both components and types |
| `src/app/(dashboard)/layout.tsx` | ✅ Complete | Wraps children with RetailShell, handles offline state |
| `src/app/masuk/page.tsx` | ✅ Complete | Role selection page with metadata |
| `src/app/(dashboard)/kasir/page.tsx` | ✅ Complete | Full POS interface with metadata |
| `src/app/(dashboard)/barang-masuk/page.tsx` | ✅ Complete | Goods receiving form with metadata |
| `src/app/(dashboard)/inventaris/page.tsx` | ✅ Complete | Inventory management with metadata |
| `src/app/(dashboard)/kedaluwarsa/page.tsx` | ✅ Complete | FEFO/expiry tracking with metadata |
| `src/app/(dashboard)/laporan/page.tsx` | ✅ Complete | Reports and analytics with metadata |
| `src/app/(dashboard)/pos/page.tsx` | ⚠️ Incomplete | Missing metadata, minimal content |

</details>
