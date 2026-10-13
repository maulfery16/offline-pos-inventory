# Implementation Plan: Migrasi Full ke shadcn UI dan Implementasi Layout Components

## Ringkasan Eksplorasi

Project ini adalah Next.js 14 App Router dengan TypeScript, TailwindCSS 3.4.4, dan next-pwa untuk PWA support. Komponen UI existing sudah ada (Button, Input, Badge, Card, Table, Modal, Toast, SearchInput) di `src/shared/components/`, tetapi AKAN DIGANTI dengan shadcn UI untuk keseragaman dan ecosystem compatibility yang lebih baik. Design tokens sudah dikonfigurasi di `tailwind.config.ts` dengan primary color #0f6d5f dan accent #12507f.

**Issue Kritis**: `src/app/globals.css` memiliki error `border-border class does not exist` yang menghalangi build. Ini harus diperbaiki terlebih dahulu.

**Strategi shadcn**: FULL MIGRATION - Install shadcn base components dan buat custom wrapper untuk preserve API compatibility dengan kode existing. Semua komponen akan menggunakan shadcn sebagai foundation dengan custom variants untuk project requirements (danger button, offline badge, dll).

**Dependencies yang Perlu Diinstal**: @radix-ui packages (via shadcn CLI), class-variance-authority, clsx, tailwind-merge (sudah ada), tailwindcss-animate (sudah ada).

---

## Implementation Plan

- [ ] 1. **Perbaiki globals.css dan inisialisasi shadcn UI**
      
      Perbaiki `src/app/globals.css` dengan template shadcn standar (CSS variables untuk light/dark mode) disesuaikan dengan design tokens project. Buat `components.json` dan install shadcn base components: button, input, badge, card, table, dialog, dropdown-menu.
      
      **Files**:
      - `src/app/globals.css` (modify - ganti dengan shadcn CSS variables template)
      - `components.json` (create - config shadcn)
      - `src/shared/components/ui/button.tsx` (create via CLI)
      - `src/shared/components/ui/input.tsx` (create via CLI)
      - `src/shared/components/ui/badge.tsx` (create via CLI)
      - `src/shared/components/ui/card.tsx` (create via CLI)
      - `src/shared/components/ui/table.tsx` (create via CLI)
      - `src/shared/components/ui/dialog.tsx` (create via CLI)
      - `tailwind.config.ts` (modify - ensure tailwindcss-animate plugin)
      
      **Rationale**: shadcn menyediakan foundation yang solid dengan Radix UI primitives, accessible by default, dan mudah customize.
      
      **Verify**: `npm run build` sukses. `ls src/shared/components/ui/` untuk verifikasi files ada. Test import dan render satu component.

- [ ] 2. **Migrate komponen existing ke shadcn wrapper**
      
      Backup komponen existing (.old.tsx). Buat wrapper di `src/shared/components/` yang import dari `ui/` dan menambahkan custom props/variants untuk preserve API compatibility. Custom variants: Button danger/ghost, Badge offline, Input dengan leftIcon/rightIcon, Modal menjadi Dialog wrapper.
      
      **Files**:
      - `src/shared/components/Button.tsx` (replace dengan wrapper)
      - `src/shared/components/Input.tsx` (replace dengan wrapper)
      - `src/shared/components/Badge.tsx` (replace dengan wrapper)
      - `src/shared/components/Card.tsx` (replace dengan wrapper)
      - `src/shared/components/Table.tsx` (replace dengan wrapper)
      - `src/shared/components/Dialog.tsx` (create wrapper untuk Modal API)
      - `src/shared/components/SearchInput.tsx` (update untuk use shadcn Input wrapper)
      - `src/shared/components/index.ts` (update exports)
      
      **Rationale**: Wrapper layer memungkinkan migration tanpa breaking changes, sambil mendapat benefit dari shadcn foundation.
      
      **Verify**: `npm run build` sukses. Test render setiap wrapper dengan berbagai props untuk verify API compatibility. Visual comparison styling.

- [ ] 3. **Implementasi design tokens dan layout system**
      
      Buat tokens.ts TypeScript constants. Implementasi RetailShell dengan shadcn Sheet untuk mobile menu dan Card untuk desktop sidebar. PageHeader dengan shadcn Button untuk actions dan optional Breadcrumb.
      
      **Files**:
      - `src/shared/styles/tokens.ts` (create)
      - `src/shared/layouts/RetailShell.tsx` (create - use shadcn Sheet + Card)
      - `src/shared/layouts/PageHeader.tsx` (create - use shadcn Button + Breadcrumb)
      - `src/shared/layouts/index.ts` (create)
      - Install: `npx shadcn-ui@latest add sheet breadcrumb`
      
      **Rationale**: shadcn Sheet memberikan mobile menu yang smooth dan accessible. RetailShell sebagai main app container dengan consistent navigation.
      
      **Verify**: `npm run dev` dan visual check sidebar + mobile menu. Test responsive behavior dan keyboard navigation (Tab, Enter, Escape).

- [ ] 4. **Implementasi ProductCard dan update Toast**
      
      ProductCard menggunakan shadcn Card + Skeleton untuk loading. Quick actions dengan DropdownMenu atau Button overlay. Update Toast system menggunakan shadcn Sonner untuk notifications yang lebih smooth.
      
      **Files**:
      - `src/shared/components/ProductCard.tsx` (create - use shadcn Card + Skeleton + DropdownMenu)
      - `src/shared/components/Toast.tsx` (update atau replace dengan Sonner)
      - Install: `npx shadcn-ui@latest add skeleton dropdown-menu sonner`
      
      **Rationale**: shadcn Skeleton untuk loading states yang professional. Sonner untuk toast notifications dengan better UX. DropdownMenu accessible by default.
      
      **Verify**: `npm run dev` dan render ProductCard grid. Test loading skeleton, hover interactions, toast notifications. Keyboard test.

- [ ] 5. **Integrate RetailShell dengan App Router**
      
      Update `src/app/layout.tsx` atau buat `(dashboard)/layout.tsx` route group untuk wrap dengan RetailShell. Auth pages tetap menggunakan minimal layout.
      
      **Files**:
      - `src/app/(dashboard)/layout.tsx` (create - wrap dengan RetailShell) atau
      - `src/app/layout.tsx` (modify - conditional RetailShell)
      
      **Rationale**: Route groups pattern cleanly separates authenticated vs auth layouts.
      
      **Verify**: `npm run dev`, navigate pages, RetailShell muncul dengan navigation functional.

- [ ] 6. **Final verification, cleanup, dan documentation**
      
      Full build test, lint check, delete .old.tsx backup files, update component documentation di README atau COMPONENTS.md.
      
      **Files**: All modified files
      
      **Verify**: 
      - `npm run build` sukses tanpa warnings
      - `npm run lint` pass
      - Visual inspection: responsive, accessible, consistent styling
      - Delete backup .old.tsx files
      - Update documentation

---

## Catatan Implementasi

### Apakah shadcn perlu diinisialisasi via CLI?

**YA, via CLI untuk base components**. Setup approach:
1. Buat `components.json` manual dengan config yang sesuai project
2. Install base components via CLI: `npx shadcn-ui@latest add button input badge card table dialog dropdown-menu`
3. Additional components on-demand: `npx shadcn-ui@latest add sheet breadcrumb skeleton sonner`
4. `tsconfig.json` sudah benar dengan `@/*` alias
5. `next.config.js` sudah compatible

### Dependensi @radix-ui yang perlu diinstal

Via shadcn CLI, akan terinstall otomatis:
- `@radix-ui/react-dialog` (untuk Dialog/Modal)
- `@radix-ui/react-dropdown-menu` (untuk DropdownMenu)
- `@radix-ui/react-slot` (untuk Slot composition)
- `class-variance-authority` (untuk variant management)
- Plus dependencies lain sesuai component yang diinstall

### Urutan implementasi

1. **Fix critical blocker** (globals.css) + setup shadcn config
2. **Design tokens** untuk type-safe constants
3. **Layout system** (RetailShell + PageHeader)
4. **ProductCard** component
5. **Integration** dengan App Router
6. **Final verification**

### Urutan implementasi

1. **Fix critical blocker + full shadcn setup** (globals.css + install base components via CLI)
2. **Migrate existing components** ke shadcn wrapper dengan custom variants
3. **Design tokens + Layout system** (tokens.ts + RetailShell + PageHeader dengan shadcn)
4. **ProductCard + Toast** menggunakan shadcn Skeleton, DropdownMenu, Sonner
5. **Integration** dengan App Router
6. **Final verification dan cleanup**

Urutan ini dependency-based: shadcn foundation → wrapper migration → layouts → advanced components → integration.

### Integrasi dengan Next.js App Router

Gunakan **route groups** pattern:
- `src/app/(auth)/login/page.tsx` - minimal layout tanpa sidebar
- `src/app/(dashboard)/layout.tsx` - wrap dengan RetailShell
- `src/app/(dashboard)/pos/page.tsx`, etc - inherit RetailShell

Alternative jika tidak pakai route groups: conditional rendering di root layout berdasarkan pathname.

### Strategi dark mode

CSS variables di `globals.css` sudah disiapkan untuk dark mode. `tailwind.config.ts` sudah set `darkMode: ['class']`. Implementation:
1. Define `.dark` class variants di globals.css
2. Toggle dengan JavaScript (`document.documentElement.classList.toggle('dark')`)
3. Persist preference di localStorage
4. Zustand store untuk global theme state (optional)

Untuk phase ini, setup CSS variables untuk dark mode support, implementasi toggle UI bisa di future FEAT.

---

## Technical Constraints dari Spec

- **Touch targets**: Minimum 44x44px untuk semua interactive elements
- **Keyboard accessible**: ARIA labels, focus states, keyboard shortcuts
- **Soft deletes**: Tidak relevan untuk UI components, tapi penting untuk data layer
- **Multi-tenant**: Tidak relevan untuk layout components
- **Offline-first**: Badge indicator sudah ada, layout harus graceful saat offline
- **PWA**: Layout harus responsive dan mobile-optimized

---

## File Structure After Implementation

```
src/
├── app/
│   ├── (auth)/              # Route group untuk auth pages (future)
│   │   └── login/
│   ├── (dashboard)/         # Route group dengan RetailShell
│   │   ├── layout.tsx       # Wrap dengan RetailShell
│   │   ├── pos/
│   │   ├── inventory/
│   │   └── reports/
│   ├── globals.css          # shadcn CSS variables
│   ├── layout.tsx           # Root layout dengan Toaster
│   └── page.tsx
├── shared/
│   ├── components/
│   │   ├── ui/              # shadcn primitives (via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── sonner.tsx
│   │   ├── Badge.tsx        # Wrapper dengan custom variants
│   │   ├── Button.tsx       # Wrapper dengan custom variants
│   │   ├── Card.tsx         # Re-export shadcn
│   │   ├── Input.tsx        # Wrapper dengan leftIcon/rightIcon
│   │   ├── Dialog.tsx       # Wrapper untuk Modal API
│   │   ├── ProductCard.tsx  # NEW - use shadcn components
│   │   ├── SearchInput.tsx  # Updated - use shadcn Input
│   │   ├── Table.tsx        # Wrapper dengan custom props
│   │   ├── Toast.tsx        # Updated - Sonner wrapper
│   │   └── index.ts
│   ├── layouts/             # NEW
│   │   ├── RetailShell.tsx  # Use shadcn Sheet
│   │   ├── PageHeader.tsx   # Use shadcn Button/Breadcrumb
│   │   └── index.ts
│   ├── styles/              # NEW
│   │   └── tokens.ts
│   └── utils/
│       └── cn.ts
└── ...
```
