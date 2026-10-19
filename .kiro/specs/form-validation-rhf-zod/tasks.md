# Implementation Plan: Form Validation Migration (RHF + Zod)

## Overview

Migrate six form surfaces from ad-hoc `useState` validation to **react-hook-form (RHF) + zod** with per-field inline errors. The implementation proceeds in dependency order: install dependencies → build shared helpers → co-locate per-feature Zod schemas → migrate each form surface → wire inline error display. Pure helpers (`computeDiff`) and Zod schemas get property tests; form surfaces get example-based component tests. No existing Tailwind classNames, endpoint URLs, payload shapes, or non-form UI behaviors are altered.

## Tasks

- [x] 1. Install dependencies and configure shared test harness
  - [x] 1.1 Add RHF, zod, and resolver dependencies to `package.json`
    - Add `react-hook-form` `^7.53.0`, `zod` `^3.23.0`, `@hookform/resolvers` `^3.9.0` to `dependencies` in `package.json`
    - Run `npm install` to update the lockfile
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Build shared form-error primitives and pure helpers
  - [x] 2.1 Create `<FieldError>` inline error component
    - Create `src/shared/components/forms/FieldError.tsx`
    - Component renders `<p className="text-xs text-red-500 mt-1">` only when `children` is truthy, else `null`
    - _Requirements: 11.1, 11.3_

  - [x] 2.2 Create `fieldBorder()` border-class helper
    - Create `src/shared/components/forms/fieldBorder.ts`
    - Export `fieldBorder(hasError, defaultBorder)` returning `'border-red-500'` on error, else the `defaultBorder` token
    - _Requirements: 11.4_

  - [x] 2.3 Create `computeDiff()` pure helper
    - Create `src/shared/utils/diff.ts`
    - Export `computeDiff<T>(original, current)` returning a `Partial<T>` of keys where `current[key] !== original[key]`
    - _Requirements: 7.2_

  - [x]* 2.4 Write property test for `computeDiff` returns only changed keys
    - **Property 8: Diff helper returns only changed keys**
    - **Validates: Requirements 7.2**
    - Tag test: Feature: form-validation-rhf-zod, Property 8

  - [x]* 2.5 Write example tests for `<FieldError>` renders nothing when valid
    - **Property 10: Inline error element is absent when field is valid**
    - **Validates: Requirements 11.3**
    - Assert `<FieldError>` returns `null` when no children passed
    - Tag test: Feature: form-validation-rhf-zod, Property 10

- [x] 3. Create per-feature Zod schemas
  - [x] 3.1 Create `src/core/auth/schemas.ts`
    - Export `deviceRegistrationSchema`, `kasirLoginSchema`, `adminLoginSchema` per design
    - Messages in Indonesian; `kasirLoginSchema.pin` optional (validated manually at submit)
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

  - [x]* 3.2 Write property test for device registration schema accepts valid, rejects invalid
    - **Property 1: Device registration schema accepts valid and rejects invalid inputs**
    - **Validates: Requirements 2.4**
    - Tag test: Feature: form-validation-rhf-zod, Property 1

  - [x]* 3.3 Write property test for admin login schema validates email format
    - **Property 2: Admin login schema validates email format**
    - **Validates: Requirements 2.6**
    - Tag test: Feature: form-validation-rhf-zod, Property 2

  - [x] 3.4 Create `src/features/tenants/schemas.ts`
    - Export `storeFormSchema`, `branchFormSchema` per design
    - `storeFormSchema.email` conditionally validated via `.refine`; optional fields default to `''`
    - _Requirements: 2.2, 2.7, 2.8_

  - [x]* 3.5 Write property test for branch form schema required fields and optional address
    - **Property 3: Branch form schema accepts required fields and optional address**
    - **Validates: Requirements 2.7**
    - Tag test: Feature: form-validation-rhf-zod, Property 3

  - [x]* 3.6 Write property test for store form schema conditionally validates email
    - **Property 4: Store form schema conditionally validates email**
    - **Validates: Requirements 2.8**
    - Tag test: Feature: form-validation-rhf-zod, Property 4

  - [x] 3.7 Create `src/features/inventory/schemas.ts`
    - Export `productFormSchema`, `inboundHeaderSchema`, `inboundLineSchema` per design
    - Use `z.coerce.number()` for numeric inputs; `dateStr` helper for `YYYY-MM-DD` validation; `inboundLineSchema.expiry` empty-or-valid-date
    - _Requirements: 2.3, 2.9, 2.10, 2.11_

  - [x]* 3.8 Write property test for product form schema enforces non-negative price
    - **Property 5: Product form schema enforces non-negative price**
    - **Validates: Requirements 2.9**
    - Tag test: Feature: form-validation-rhf-zod, Property 5

  - [x]* 3.9 Write property test for inbound header schema validates date format
    - **Property 6: Inbound header schema validates date format**
    - **Validates: Requirements 2.10**
    - Tag test: Feature: form-validation-rhf-zod, Property 6

  - [x]* 3.10 Write property test for inbound line schema enforces ranges and optional expiry
    - **Property 7: Inbound line schema enforces ranges and optional expiry**
    - **Validates: Requirements 2.11**
    - Tag test: Feature: form-validation-rhf-zod, Property 7

- [x] 4. Checkpoint - Ensure all tests pass, ask the user if questions arise.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Migrate Device Registration Form
  - [x] 5.1 Wire RHF + zod into `masuk/page.tsx` device registration section
    - Initialize `useForm({ resolver: zodResolver(deviceRegistrationSchema) })`
    - Register `tenantCode`, `branchCode`, `deviceName`, `adminPassword` with `register()`
    - Preserve `toUpperCase()` on `tenantCode`/`branchCode` via `setValue(..., { shouldValidate: true })` in an `onChange` handler
    - Remove manual `if (!regTenantCode || ...)` guard
    - Render `<FieldError>` + `fieldBorder()` on each field
    - Keep `/api/auth/register` error path on `sonner toast.error`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Migrate Kasir Login Form
  - [x] 6.1 Wire RHF + zod into the kasir login section with PIN state ref bridge
    - Initialize `useForm({ resolver: zodResolver(kasirLoginSchema) })`
    - Register `kasirId` select with RHF; keep PIN keypad buttons and dot indicator in `useState` (not registered)
    - Add `pinRef = useRef('')` synced to PIN state via `useEffect`
    - In `handleSubmit`, validate `pin.length < 4` → `setError('pin', ...)`, and empty `kasirId` → `setError('kasirId', ...)`
    - Render `<FieldError>` below the dot-indicator (pin) and the kasir dropdown (kasirId)
    - Keep `/api/auth/pin-verify` error path on `sonner toast.error`; keep physical-key `requestSubmit` triggering `onSubmit`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Migrate Admin/Owner Login Form
  - [x] 7.1 Wire RHF + zod into the admin/owner login section
    - Initialize `useForm({ resolver: zodResolver(adminLoginSchema) })`
    - Register `email`, `password`, `cabang` (select), `rememberDevice` (checkbox)
    - Keep `showPassword` toggle in `useState` (UI-only); keep role-based `selectedCabang` filtering outside RHF
    - Render `<FieldError>` + `fieldBorder()` on email, password, cabang
    - Keep `/api/auth/login` error path on `sonner toast.error`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Migrate BranchForm
  - [x] 8.1 Wire RHF + zod into `BranchTab.tsx`
    - Initialize `useForm({ resolver: zodResolver(branchFormSchema) })`
    - Change `address` input to `<textarea>` preserving existing Tailwind classes
    - Preserve `toUpperCase()` on `code` via `setValue('code', ..., { shouldValidate: true })`
    - `handleCancel` calls `reset()`; after successful `POST /api/branches` call `reset()`
    - Render `<FieldError>` + `fieldBorder()` on name, code, address
    - Keep `POST /api/branches` error path on `sonner toast.error`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 9. Migrate StoreForm
  - [x] 9.1 Wire RHF + zod + diff logic into `StoreTab.tsx`
    - Initialize `useForm({ resolver: zodResolver(storeFormSchema) })`
    - After tenant data loads, call `reset(loadedValues)`; store `original` snapshot in a `ref`
    - On submit, build partial PATCH payload via `computeDiff(original, currentValues)`; if empty, `toast.info('Tidak ada perubahan...')` and return
    - Cancel button calls `reset(original)`
    - Keep `address` as `<textarea>`; render `<FieldError>` + `fieldBorder()` on name, email
    - Keep `PATCH /api/tenants/[id]` error path on `sonner toast.error`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 10. Migrate ProductDialog
  - [x] 10.1 Wire RHF + zod into `ProductTab.tsx` dialog
    - Initialize `useForm({ resolver: zodResolver(productFormSchema) })`
    - On edit-mode open, `reset(existingProductValues)` (coerce `defaultPrice` to string for the input)
    - On close, `reset(EMPTY_FORM)` where `EMPTY_FORM = { name: '', sku: '', unit: 'pcs', defaultPrice: '' }`
    - Render `<FieldError>` + `fieldBorder()` on name, sku, defaultPrice
    - Keep products API error path on `sonner toast.error`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 11. Migrate InboundHeaderForm + InboundLineForm (useFieldArray)
  - [x] 11.1 Wire RHF + zod + useFieldArray into `barang-masuk/page.tsx`
    - Initialize one `useForm({ resolver: zodResolver(inboundHeaderSchema.extend({ lines: z.array(inboundLineSchema) })) })` instance for header + lines
    - Replace `useState<ReceivingLine[]>` with `useFieldArray({ control, name: 'lines' })` on the same form instance
    - Default new row via `append({ qty: 1, cost: 0, margin: 20, batch: '', expiry: '' })` (barcode scan / manual add)
    - Compute per-row derived values (sell price = `cost * (1 + margin/100)`, subtotal HPP = `qty * cost`) from `watch('lines')`, not separate state
    - On "Simpan penerimaan", call `handleSubmit(onSave)`; on validation failure show inline errors and do NOT open the confirmation dialog
    - Perishable expiry validation at submit: per-row `setError` when `perishable && !expiry`
    - Render `<FieldError>` + `fieldBorder()` on each header field and each line-row field; `remove` clears row state and errors
    - Keep `POST /api/inbound` error path on `sonner toast.error`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x]* 11.2 Write property test for inbound line derived calculations
    - **Property 9: Inbound line derived calculations are correct**
    - **Validates: Requirements 10.7**
    - Assert sell price equals `cost * (1 + margin / 100)` and subtotal HPP equals `qty * cost` for valid line inputs
    - Tag test: Feature: form-validation-rhf-zod, Property 9

- [x] 12. Checkpoint - Ensure all tests pass, ask the user if questions arise.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integration and final wiring
  - [x] 13.1 Verify all six forms use the shared `<FieldError>` and `fieldBorder()` consistently
    - Confirm no form renders inline client-side validation via toast
    - Confirm `border-red-500` replaces the default border token on each erroring field and reverts when valid
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 14. Final checkpoint - Ensure all tests pass, ask the user if questions arise.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties of the pure Zod schemas, `computeDiff`, and derived calculations
- Example tests validate form-specific UI behaviors (error border, toast on server error, reset on close/cancel, PIN state ref bridge)
- The PIN keypad remains `useState`-driven and bridges into RHF via a `useRef` — it is never registered with RHF
- No endpoint URLs, payload key names, or Tailwind className strings are changed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2", "2.3"] },
    { "id": 1, "tasks": ["2.4", "2.5", "3.1", "3.4", "3.7"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.5", "3.6", "3.8", "3.9", "3.10", "5.1"] },
    { "id": 3, "tasks": ["6.1", "7.1", "8.1"] },
    { "id": 4, "tasks": ["9.1", "10.1"] },
    { "id": 5, "tasks": ["11.1"] },
    { "id": 6, "tasks": ["11.2", "13.1"] }
  ]
}
```
