# RetailShell layout and DPAI pages implementation

**Verdict**: CHANGES_REQUESTED

Implementation of the retail application shell layout and six dashboard pages for an offline-first POS system. The architecture uses Next.js App Router with a shared layout component (RetailShell) wrapping role-based dashboard pages. Most pages exist and follow design system conventions, but one critical route mismatch blocks approval.

**Watch for:** POS route mismatch—spec expects `/pos/page.tsx` but implementation uses `/kasir/page.tsx`. This breaks the file list requirement and may indicate incomplete coordination between spec and implementation.

## High-level view

The dashboard uses a route group `(dashboard)` with a shared layout that wraps all pages in RetailShell. The shell provides responsive side navigation (collapsible on mobile), offline status detection, and a consistent header. All dashboard pages exist at the correct routes except POS, which is implemented as `/kasir` instead of `/pos`. Navigation in RetailShell correctly points to `/kasir`, but this conflicts with the review spec's expectation of `/pos`.

All pages use PageHeader consistently for breadcrumbs and title sections. Component imports resolve correctly—Badge, Button, Card, and Input all re-export from shadcn ui components with proper TypeScript interfaces. Touch targets meet the 44px minimum (buttons default to `h-10` with `min-h-[44px]` classes applied where needed). Design tokens are used via Tailwind utility classes, not custom CSS.

Five of six dashboard pages follow the established pattern: server components with exported metadata, PageHeader at the top, placeholder data in Card layouts with proper table structures for lists. The login page (`/masuk`) stands outside the dashboard layout and uses a centered card-based role selector.

TypeScript types are complete for all component props and layouts. No unused imports spotted. The `cn()` utility is imported from `@/shared/utils` and used consistently across all components for className merging.

<details>
<summary>Issues (1)</summary>

1. **POS route path mismatch** — Review spec expects `/pos/page.tsx` but implementation uses `/kasir/page.tsx`. Either the file must be renamed to match spec, or the spec must be updated to reflect the localized naming convention. The navigation in RetailShell correctly points to `/kasir`, so the implementation is internally consistent, but it doesn't match the review contract.

</details>

<details>
<summary>Details</summary>

## Route path mismatch for POS page

The review instructions specify checking `/Users/macbookpro/Documents/Projects/offline-pos-inventory/src/app/(dashboard)/pos/page.tsx`, but the implementation has the POS page at `src/app/(dashboard)/kasir/page.tsx`. The Indonesian word "kasir" means "cashier" or "POS", so this appears to be a deliberate localization choice rather than an oversight—the entire application uses Indonesian labels (barang-masuk, inventaris, kedaluwarsa, laporan).

RetailShell's navigation array correctly references `/kasir`:

```typescript
const navigationItems: NavigationItem[] = [
  {
    label: 'Kasir',
    href: '/kasir',
    icon: '🛒',
  },
  // ...
];
```

The page file exists, renders correctly, exports metadata, and follows all design system conventions. The issue is purely a mismatch between the review spec's expected path (`/pos`) and the implemented path (`/kasir`). Next.js routing is file-based, so the URL path is determined by the folder name. Users navigating to `/pos` will get a 404; only `/kasir` will resolve.

To resolve: either rename `src/app/(dashboard)/kasir` to `src/app/(dashboard)/pos` and update RetailShell's navigation href, or acknowledge that the spec file list was incorrect and the localized naming convention (`/kasir`) is the intended design. The latter seems more likely given that all other routes also use Indonesian names.

## Layout architecture and component relationships

The dashboard layout structure follows Next.js App Router conventions cleanly. The route group `(dashboard)` contains a `layout.tsx` that wraps all child pages:

```typescript
export default function DashboardLayout({ children }) {
  const [isOffline, setIsOffline] = useState(false);
  // ... online/offline detection via navigator.onLine
  return <RetailShell isOffline={isOffline}>{children}</RetailShell>;
}
```

This layout is a client component (`'use client'`) because it uses hooks (useState, useEffect) for offline detection. The children pages are server components that export metadata and don't use hooks. This is the correct Next.js pattern: layout handles interactivity, pages handle data fetching and SEO.

RetailShell is also a client component—it manages sidebar toggle state and uses `usePathname()` for active link detection. The sidebar renders twice: once for desktop (visible on `md:` breakpoint and above), once for mobile (absolutely positioned, slides in from left when toggle state is true). Both sidebar instances share the same navigation array and active-state logic. Mobile version includes an overlay (`<div className="fixed inset-0 z-40 bg-black/50" />`) that closes the sidebar on click.

Navigation active state uses `pathname?.startsWith(item.href)`, so `/kasir/checkout` would correctly highlight the Kasir nav item. Links use Next.js `<Link>` with proper `aria-current="page"` on active items. Focus states use `focus:ring-2 focus:ring-primary focus:ring-offset-2`.

## Page structure and PageHeader usage

All six pages follow the same structural pattern:

1. Metadata export at the top (title, description)
2. PageHeader component with title, description, breadcrumbs, and optional actions
3. Content wrapped in Cards with CardHeader/CardTitle/CardContent
4. Placeholder data in tables or grid layouts
5. TODO comments noting WatermelonDB integration points

Example from Inventaris page:

```typescript
export const metadata: Metadata = {
  title: 'Inventaris & Stok Opname',
  description: 'Kelola stok dan lakukan stok opname',
};

export default function InventarisPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Inventaris & Stok Opname"
        description="Kelola stok dan lakukan stok opname"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inventaris' },
        ]}
        actions={<Button variant="outline">Mulai Stok Opname</Button>}
      />
      {/* ... content */}
    </div>
  );
}
```

PageHeader is a server component (no 'use client' directive) but can accept React nodes via the `actions` prop, which can include client components like Button. This works because Server Components can render Client Components—the boundary is one-directional.

Breadcrumbs in PageHeader render as `<nav aria-label="Breadcrumb">` with proper semantic structure. Last item is marked `aria-current="page"` and styled with `font-medium`. Separator chevrons have `aria-hidden="true"`. Non-last items render as `<a>` tags (not Next.js Link—likely intentional for simplicity since breadcrumbs aren't critical navigation).

## Component imports and TypeScript safety

All imports resolve correctly. Components are imported from `@/shared/components` which re-exports from both legacy wrapper files and shadcn ui/ subfolder:

```typescript
// From @/shared/components/index.ts
export * from './Badge';  // re-exports from ui/badge
export * from './Button'; // re-exports from ui/button
export * from './Card';   // re-exports from ui/card
export * from './ui/card'; // also directly exports shadcn components
```

This dual-export strategy supports backward compatibility. Pages can import `{ Card }` or `{ Card, CardHeader, CardContent }` and get the same components either way.

TypeScript interfaces are properly defined:
- `RetailShellProps` exports from RetailShell.tsx
- `PageHeaderProps` exports from PageHeader.tsx
- `ButtonProps`, `BadgeProps`, `InputProps`, `CardProps` all export from their respective files
- All use `React.forwardRef` with proper generic types

No `any` types observed. Props that accept React nodes are typed as `React.ReactNode`. Optional props use `?:` syntax and have sensible defaults (e.g., `isOffline = false`, `variant = "neutral"`).

## Design system adherence

All components use Tailwind utility classes exclusively. No inline styles or `<style>` tags found. Custom utility `cn()` is used for conditional class merging:

```typescript
className={cn(
  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
  'min-h-[44px]',
  isActive
    ? 'bg-primary/10 text-primary font-semibold'
    : 'text-gray-700 hover:bg-gray-100'
)}
```

Touch targets meet the 44px minimum. Buttons default to `h-10` (40px) but pages apply `min-h-[44px]` classes where needed. Navigation links in RetailShell explicitly set `min-h-[44px]`. Table rows use `min-h-[52px]` for comfortable touch targets in list views.

Design tokens are applied via Tailwind config. Color classes like `bg-primary`, `text-primary`, `border-gray-200` reference the extended palette defined in tailwind.config.ts. Border radius uses `rounded-lg` (14px), `rounded-md` (10px), `rounded-xl` (14px) matching the design system spec. Spacing uses the 4px scale (`gap-3` = 12px, `p-4` = 16px, `p-6` = 24px).

Badge variants map correctly to the design system:
- `success` → green-50/green-700/green-200
- `warning` → yellow-50/yellow-800/yellow-200
- `danger` → red-50/red-700/red-200
- `offline` → orange-50/orange-800/orange-200

Button variants also map correctly, with `primary` using CSS custom properties `bg-primary` and `text-white`, `secondary` using transparent background with 2px border.

Tables follow the spec: header rows use `bg-gray-50`, body rows have hover states (`hover:bg-gray-50`), minimum row height enforced. Cells use semantic alignment (numbers right-aligned, status badges centered, text left-aligned).

## Server vs client component boundaries

Correct server/client boundaries throughout:

**Client Components** (have 'use client'):
- `RetailShell.tsx` — uses useState for sidebar toggle, usePathname for active detection
- `(dashboard)/layout.tsx` — uses useState and useEffect for offline detection

**Server Components** (no directive, are server components by default):
- All page.tsx files — export metadata, no hooks, can be pre-rendered
- `PageHeader.tsx` — no hooks, accepts React nodes as props

The pattern is correct: interactivity and browser APIs (navigator.onLine, usePathname) live in client components; content pages are server components for better performance and SEO. Client components can receive server components as children via the children prop, which is what DashboardLayout does.

No build-breaking mistakes observed: no server-only imports (fs, path) in client components, no hooks in server components, no attempt to serialize functions across the boundary.

## Placeholder data and WatermelonDB integration points

All pages contain placeholder data rather than live database queries. This is expected for layout/structure review—data integration is a separate concern. Each page includes TODO comments marking where WatermelonDB integration will happen:

- Kasir: `{/* TODO: WatermelonDB integration for products */}`
- Barang Masuk: `{/* TODO: WatermelonDB integration for batch tracking */}`
- Inventaris: `{/* TODO: WatermelonDB integration for real-time stock */}`
- Kedaluwarsa: `{/* TODO: WatermelonDB integration for batch expiry tracking */}`
- Laporan: `{/* TODO: WatermelonDB integration for COGS and profit calculation */}`

Placeholder arrays use `.map()` to render table rows or card grids. Data structures mirror the expected shape: products have SKU/name/price, batches have expiry dates, shifts have cashier/start/end times. This is good practice for structure review—placeholder data validates the rendering logic without requiring backend implementation.

Tables use hardcoded data but include proper key props (usually `item.sku` or `item.batch` or loop index for unique row identification). No React key warnings would occur.

## Masuk page (login/role selector)

The `/masuk` page sits outside the dashboard layout—it's at `src/app/masuk/page.tsx`, not in the `(dashboard)` group, so it doesn't get wrapped by RetailShell. This is correct: a login page shouldn't have the full dashboard chrome.

The page renders three role cards (Kasir, Manajer Toko, Pemilik Usaha) as clickable links. Each card uses Next.js `<Link>` wrapped around a `<Card>` component. The `<Link>` has `className="block"` to make the entire card clickable, which is better UX than only having the button inside be clickable.

Links point to `/kasir`, `/inventaris`, and `/laporan` respectively—these are shortcuts that drop users directly into role-appropriate sections. This works because the dashboard pages are accessible without authentication in the current implementation (authentication is stubbed out per the PRD's mention of "Admin registers a device" but not yet implemented).

The page shows an offline capability badge at the bottom: `<Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">` with "Dapat digunakan offline" (Can be used offline). This is informational, not connected to the actual offline detection in DashboardLayout.

</details>

<details>
<summary>File Map</summary>

### Layout Components

**src/shared/layouts/RetailShell.tsx** — Main dashboard shell with responsive sidebar, navigation, and offline indicator. Client component managing sidebar toggle state.

**src/shared/layouts/PageHeader.tsx** — Reusable page header with title, description, breadcrumbs, and action buttons. Server component accepting React nodes as props.

**src/shared/layouts/index.ts** — Barrel export for layout components.

### Dashboard Pages

**src/app/(dashboard)/layout.tsx** — Dashboard route group layout that wraps all child pages in RetailShell. Handles offline detection via navigator.onLine.

**src/app/(dashboard)/kasir/page.tsx** — POS/Cashier page with product browser and cart. Uses two-column layout on large screens. (Note: Expected at `/pos` per spec but implemented at `/kasir`.)

**src/app/(dashboard)/barang-masuk/page.tsx** — Inbound goods receiving page with form and recent transactions list. Two-column layout.

**src/app/(dashboard)/inventaris/page.tsx** — Inventory management page with stats cards and product table. Includes search input and stock status badges.

**src/app/(dashboard)/kedaluwarsa/page.tsx** — Expiry management and FEFO queue. Three-column timeline cards (7/14/30 days) and priority table.

**src/app/(dashboard)/laporan/page.tsx** — Reports page with profit summary cards, shift report table, and top products list. Multi-column stats grid.

### Login/Role Selector

**src/app/masuk/page.tsx** — Login page outside dashboard layout. Three role cards (Kasir, Manajer Toko, Pemilik Usaha) as clickable links.

</details>
