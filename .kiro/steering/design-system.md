# Design System Reference

## Product Vision

A modern, offline-first Point of Sale and inventory management system designed for reliability, speed, and ease of use in retail environments.

This system enables small to medium retail businesses to process transactions and manage inventory seamlessly, even without internet connectivity. When connectivity is restored, all data syncs automatically to the cloud.

## Target Users

- **Cashiers**: Need fast, intuitive transaction processing
- **Store Managers**: Require inventory oversight and reporting
- **Business Owners**: Need multi-location management and analytics

## Core Capabilities

- Process sales transactions offline
- Real-time inventory tracking
- Multi-tenant support for multiple locations
- Automatic sync when online
- Receipt printing and customer management

---

## Design Principles

### 1. Offline-First Architecture
Every interaction must work without internet connectivity. Sync is a background concern, not a prerequisite.

### 2. Speed and Efficiency
Cashiers need to process transactions in seconds, not minutes. Every screen should load instantly, every action should provide immediate feedback.

### 3. Progressive Disclosure
Show only what's needed for the current task. Advanced features are available but not in the way.

### 4. Consistent and Predictable
Use familiar patterns across all screens. Actions should behave the same way everywhere.

### 5. Forgiving and Reversible
Allow users to undo mistakes easily. Provide clear warnings before destructive actions.

### 6. Accessible by Default
Designed for various skill levels and abilities. Keyboard shortcuts, clear labels, sufficient contrast.

---

## Technical Foundation

This project uses **shadcn/ui** components built on top of **Radix UI** and **Tailwind CSS** for styling. All components follow shadcn conventions with TypeScript, forwardRef pattern, and class-variance-authority (cva) for variant management.

### Key Utilities
- `cn()` - Class name merging utility (clsx + tailwind-merge) from `@/shared/utils`
- `cva()` - Class variance authority for variant-based styling
- All components use `forwardRef` with `displayName` for better debugging

### Design Tokens

Colors are defined in `tailwind.config.ts` and `globals.css`:

```typescript
// Tailwind Config
colors: {
  primary: { DEFAULT: '#0f6d5f', hover: '#0b564a', soft: '#e2f2ee' },
  accent: { DEFAULT: '#12507f', soft: '#e4eefa' },
  success: { DEFAULT: '#136b3f', soft: '#e3f4e9' },
  warning: { DEFAULT: '#8a5300', soft: '#fdf0da' },
  danger: { DEFAULT: '#a52b22', soft: '#fbe8e5' },
  gray: { 50: '#f7f8fa', 100: '#f2f4f7', ... 900: '#182230' }
}

// Border Radius
borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '14px', pill: '999px' }

// Spacing (4px scale)
spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px' }
```

CSS Variables in `globals.css` use HSL format:
```css
--primary: 168 78% 24%;
--destructive: 4 65% 39%;
--border: 216 17% 88%;
--ring: 168 78% 24%;
```

---

## Component Specifications

### Buttons

Location: `src/shared/components/ui/button.tsx`

**Implementation:**
```tsx
import { Button } from '@/shared/components/ui/button';

<Button variant="primary" size="md">Click me</Button>
```

**Primary Button**
- Classes: `bg-primary text-white hover:bg-primary-hover`
- Padding: `px-5 py-3` (20px horizontal, 12px vertical)
- Height: `h-10` (40px)
- Border radius: `rounded-lg` (14px)
- Font: `text-base font-semibold`
- Focus: `ring-2 ring-primary ring-offset-2`

**Secondary Button**
- Classes: `bg-transparent border-2 border-gray-400 text-gray-900 hover:bg-gray-50`
- Same padding and sizing as primary

**Danger Button**
- Classes: `bg-destructive text-destructive-foreground hover:bg-destructive/90`
- Used for destructive actions

**Other Variants**
- `ghost` - Transparent with hover state
- `outline` - Border with hover state
- `link` - Text-only with underline on hover

**Sizes**
- `sm` - `h-9 px-3 py-1.5 text-sm`
- `md` - `h-10 px-5 py-3` (default)
- `lg` - `h-11 px-6 py-4 text-lg`
- `icon` - `h-10 w-10` (square button)

**Props**
- `isLoading` - Shows spinner
- `leftIcon` / `rightIcon` - Add icons
- `fullWidth` - Full width button
- `disabled` - Disabled state

### Input Fields

Location: `src/shared/components/ui/input.tsx`

**Implementation:**
```tsx
import { Input } from '@/shared/components/ui/input';

<Input 
  label="Email" 
  type="email" 
  placeholder="Enter email"
  required
  error="Invalid email"
/>
```

**Text Input**
- Height: `h-10` (40px)
- Padding: `px-4 py-3`
- Border: `border border-input` (1px solid)
- Border radius: `rounded-md` (10px)
- Focus: `ring-2 ring-primary ring-offset-2`
- Font: `text-base`

**Props**
- `label` - Label text above input
- `error` - Error message (red border + text below)
- `helperText` - Helper text below input
- `leftIcon` / `rightIcon` - Icons inside input
- `fullWidth` - Full width input
- `required` - Shows asterisk on label

### Cards

Location: `src/shared/components/ui/card.tsx`

**Implementation:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

<Card hover clickable padding="md">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

**Standard Card**
- Background: `bg-white`
- Border: `border` (1px solid)
- Border radius: `rounded-xl` (14px)
- Shadow: `shadow-sm` with `hover:shadow-md` when hover enabled

**Props**
- `hover` - Adds hover shadow effect
- `clickable` - Adds cursor pointer
- `padding` - Options: `none`, `sm` (p-4), `md` (p-6), `lg` (p-8)

**Compound Components**
- `CardHeader` - Header area with bottom margin
- `CardTitle` - `text-lg font-semibold`
- `CardDescription` - `text-sm text-muted-foreground`
- `CardContent` - Main content area
- `CardFooter` - Footer with top border

### Status Badges

Location: `src/shared/components/ui/badge.tsx`

**Implementation:**
```tsx
import { Badge } from '@/shared/components/ui/badge';

<Badge variant="success" dot>Active</Badge>
```

**Structure**
- Padding: `px-3 py-1` (12px horizontal, 4px vertical)
- Border radius: `rounded-full` (pill shape)
- Font: `text-sm font-medium`
- Border: `border` (1px solid)

**Variants**
- `success` - `bg-green-50 text-green-700 border-green-200`
- `warning` - `bg-yellow-50 text-yellow-800 border-yellow-200`
- `danger` - `bg-red-50 text-red-700 border-red-200`
- `info` - `bg-blue-50 text-blue-700 border-blue-200`
- `offline` - `bg-orange-50 text-orange-800 border-orange-200`
- `neutral` - `bg-gray-50 text-gray-700 border-gray-200` (default)

**Props**
- `dot` - Shows colored dot indicator before text
- `variant` - Color variant

### Data Tables

Location: `src/shared/components/ui/table.tsx`

**Implementation:**
```tsx
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from '@/shared/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Header (TableHead)**
- Height: `h-12` (48px)
- Padding: `px-4`
- Font: `font-medium text-muted-foreground`
- Alignment: `text-left align-middle`

**Rows (TableRow)**
- Border: `border-b` (bottom border)
- Hover: `hover:bg-muted/50`
- Selected: `data-[state=selected]:bg-muted`

**Cells (TableCell)**
- Padding: `p-4`
- Alignment: `align-middle`

**Note:** Minimum row height should be enforced at usage level with `min-h-[52px]` class for touch-friendly targets

---

## UI Patterns & Guidelines

### Navigation

**Primary Navigation**
- Side navigation with icons and labels for main modules (POS, Inventory, Reports, Settings)
- Use consistent icon sizing and spacing
- Active state should be clearly visible with `bg-primary-soft` or similar

**Secondary Navigation**
- Contextual tabs within each module
- Consider using shadcn Tabs component

**Breadcrumbs**
- Show hierarchy in deep sections like Settings
- Use chevron separators with subtle text color

### Forms

**Inline Validation**
- Show errors immediately as users type using Input `error` prop
- Example: `<Input error="Email is required" />`

**Required Fields**
- Marked with asterisk (*) when using `required` prop
- Example: `<Input label="Email" required />`

**Action Buttons**
- Primary action on right, cancel/back on left
- Use appropriate variants: primary for submit, secondary/ghost for cancel
- Example: 
  ```tsx
  <div className="flex gap-3 justify-end">
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save</Button>
  </div>
  ```

**Auto-save**
- Draft states saved automatically in offline mode via WatermelonDB
- Show subtle "Saving..." or "Saved" indicator

### Data Display

**Tables**
- Use Table component with sortable columns
- Add pagination for large datasets (>50 rows recommended)
- Ensure rows are touch-friendly: `min-h-[52px]`
- Example:
  ```tsx
  <TableRow className="min-h-[52px]">
    <TableCell>Content</TableCell>
  </TableRow>
  ```

**Status Indicators**
- Use Badge component with appropriate variants
- Add `dot` prop for additional visual indicator
- Example: `<Badge variant="success" dot>Active</Badge>`

**Empty States**
- Centered layout with helpful illustration or icon
- Clear message explaining why it's empty
- Primary action button to add first item
- Consider creating reusable EmptyState component

**Loading States**
- Prefer skeleton screens over spinners for better perceived performance
- Use Button `isLoading` prop for form submissions
- Consider creating Skeleton component for content loading

### Feedback

**Toasts** (Component exists: `src/shared/components/Toast.tsx`)
- For non-critical confirmations
- Position: top-right
- Auto-dismiss after 3-5 seconds
- Use appropriate variants: success, warning, danger, info

**Modals** (Component exists: `src/shared/components/Modal.tsx` + `ui/dialog.tsx`)
- For critical confirmations or multi-step actions
- Use Dialog component from shadcn
- Always provide clear close action
- Example:
  ```tsx
  <Dialog>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Delete</DialogTitle>
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```

**Inline Messages**
- For contextual warnings or information within forms/sections
- Use appropriate color coding (yellow for warning, blue for info)

**Offline Indicator**
- Persistent banner when offline (yellow/warning color)
- Dismissible when acknowledged
- Should reappear on page navigation if still offline
- Consider: `<Badge variant="offline">Offline Mode</Badge>` in header

### Touch-Friendly Design

**Minimum Target Size**
- All interactive elements: minimum 44×44px (Tailwind: `min-h-11 min-w-11`)
- Buttons default to 40px height, ensure proper spacing around them
- For icon-only buttons, use `size="icon"` variant

**Spacing**
- Minimum 8px between touch targets (Tailwind: `gap-2`)
- Recommended 12-16px for comfortable spacing (Tailwind: `gap-3` or `gap-4`)

**Gestures**
- Swipe actions for quick operations in lists (implement with touch event handlers)
- Pull-to-refresh for data lists
- Consider mobile-first design for POS interface

### Accessibility Requirements

**Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Use proper focus states (already handled by shadcn components)
- Test tab order makes logical sense

**Screen Readers**
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure error messages are associated with inputs

**Color Contrast**
- All text must meet WCAG AA standards (4.5:1 for normal text)
- Don't rely on color alone for important information
- Current color palette already optimized for contrast

### Component Implementation Checklist

When creating new components, ensure:
- [ ] Uses `forwardRef` pattern
- [ ] Has `displayName` set
- [ ] Exports TypeScript interface for props
- [ ] Uses `cn()` utility for className merging
- [ ] Uses `cva` for variant-based styling (if applicable)
- [ ] Supports common props: `className`, `disabled`, etc.
- [ ] Has focus states using `ring-2 ring-primary`
- [ ] Meets touch target size (min 44×44px)
- [ ] Has proper TypeScript types
- [ ] Documented with JSDoc comments (optional but recommended)
