# Design Document: Form Validation Migration (RHF + Zod)

## Overview

This design migrates six form surfaces from ad-hoc `useState` validation to **react-hook-form (RHF) + zod**. The goal is per-field inline errors, co-located per-feature schemas, and preserved existing Tailwind styling and non-form behavior. Server/API errors continue to use sonner toast; client-side field validation never uses toast.

Three shared pieces are introduced to keep the six migrations consistent and DRY:
1. **Per-feature Zod schemas** in three `schemas.ts` files (auth, tenants, inventory).
2. A tiny **`<FieldError>`** shared component + a `fieldBorder()` helper for the inline-error display pattern (Requirement 11).
3. A pure **`computeDiff()`** helper extracted from StoreTab so the diff-only PATCH logic is testable in isolation.

No existing Tailwind `className` strings, UI structure, or non-form behaviors are altered. The PIN keypad remains `useState`-driven and is bridged into RHF via a ref.

## Architecture

```
src/
├── core/
│   └── auth/
│       └── schemas.ts            # deviceRegistrationSchema, kasirLoginSchema, adminLoginSchema
├── features/
│   ├── tenants/
│   │   └── schemas.ts            # storeFormSchema, branchFormSchema
│   └── inventory/
│       └── schemas.ts            # productFormSchema, inboundHeaderSchema, inboundLineSchema
└── shared/
    └── components/
        └── forms/
            ├── FieldError.tsx    # <p> inline error element
            └── fieldBorder.ts     # border class helper
src/shared/utils/
└── diff.ts                       # computeDiff() pure helper for StoreForm PATCH
```

### Data flow

Each migrated form follows the same shape:

1. `useForm({ resolver: zodResolver(schema), defaultValues })` initializes RHF state.
2. `register()` / `Controller` binds inputs. The PIN keypad is exempt (see Kasir section).
3. On submit, RHF runs Zod validation. Invalid fields get `errors[fieldName]`.
4. Invalid submission stops before the API call; inline `<FieldError>` renders below each bad field.
5. Valid submission runs the existing API call (unchanged endpoint, unchanged payload shape). Server errors go to `sonner toast.error`.

### Scope boundary — what does NOT change

- Endpoint URLs, request methods, and payload key names.
- Tailwind `className` strings on inputs, selects, labels, and layout wrappers.
- Non-form UI: role selector, keypad buttons, dot indicator, tables, status badges, dialogs.
- The `getAuthHeaders()` / `getDeviceToken()` / `setSessionToken()` auth helpers.

## Components and Interfaces

### Shared: `<FieldError>` (Requirement 11)

A minimal presentational component so every form renders inline errors identically.

```tsx
// src/shared/components/forms/FieldError.tsx
import { ReactNode } from 'react';

interface FieldErrorProps {
  children?: ReactNode;
}

/** Renders the single inline error below a field. Renders nothing when no error. */
export function FieldError({ children }: FieldErrorProps) {
  if (!children) return null;
  return <p className="text-xs text-red-500 mt-1">{children}</p>;
}
```

Only the first error message per field is shown (RHF already surfaces one message per field by default). When the field becomes valid, `errors[field]` is `undefined`, so `<FieldError>` returns `null` and is removed from the DOM — satisfying Requirement 11.3.

### Shared: `fieldBorder()` helper (Requirement 11.4)

Inputs across the forms use two default border tokens: `border-[#cbd2dc]` (auth/store/inbound) and `border-[#d1d5db]` (branch/product). A helper swaps in `border-red-500` on error and preserves the original otherwise.

```ts
// src/shared/components/forms/fieldBorder.ts

/**
 * Returns the input border className.
 * When the field has an error, replaces the default border with `border-red-500`.
 * `defaultBorder` is the form's normal border token (e.g. 'border-[#cbd2dc]').
 */
export function fieldBorder(
  hasError: boolean,
  defaultBorder: string,
): string {
  return hasError ? 'border-red-500' : defaultBorder;
}
```

Usage in a registered field:

```tsx
<input
  {...register('tenantCode')}
  className={cn(
    'w-full min-h-[46px] px-3 text-base rounded-[10px] focus:outline-none focus:ring-[3px] focus:ring-[#e2f2ee]',
    fieldBorder(!!errors.tenantCode, 'border-[#cbd2dc]'),
    !errors.tenantCode && 'focus:border-[#0f6d5f]',
  )}
/>
<FieldError>{errors.tenantCode?.message}</FieldError>
```

### Shared: `computeDiff()` (Requirement 7.2)

Extracted from StoreTab so the diff logic is a pure, testable function.

```ts
// src/shared/utils/diff.ts

/**
 * Returns a partial object containing only keys where `current` differs from `original`.
 * Used by StoreForm to build a PATCH payload of changed fields only.
 */
export function computeDiff<T extends Record<string, unknown>>(
  original: T,
  current: T,
): Partial<T> {
  const changed: Partial<T> = {};
  (Object.keys(current) as (keyof T)[]).forEach((key) => {
    if (current[key] !== original[key]) {
      changed[key] = current[key];
    }
  });
  return changed;
}
```

## Data Models

All schemas live per-feature. Each uses `z.object(...)` with `required_error` / `min` messages in Indonesian to match the UI language.

### `src/core/auth/schemas.ts` (Requirements 2.1, 2.4, 2.5, 2.6)

```ts
import { z } from 'zod';

export const deviceRegistrationSchema = z.object({
  tenantCode: z.string().min(2, 'Kode Toko minimal 2 karakter'),
  branchCode: z.string().min(2, 'Kode Cabang minimal 2 karakter'),
  deviceName: z.string().min(1, 'Nama perangkat wajib diisi'),
  adminPassword: z.string().min(1, 'Kata sandi admin wajib diisi'),
});

export const kasirLoginSchema = z.object({
  kasirId: z.string().min(1, 'Pilih kasir aktif terlebih dahulu'),
  // pin is validated manually at submit time (see Kasir section)
  pin: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  cabang: z.string().min(1, 'Pilih cabang'),
  rememberDevice: z.boolean(),
});
```

### `src/features/tenants/schemas.ts` (Requirements 2.2, 2.7, 2.8)

```ts
import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().min(1, 'Nama cabang wajib diisi'),
  code: z.string().min(2, 'Kode cabang minimal 2 karakter'),
  address: z.string().optional().default(''),
});

export const storeFormSchema = z.object({
  name: z.string().min(1, 'Nama toko wajib diisi'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Format email tidak valid',
    }),
});
```

### `src/features/inventory/schemas.ts` (Requirements 2.3, 2.9, 2.10, 2.11)

```ts
import { z } from 'zod';

const dateStr = z
  .string()
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Tanggal tidak valid',
  })
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: 'Tanggal tidak valid',
  });

export const productFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  unit: z.string().min(1, 'Satuan wajib diisi').default('pcs'),
  defaultPrice: z.coerce.number().min(0, 'Harga jual tidak boleh negatif'),
});

export const inboundHeaderSchema = z.object({
  supplier: z.string().min(1, 'Supplier wajib diisi'),
  invoice: z.string().min(1, 'Nomor faktur wajib diisi'),
  date: dateStr,
  warehouse: z.string().min(1, 'Gudang tujuan wajib diisi'),
});

export const inboundLineSchema = z.object({
  qty: z.coerce.number().int().min(1, 'Qty minimal 1'),
  cost: z.coerce.number().min(0, 'HPP tidak boleh negatif'),
  margin: z.coerce.number().min(0, 'Margin minimal 0').max(100, 'Margin maksimal 100'),
  batch: z.string().min(1, 'No. batch wajib diisi'),
  expiry: z
    .string()
    .refine((v) => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), {
      message: 'Tanggal kedaluwarsa tidak valid',
    }),
});
```

Note: `z.coerce.number()` lets number inputs (which are `string` in the DOM) validate cleanly while keeping the `number` type in the parsed output.

## Form Migration Details

### Device Registration Form (Requirement 3)

- `useForm({ resolver: zodResolver(deviceRegistrationSchema) })`.
- Each input uses `register()`. The `toUpperCase()` transform is preserved via `onChange` in `register`:
  ```ts
  register('tenantCode', {
    onChange: (e) => e.target.value.toUpperCase(),
  })
  ```
  Actually `register`'s `onChange` must return the value; the cleaner approach is a Zod `transform` or a `setValue` inside `onChange`. Using `setValue` keeps the DOM controlled:
  ```ts
  <input
    {...register('tenantCode')}
    onChange={(e) => setValue('tenantCode', e.target.value.toUpperCase(), { shouldValidate: true })}
  />
  ```
- The existing manual `if (!regTenantCode || ...)` guard is removed; RHF handles it.
- On `/api/auth/register` error, `toast.error(data.error)` is kept; inline errors are untouched.

### Kasir Login Form (Requirement 4)

The PIN keypad stays `useState`-driven. A `useRef` bridges it into RHF.

```ts
const pinRef = useRef('');
// keep ref in sync with the keypad state
useEffect(() => { pinRef.current = pin; }, [pin]);

const { register, handleSubmit, setError, formState: { errors } } = useForm({
  resolver: zodResolver(kasirLoginSchema),
});

const onSubmit = handleSubmit(async (data) => {
  const pin = pinRef.current;
  if (pin.length < 4) {
    setError('pin', { type: 'manual', message: 'PIN harus 4–6 digit angka.' });
    return;
  }
  if (!data.kasirId) {
    setError('kasirId', { type: 'manual', message: 'Pilih kasir aktif terlebih dahulu.' });
    return;
  }
  // existing fetch to /api/auth/pin-verify unchanged
});
```

- `kasirId` select is registered with RHF. PIN keypad buttons, dot indicator, and hidden PIN `<input>` are NOT registered (Requirement 4.5).
- The inline error for `pin` renders below the dot-indicator via `<FieldError>{errors.pin?.message}</FieldError>`.
- `formRef.current?.requestSubmit()` from the physical-key handler now triggers `onSubmit` (RHF's `handleSubmit`).

### Admin/Owner Login Form (Requirement 5)

- `useForm({ resolver: zodResolver(adminLoginSchema) })`.
- `email`, `password`, `cabang` (select), and `rememberDevice` (checkbox) are all registered.
- The `showPassword` toggle remains `useState` (it is UI-only, not form data).
- The `selectedCabang` filtering by role remains outside RHF — RHF holds the chosen value, the visible options list is computed as today.
- On `/api/auth/login` error: `toast.error`.

### BranchForm (Requirement 6)

- `useForm({ resolver: zodResolver(branchFormSchema) })`.
- `address` becomes a `<textarea>` (replacing the current `<input type="text">`). Existing Tailwind classes are preserved.
- `handleCancel` calls `reset()` (clears values + errors).
- After successful `POST /api/branches`, call `reset()` to clear the form for the next entry.
- The `toUpperCase()` on `code` is preserved via `setValue('code', e.target.value.toUpperCase(), { shouldValidate: true })`.

### StoreForm (Requirement 7)

- `useForm({ resolver: zodResolver(storeFormSchema) })`.
- After tenant data loads, call `reset(loadedValues)` to populate fields (Requirement 7.1). Keep `original` snapshot in a `ref` for diff.
- On submit, `handleSubmit` calls `computeDiff(original, currentValues)` to build the partial PATCH payload. If empty, show `toast.info('Tidak ada perubahan...')` and return (preserves current behavior).
- Cancel button calls `reset(original)` (Requirement 7.7).
- `address` stays a `<textarea>` (already is).

### ProductDialog (Requirement 8)

- `useForm({ resolver: zodResolver(productFormSchema) })`.
- On open in edit mode: `reset(existingProductValues)`. Note `defaultPrice` must be coerced to string for the input then parsed back by `z.coerce.number()`.
- On close: `reset(EMPTY_FORM)` where `EMPTY_FORM = { name: '', sku: '', unit: 'pcs', defaultPrice: '' }`.
- The dialog `onOpenChange` callback triggers `reset(EMPTY_FORM)` when closing.

### InboundHeaderForm (Requirement 9)

- `supplier`, `invoice`, `date`, `warehouse` managed by the same `useForm` instance as the lines (Requirement 10.1 uses one form).
- On "Simpan penerimaan" click, call `handleSubmit(onSave)`. If validation fails, inline errors appear and the confirmation dialog does NOT open (Requirement 9.2).

### InboundLineForm with useFieldArray (Requirement 10)

- Replace `useState<ReceivingLine[]>` with `useFieldArray({ control, name: 'lines' })` on the same form instance as the header.
- Default new row: `{ qty: 1, cost: 0, margin: 20, batch: '', expiry: '' }`.
- Per-row derived values (sell price, subtotal) are computed from `watch()` output, not stored as separate state:
  ```ts
  const watchedLines = watch('lines');
  const sellPrice = (row: typeof watchedLines[number]) => row.cost * (1 + row.margin / 100);
  const subtotal = (row: typeof watchedLines[number]) => row.qty * row.cost;
  ```
- `append` (barcode scan / manual add) and `remove` use the `useFieldArray` methods, which keep RHF state and errors in sync automatically (Requirement 10.6).
- Perishable expiry validation: at submit, a custom `validate` or a manual `setError` per row when `perishable && !expiry`.

## Error Handling

- **Client-side field errors** (Zod/RHF): rendered inline via `<FieldError>`. Never toast. `border-red-500` on the input.
- **Server errors** (non-ok response): `sonner toast.error(data.error || fallback)`. Inline field errors are left intact (Requirement 3.4).
- **Network errors** (catch block): `toast.error('Koneksi gagal. Periksa jaringan internet.')` — preserved from existing code.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Device registration schema accepts valid and rejects invalid inputs

For any strings `tenantCode` (length >= 2), `branchCode` (length >= 2), `deviceName` (length >= 1), and `adminPassword` (length >= 1), `deviceRegistrationSchema.parse()` SHALL succeed; for any input where any required field is shorter than its minimum, `safeParse()` SHALL return a failed result naming that field.

**Validates: Requirements 2.4**

### Property 2: Admin login schema validates email format

For any string containing a valid email address, `adminLoginSchema` SHALL parse the `email` field successfully; for any string without an `@` symbol, `adminLoginSchema.safeParse()` SHALL fail with an error on the `email` field. For any empty `password`, `cabang`, or non-boolean `rememberDevice`, the parse SHALL fail on that field.

**Validates: Requirements 2.6**

### Property 3: Branch form schema accepts required fields and optional address

For any non-empty `name` and `code` of length >= 2, `branchFormSchema.parse()` SHALL succeed regardless of whether `address` is provided, empty, or omitted. For any `name` shorter than 1 or `code` shorter than 2, `safeParse()` SHALL fail naming that field.

**Validates: Requirements 2.7**

### Property 4: Store form schema conditionally validates email

For any non-empty `name`, `storeFormSchema` SHALL parse successfully when `email` is empty or a valid email, and SHALL fail on the `email` field when `email` is non-empty and not a valid email format.

**Validates: Requirements 2.8**

### Property 5: Product form schema enforces non-negative price

For any non-empty `name`, `sku`, `unit`, and `defaultPrice` >= 0, `productFormSchema.parse()` SHALL succeed and `defaultPrice` SHALL be a number. For any negative `defaultPrice`, `safeParse()` SHALL fail on `defaultPrice`.

**Validates: Requirements 2.9**

### Property 6: Inbound header schema validates date format

For any `supplier`, `invoice`, and `warehouse` non-empty, and `date` matching `YYYY-MM-DD` that is a real calendar date, `inboundHeaderSchema.parse()` SHALL succeed. For any `date` not matching `YYYY-MM-DD` or not a real date, `safeParse()` SHALL fail on `date`.

**Validates: Requirements 2.10**

### Property 7: Inbound line schema enforces ranges and optional expiry

For any integer `qty` >= 1, `cost` >= 0, `margin` in [0, 100], non-empty `batch`, and `expiry` either empty or a valid `YYYY-MM-DD`, `inboundLineSchema.parse()` SHALL succeed. For any `qty` < 1, `cost` < 0, `margin` outside [0, 100], empty `batch`, or invalid `expiry`, `safeParse()` SHALL fail naming that field.

**Validates: Requirements 2.11**

### Property 8: Diff helper returns only changed keys

For any two form-state objects `original` and `current` of the same shape, `computeDiff(original, current)` SHALL return an object containing exactly the keys where `current[key] !== original[key]`, each mapped to `current[key]`. When `original` and `current` are deeply equal, the result SHALL be an empty object.

**Validates: Requirements 7.2**

### Property 9: Inbound line derived calculations are correct

For any `qty` >= 1, `cost` >= 0, and `margin` in [0, 100], the sell price SHALL equal `cost * (1 + margin / 100)` and the subtotal HPP SHALL equal `qty * cost`, computed from the `watch()` output without separate state.

**Validates: Requirements 10.7**

### Property 10: Inline error element is absent when field is valid

For any registered form field, when `formState.errors[fieldName]` is undefined, `<FieldError>` SHALL render nothing (null), so no error element appears in the DOM for that field.

**Validates: Requirements 11.3**

## Testing Strategy

- **Property tests** (fast-check, >= 100 iterations): Properties 1–9 cover the pure Zod schemas, `computeDiff`, and the derived-calculation helpers. These run fast and in-memory.
- **Example tests**: Each form's specific UI behaviors (error border, toast on server error, reset on close/cancel, PIN state ref bridge) are covered by example-based component tests with representative inputs.
- **Smoke check**: `package.json` dependency presence (Requirements 1.1–1.3) is a single assertion, not a property test.

Property tests must be tagged: **Feature: form-validation-rhf-zod, Property N: {property_text}**.
