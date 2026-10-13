# FEAT-002 Verification Guide

## Implementasi yang Diselesaikan

### 1. Design Tokens (`src/shared/styles/tokens.ts`)
- ✅ Export colors, spacing, borderRadius dari tailwind.config.ts
- ✅ CSS variable helpers: `cssVar()` dan `cssVarWithOpacity()`
- ✅ Touch target constants (minHeight: 44px, minWidth: 44px)
- ✅ Typography scale dan z-index layering

### 2. RetailShell Layout (`src/shared/layouts/RetailShell.tsx`)
- ✅ Side navigation dengan 4 menu: POS, Inventory, Reports, Settings
- ✅ Icons menggunakan lucide-react (ShoppingCart, Package, BarChart3, Settings)
- ✅ Top bar dengan offline indicator (Badge variant='offline' + WifiOff icon)
- ✅ Responsive: sidebar collapse ke hamburger menu di < 768px
- ✅ Mobile overlay backdrop saat sidebar terbuka
- ✅ Keyboard accessible dengan focus:ring dan ARIA labels
- ✅ Touch-friendly: min-h-[44px] untuk semua touch targets

### 3. PageHeader Component (`src/shared/layouts/PageHeader.tsx`)
- ✅ Props: title, description, breadcrumbs, actions, children
- ✅ Breadcrumbs dengan ChevronRight separator
- ✅ Responsive layout: flex-col pada mobile, flex-row pada desktop
- ✅ Action slots untuk buttons di sebelah kanan

### 4. Layout Integration
- ✅ Menggunakan route groups approach: `src/app/(dashboard)/layout.tsx`
- ✅ Wrap children dengan RetailShell
- ✅ Deteksi online/offline status dengan navigator.onLine dan window events
- ✅ Client component ('use client') untuk browser API access

### 5. Dependencies
- ✅ lucide-react installed untuk icon library (shadcn ecosystem)

## Cara Verifikasi

### Build Test
```bash
cd /Users/macbookpro/Documents/Projects/offline-pos-inventory
npm run build
```
**Expected:** Build sukses tanpa TypeScript errors

### Lint Test
```bash
npm run lint
```
**Expected:** Pass (existing warnings tidak terkait FEAT-002)

### Visual Check
```bash
npm run dev
```
Buka browser: http://localhost:3000/pos

**Expected:**
1. Sidebar muncul di sebelah kiri dengan 4 menu items
2. Top bar menampilkan hamburger button (mobile) dan offline indicator
3. PageHeader dengan breadcrumbs "Dashboard > POS"
4. Responsive test:
   - Desktop (>= 768px): Sidebar fixed visible
   - Mobile (< 768px): Sidebar hidden, hamburger button muncul
   - Click hamburger: Sidebar slide in dengan backdrop overlay

### Responsive Test
Resize browser width atau gunakan DevTools responsive mode:
- 1024px: Full desktop layout
- 768px: Sidebar visible (desktop)
- 767px: Sidebar hidden, hamburger muncul (mobile)
- 375px: Mobile layout optimal

### Keyboard Navigation Test
1. Tab key untuk navigate melalui menu items
2. Enter/Space untuk activate links
3. Escape key untuk close mobile sidebar (implementasi future)
4. Focus ring visible pada setiap interactive element

### Offline Mode Test
1. Buka DevTools > Network tab
2. Checkbox "Offline" untuk simulate offline
3. Badge "Offline" dengan orange color muncul di top bar
4. Toggle online/offline untuk verifikasi dynamic update

## Files Created/Modified

### New Files
- `src/shared/styles/tokens.ts`
- `src/shared/layouts/RetailShell.tsx`
- `src/shared/layouts/PageHeader.tsx`
- `src/shared/layouts/index.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/pos/page.tsx` (demo page)

### Modified Files
- `package.json` (added lucide-react)
- `.agents/tasks/features/FEAT-002.json` (status: completed)

## Design System Compliance

✅ Touch targets: min 44px height untuk semua interactive elements
✅ Keyboard accessible: ARIA labels, focus states, semantic HTML
✅ Responsive: Mobile-first dengan breakpoint 768px
✅ Design tokens: Konsisten dengan tailwind.config.ts
✅ Color palette: Primary (#0f6d5f), Accent (#12507f) untuk active states
✅ Border radius: 10px (md) untuk cards/containers
✅ Spacing: Konsisten menggunakan tailwind spacing scale

## Next Steps

FEAT-002 selesai. Lanjut ke FEAT berikutnya sesuai task plan.
