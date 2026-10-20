# Requirements Document

## Introduction

Migrate all project forms from uncontrolled `useState` patterns to **react-hook-form (RHF) + zod**. The migration covers six form surfaces across four feature areas: device registration, cashier/admin login, store settings, branch creation, product add/edit dialog, and inbound goods receipt. All Zod schemas are co-located per feature. Inline field-level error messages replace silent validation. Server/API errors continue to use sonner toast. No existing Tailwind className patterns, UI structure, or non-form behaviors are changed.

## Glossary

- **RHF**: react-hook-form — React library for form state management and validation hooks.
- **Zod Schema**: A TypeScript-first runtime validation schema defined using the `zod` library.
- **useFieldArray**: RHF hook for managing dynamic arrays of form rows (line items).
- **Inline Error**: A `<p>` element rendered directly below a field showing the field's first validation error message.
- **PIN Keypad**: The custom on-screen numeric keypad and dot-indicator UI in `masuk/page.tsx`. Manages its own state via `useState` and is excluded from RHF registration.
- **PIN State Ref**: A `useRef` that bridges the `useState`-managed PIN string into RHF's `handleSubmit` callback for validation.
- **Diff Logic**: The pattern in `StoreTab` that computes a partial PATCH payload containing only fields whose value changed from the server-fetched original.
- **Device Registration Form**: The form in `masuk/page.tsx` shown when no device JWT is present (`showRegister === true`), with fields: Kode Toko, Kode Cabang, Nama Perangkat, Kata Sandi Admin.
- **Kasir Login Form**: The role-specific form section in `masuk/page.tsx` for the `kasir` role, with fields: Kasir dropdown and PIN dot indicator (PIN managed outside RHF).
- **Admin/Owner Login Form**: The role-specific form section in `masuk/page.tsx` for `admin` and `owner` roles, with fields: Email, Kata Sandi, Cabang dropdown, Ingat Perangkat checkbox.
- **BranchForm**: The inline add-branch form in `BranchTab.tsx` with fields: Nama Cabang, Kode Cabang, Alamat.
- **StoreForm**: The tenant info form in `StoreTab.tsx` with fields: Nama Toko, Alamat (textarea), Telepon, Email.
- **ProductDialog**: The add/edit product dialog in `ProductTab.tsx` with fields: Nama, SKU, Satuan, Harga Jual.
- **InboundHeaderForm**: The document-details section in `barang-masuk/page.tsx` with fields: Supplier (select), Nomor Faktur (text), Tanggal Terima (date), Gudang Tujuan (select).
- **InboundLineForm**: The per-row fields managed by `useFieldArray` in `barang-masuk/page.tsx`: Qty, HPP/unit, Margin %, No. Batch, Kedaluwarsa.
- **FEFO**: First Expired, First Out — batch deduction order enforced on the backend.

## Requirements

### Requirement 1: Dependency Installation

**User Story:** As a developer, I want react-hook-form and zod added to the project dependencies, so that RHF and zod are available for import throughout the codebase.

#### Acceptance Criteria

1. THE System SHALL add `react-hook-form` at version `^7.53.0` to `dependencies` in `package.json`.
2. THE System SHALL add `zod` at version `^3.23.0` to `dependencies` in `package.json`.
3. THE System SHALL add `@hookform/resolvers` at version `^3.9.0` to `dependencies` in `package.json`.

---

### Requirement 2: Zod Schema Co-location

**User Story:** As a developer, I want each feature's Zod schemas in a `schemas.ts` file co-located with the feature, so that validation rules are easy to find and reuse.

#### Acceptance Criteria

1. THE System SHALL create `src/core/auth/schemas.ts` containing a `deviceRegistrationSchema` Zod object and a `kasirLoginSchema` Zod object and an `adminLoginSchema` Zod object.
2. THE System SHALL create `src/features/tenants/schemas.ts` containing a `storeFormSchema` Zod object and a `branchFormSchema` Zod object.
3. THE System SHALL create `src/features/inventory/schemas.ts` containing a `productFormSchema` Zod object and an `inboundHeaderSchema` Zod object and an `inboundLineSchema` Zod object.
4. THE `deviceRegistrationSchema` SHALL require `tenantCode` (non-empty string, min 2 chars), `branchCode` (non-empty string, min 2 chars), `deviceName` (non-empty string, min 1 char), and `adminPassword` (non-empty string, min 1 char).
5. THE `kasirLoginSchema` SHALL require `kasirId` (non-empty string) and accept `pin` as a string validated only at submit time by a manual RHF rule (min 4, max 6 numeric digits).
6. THE `adminLoginSchema` SHALL require `email` (valid email format), `password` (non-empty string, min 1 char), `cabang` (non-empty string), and `rememberDevice` (boolean).
7. THE `branchFormSchema` SHALL require `name` (non-empty string, min 1 char) and `code` (non-empty string, min 2 chars) and accept an optional `address` (string or empty string).
8. THE `storeFormSchema` SHALL require `name` (non-empty string, min 1 char) and accept optional `address`, `phone`, and `email` fields as strings; `email` WHEN non-empty SHALL be validated as a valid email format.
9. THE `productFormSchema` SHALL require `name` (non-empty string), `sku` (non-empty string), `unit` (non-empty string, defaulting to `"pcs"`), and `defaultPrice` (number, minimum value 0).
10. THE `inboundHeaderSchema` SHALL require `supplier` (non-empty string), `invoice` (non-empty string, min 1 char), `date` (valid date string in YYYY-MM-DD format), and `warehouse` (non-empty string).
11. THE `inboundLineSchema` SHALL require `qty` (integer, min 1), `cost` (number, min 0), `margin` (number, min 0, max 100), `batch` (non-empty string, min 1 char), and `expiry` (string that is either empty or a valid YYYY-MM-DD date).

---

### Requirement 3: Device Registration Form Migration

**User Story:** As an admin setting up a new device, I want inline validation errors on each field of the device registration form, so that I know exactly which field is wrong without needing a toast message.

#### Acceptance Criteria

1. WHEN the Device Registration Form is rendered, THE System SHALL initialize it with `useForm` using `zodResolver(deviceRegistrationSchema)`.
2. WHEN the user submits the Device Registration Form with any required field empty, THE System SHALL display an inline error message below that field before the API call is attempted.
3. WHEN a field in the Device Registration Form has a validation error, THE System SHALL apply a red border style (`border-red-500`) to that field's input element.
4. WHEN the server returns an error response from `/api/auth/register`, THE System SHALL display the error using `sonner toast.error` and SHALL NOT replace inline field errors.
5. THE System SHALL preserve the existing `toUpperCase()` transform on `tenantCode` and `branchCode` fields using RHF's `onChange` handler or a Zod transform.

---

### Requirement 4: Kasir Login Form Migration

**User Story:** As a cashier, I want the cashier selection dropdown managed by RHF so that its validation integrates with form submission, while my PIN entry stays with the custom keypad.

#### Acceptance Criteria

1. WHEN the Kasir Login Form is rendered, THE System SHALL register the `kasirId` select field with `useForm` using `zodResolver(kasirLoginSchema)`.
2. THE System SHALL maintain the PIN value in `useState` and read it inside RHF's `handleSubmit` callback via a `useRef` (PIN state ref pattern).
3. WHEN `handleSubmit` is called and `pin.length < 4`, THE System SHALL set a RHF field error on the `pin` field using `setError` and display the error inline below the PIN dot-indicator.
4. WHEN `handleSubmit` is called and `kasirId` is empty, THE System SHALL display an inline error below the kasir dropdown.
5. THE System SHALL NOT register the on-screen PIN keypad buttons or the dot-indicator display with RHF.
6. WHEN the server returns an error from `/api/auth/pin-verify`, THE System SHALL display the error via `sonner toast.error`.

---

### Requirement 5: Admin/Owner Login Form Migration

**User Story:** As an admin or owner, I want the login form fields validated by RHF+Zod so that I see inline errors before the API call is made.

#### Acceptance Criteria

1. WHEN the Admin/Owner Login Form is rendered, THE System SHALL initialize it with `useForm` using `zodResolver(adminLoginSchema)`.
2. WHEN the user submits with an invalid email format, THE System SHALL display an inline error below the email field.
3. WHEN the user submits with an empty password field, THE System SHALL display an inline error below the password field.
4. WHEN the server returns an error from `/api/auth/login`, THE System SHALL display the error via `sonner toast.error`.
5. THE System SHALL register the `cabang` select field and the `rememberDevice` checkbox with RHF.

---

### Requirement 6: BranchForm Migration

**User Story:** As an admin, I want the add-branch form validated inline so that I see which fields are missing without submitting to the API.

#### Acceptance Criteria

1. WHEN BranchForm is rendered, THE System SHALL initialize it with `useForm` using `zodResolver(branchFormSchema)`.
2. WHEN the user submits with an empty Nama Cabang field, THE System SHALL display an inline error below that field.
3. WHEN the user submits with an empty Kode Cabang field, THE System SHALL display an inline error below that field.
4. THE `address` field SHALL render as a `<textarea>` element (replacing the current `<input type="text">`).
5. WHEN RHF `reset()` is called, THE System SHALL clear all field values and all inline errors.
6. WHEN the server returns an error from `POST /api/branches`, THE System SHALL display the error via `sonner toast.error`.

---

### Requirement 7: StoreForm Migration

**User Story:** As an admin, I want the store settings form validated by RHF+Zod with inline errors, while preserving the diff-only PATCH behavior.

#### Acceptance Criteria

1. WHEN StoreForm is rendered and tenant data is loaded, THE System SHALL initialize RHF with `reset(loadedValues)` to populate all fields from the server response.
2. THE System SHALL preserve the diff logic: WHEN `handleSubmit` is called, THE System SHALL compute a partial payload containing only keys whose current value differs from the server-fetched `original` snapshot, and SHALL NOT send unchanged fields.
3. WHEN the user submits with an empty Nama Toko field, THE System SHALL display an inline error below that field.
4. WHEN the `email` field is non-empty and contains an invalid email format, THE System SHALL display an inline error below the email field.
5. WHEN the server returns an error from `PATCH /api/tenants/[id]`, THE System SHALL display the error via `sonner toast.error`.
6. THE `address` field SHALL render as a `<textarea>` element (the existing implementation already uses a textarea; THE System SHALL preserve this).
7. WHEN the cancel button is clicked, THE System SHALL call RHF `reset(original)` to restore field values to the last-saved state.

---

### Requirement 8: ProductDialog Form Migration

**User Story:** As an admin, I want the product add/edit dialog form to show inline validation errors so that I know which field is invalid before the API call.

#### Acceptance Criteria

1. WHEN ProductDialog is opened, THE System SHALL initialize it with `useForm` using `zodResolver(productFormSchema)`.
2. WHEN ProductDialog is opened in edit mode, THE System SHALL populate fields with `reset(existingProductValues)`.
3. WHEN the user submits with an empty Nama field, THE System SHALL display an inline error below that field.
4. WHEN the user submits with an empty SKU field, THE System SHALL display an inline error below that field.
5. WHEN the user submits with a Harga Jual value below 0, THE System SHALL display an inline error below that field.
6. WHEN the dialog closes, THE System SHALL call RHF `reset(EMPTY_FORM)` to clear all field values and errors.
7. WHEN the server returns an error from the products API, THE System SHALL display the error via `sonner toast.error`.

---

### Requirement 9: InboundHeaderForm Migration

**User Story:** As an admin receiving goods, I want the document-details header form (supplier, invoice, date, warehouse) validated by RHF+Zod so that inline errors surface before the save is attempted.

#### Acceptance Criteria

1. THE System SHALL manage `supplier`, `invoice`, `date`, and `warehouse` fields with `useForm` using `zodResolver(inboundHeaderSchema)`.
2. WHEN the user clicks "Simpan penerimaan" and the `invoice` field is empty, THE System SHALL display an inline error below the invoice input and SHALL NOT open the confirmation dialog.
3. WHEN the `date` field value is not a valid date string, THE System SHALL display an inline error below the date input.
4. WHEN the server returns an error from `POST /api/inbound`, THE System SHALL display the error via `sonner toast.error`.

---

### Requirement 10: InboundLineForm Migration with useFieldArray

**User Story:** As an admin, I want each receiving line row's fields (qty, cost, margin, batch, expiry) managed by useFieldArray so that per-row validation is tracked by RHF.

#### Acceptance Criteria

1. THE System SHALL replace the `useState<ReceivingLine[]>` array with `useFieldArray` registered under the key `"lines"` on the same `useForm` instance as InboundHeaderForm.
2. WHEN `useFieldArray.append` is called (via barcode scan or manual add), THE System SHALL add a new row with default values `{ qty: 1, cost: 0, margin: 20, batch: '', expiry: '' }`.
3. WHEN a line row's `perishable` flag is true and `expiry` is empty at submit, THE System SHALL display an inline error below that row's expiry field.
4. WHEN a line row's `qty` value is less than 1 at submit, THE System SHALL display an inline error below that row's qty field.
5. WHEN a line row's `cost` value is less than 0 at submit, THE System SHALL display an inline error below that row's cost field.
6. WHEN `useFieldArray.remove` is called, THE System SHALL remove the corresponding row's RHF state and clear its errors.
7. THE System SHALL preserve the existing per-row derived display values (sell price = `cost * (1 + margin/100)`, subtotal HPP = `qty * cost`) as computed values read from RHF's `watch` output, NOT as separate state.

---

### Requirement 11: Inline Error Display Pattern

**User Story:** As a user, I want inline error messages displayed consistently below each invalid field in all migrated forms, so that I can identify and fix validation errors without reading toast notifications.

#### Acceptance Criteria

1. WHEN a field has a RHF validation error, THE System SHALL render a `<p>` element with class `text-xs text-red-500 mt-1` directly below the field's input element.
2. THE System SHALL display only the first error message per field.
3. WHEN a field's value becomes valid, THE System SHALL remove the inline error element from the DOM.
4. WHEN a field has a validation error, THE System SHALL apply `border-red-500` to the field's input border class (replacing the default `border-[#cbd2dc]` or `border-[#d1d5db]`).
5. THE System SHALL NOT use sonner toast for client-side field validation errors.
