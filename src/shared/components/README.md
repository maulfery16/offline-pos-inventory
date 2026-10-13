# Shared UI Components

This directory contains reusable UI components built with React, TypeScript, and Tailwind CSS, following the design system defined in DESIGN.md.

## Available Components

### Button
Versatile button component with multiple variants and states.

**Variants:** `primary`, `secondary`, `danger`, `ghost`  
**Sizes:** `sm`, `md`, `lg`

```tsx
import { Button } from '@/shared/components';

<Button variant="primary" size="md">Save</Button>
<Button variant="secondary" leftIcon={<PlusIcon />}>Add Item</Button>
<Button variant="danger" isLoading>Deleting...</Button>
```

### Input
Text input with label, validation, and icon support.

```tsx
import { Input } from '@/shared/components';

<Input
  label="Product Name"
  placeholder="Enter product name"
  required
  error={errors.name}
/>

<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>
```

### SearchInput
Specialized search input with search icon and clear functionality.

```tsx
import { SearchInput } from '@/shared/components';

<SearchInput
  placeholder="Search products..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onClear={() => setSearchQuery('')}
/>
```

### Card
Container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/components';

<Card hover clickable>
  <CardHeader>
    <CardTitle>Product Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badge
Status indicator with color variants.

**Variants:** `success`, `warning`, `danger`, `info`, `offline`, `neutral`

```tsx
import { Badge } from '@/shared/components';

<Badge variant="success" dot>Active</Badge>
<Badge variant="warning">Low Stock</Badge>
<Badge variant="offline">Offline Mode</Badge>
```

### Table
Data table with sortable columns and row selection.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead sortable sortDirection="asc">Name</TableHead>
      <TableHead>Price</TableHead>
      <TableHead>Stock</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow selected>
      <TableCell>Product 1</TableCell>
      <TableCell>$99.99</TableCell>
      <TableCell>25</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Modal
Dialog overlay for confirmations and forms.

**Sizes:** `sm`, `md`, `lg`, `xl`

```tsx
import { Modal, ModalFooter } from '@/shared/components';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
  description="Are you sure you want to delete this item?"
  size="md"
>
  <p>This action cannot be undone.</p>
  
  <ModalFooter>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  </ModalFooter>
</Modal>
```

### Toast
Notification system for user feedback.

**Variants:** `success`, `error`, `warning`, `info`

```tsx
import { ToastContainer } from '@/shared/components';
import { useToast } from '@/shared/hooks';

function App() {
  const { toasts, hideToast, success, error, warning, info } = useToast();

  const handleSave = () => {
    success('Product saved successfully!');
  };

  return (
    <>
      <YourContent />
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </>
  );
}
```

## Design Tokens

All components use Tailwind CSS classes that map to our design system:

- **Colors:** `primary`, `accent`, `success`, `warning`, `danger`
- **Spacing:** `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px)
- **Border Radius:** `sm` (6px), `md` (10px), `lg` (14px), `pill` (999px)

## Accessibility

All components are built with accessibility in mind:
- Semantic HTML elements
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Touch-Friendly

Components meet the minimum touch target size of 44×44px and have adequate spacing for mobile use.
