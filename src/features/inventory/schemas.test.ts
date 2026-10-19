/**
 * Property-based tests for inventory schemas
 *
 * Feature: form-validation-rhf-zod
 * Properties 5, 6, 7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  productFormSchema,
  inboundHeaderSchema,
  inboundLineSchema,
} from './schemas';

// ---------------------------------------------------------------------------
// Property 5 — productFormSchema enforces non-negative price
// Validates: Requirements 2.9
// ---------------------------------------------------------------------------
describe('Property 5: productFormSchema enforces non-negative price', () => {
  it('Valid: non-negative price with valid fields → parse succeeds, defaultPrice is a number', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),          // name
        fc.string({ minLength: 1 }),          // sku
        fc.string({ minLength: 1 }),          // unit
        fc.float({ min: 0, max: Math.fround(1_000_000), noNaN: true }),  // defaultPrice >= 0
        (name, sku, unit, defaultPrice) => {
          const result = productFormSchema.safeParse({ name, sku, unit, defaultPrice });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(typeof result.data.defaultPrice).toBe('number');
          }
        }
      )
    );
  });

  it('Invalid: negative defaultPrice → safeParse fails on defaultPrice', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.float({ min: Math.fround(-1_000_000), max: Math.fround(-0.001), noNaN: true }),
        (name, sku, unit, defaultPrice) => {
          const result = productFormSchema.safeParse({ name, sku, unit, defaultPrice });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('defaultPrice');
          }
        }
      )
    );
  });

  it('Invalid: empty name → safeParse fails on name', () => {
    const result = productFormSchema.safeParse({
      name: '',
      sku: 'SKU-001',
      unit: 'pcs',
      defaultPrice: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('name');
    }
  });

  it('Invalid: empty sku → safeParse fails on sku', () => {
    const result = productFormSchema.safeParse({
      name: 'Produk A',
      sku: '',
      unit: 'pcs',
      defaultPrice: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('sku');
    }
  });
});

// ---------------------------------------------------------------------------
// Property 6 — inboundHeaderSchema validates date format
// Validates: Requirements 2.10
// ---------------------------------------------------------------------------
describe('Property 6: inboundHeaderSchema validates date format', () => {
  it('Valid: non-empty fields with valid date → parse succeeds', () => {
    const result = inboundHeaderSchema.safeParse({
      supplier: 'PT Maju',
      invoice: 'INV-001',
      warehouse: 'Gudang Utama',
      date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('Valid: property — any non-empty strings with valid YYYY-MM-DD date → parse succeeds', () => {
    // Generate valid calendar dates (month 01-12, day 01-28 to stay safe)
    const validDateArb = fc.tuple(
      fc.integer({ min: 2000, max: 2099 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([y, m, d]) => {
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    });

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        validDateArb,
        (supplier, invoice, warehouse, date) => {
          const result = inboundHeaderSchema.safeParse({ supplier, invoice, warehouse, date });
          expect(result.success).toBe(true);
        }
      )
    );
  });

  it('Invalid: date "not-a-date" → safeParse fails on date', () => {
    const result = inboundHeaderSchema.safeParse({
      supplier: 'PT Maju',
      invoice: 'INV-001',
      warehouse: 'Gudang Utama',
      date: 'not-a-date',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('date');
    }
  });

  it('Invalid: date "2024-13-01" (invalid month) → safeParse fails on date', () => {
    const result = inboundHeaderSchema.safeParse({
      supplier: 'PT Maju',
      invoice: 'INV-001',
      warehouse: 'Gudang Utama',
      date: '2024-13-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('date');
    }
  });

  it('Invalid: date "24-01-15" (wrong format) → safeParse fails on date', () => {
    const result = inboundHeaderSchema.safeParse({
      supplier: 'PT Maju',
      invoice: 'INV-001',
      warehouse: 'Gudang Utama',
      date: '24-01-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('date');
    }
  });

  it('Invalid: empty supplier → safeParse fails on supplier', () => {
    const result = inboundHeaderSchema.safeParse({
      supplier: '',
      invoice: 'INV-001',
      warehouse: 'Gudang Utama',
      date: '2024-01-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('supplier');
    }
  });
});

// ---------------------------------------------------------------------------
// Property 7 — inboundLineSchema enforces ranges and optional expiry
// Validates: Requirements 2.11
// ---------------------------------------------------------------------------
describe('Property 7: inboundLineSchema enforces ranges and optional expiry', () => {
  it('Valid: qty=1, cost=0, margin=0, batch, expiry="" → parse succeeds', () => {
    const result = inboundLineSchema.safeParse({
      qty: 1,
      cost: 0,
      margin: 0,
      batch: 'B001',
      expiry: '',
    });
    expect(result.success).toBe(true);
  });

  it('Valid: qty=5, cost=100, margin=50, batch, expiry="2025-12-31" → parse succeeds', () => {
    const result = inboundLineSchema.safeParse({
      qty: 5,
      cost: 100,
      margin: 50,
      batch: 'B001',
      expiry: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('Valid: property — valid ranges with empty or valid expiry → parse succeeds', () => {
    const validExpiryArb = fc.oneof(
      fc.constant(''),
      fc.tuple(
        fc.integer({ min: 2000, max: 2099 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 })
      ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000 }),         // qty >= 1
        fc.float({ min: 0, max: Math.fround(1_000_000), noNaN: true }), // cost >= 0
        fc.float({ min: 0, max: 100, noNaN: true }),        // margin 0-100
        fc.string({ minLength: 1 }),                        // batch non-empty
        validExpiryArb,
        (qty, cost, margin, batch, expiry) => {
          const result = inboundLineSchema.safeParse({ qty, cost, margin, batch, expiry });
          expect(result.success).toBe(true);
        }
      )
    );
  });

  it('Invalid: qty=0 → safeParse fails on qty', () => {
    const result = inboundLineSchema.safeParse({
      qty: 0,
      cost: 100,
      margin: 10,
      batch: 'B001',
      expiry: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('qty');
    }
  });

  it('Invalid: negative qty → safeParse fails on qty (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10_000, max: 0 }),
        (qty) => {
          const result = inboundLineSchema.safeParse({
            qty,
            cost: 0,
            margin: 0,
            batch: 'B001',
            expiry: '',
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('qty');
          }
        }
      )
    );
  });

  it('Invalid: cost=-1 → safeParse fails on cost', () => {
    const result = inboundLineSchema.safeParse({
      qty: 1,
      cost: -1,
      margin: 10,
      batch: 'B001',
      expiry: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('cost');
    }
  });

  it('Invalid: margin=101 → safeParse fails on margin', () => {
    const result = inboundLineSchema.safeParse({
      qty: 1,
      cost: 100,
      margin: 101,
      batch: 'B001',
      expiry: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('margin');
    }
  });

  it('Invalid: empty batch → safeParse fails on batch', () => {
    const result = inboundLineSchema.safeParse({
      qty: 1,
      cost: 100,
      margin: 10,
      batch: '',
      expiry: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('batch');
    }
  });

  it('Invalid: expiry="invalid-date" → safeParse fails on expiry', () => {
    const result = inboundLineSchema.safeParse({
      qty: 1,
      cost: 100,
      margin: 10,
      batch: 'B001',
      expiry: 'invalid-date',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('expiry');
    }
  });

  it('Valid: expiry="" (empty string, not perishable) → parse succeeds', () => {
    const result = inboundLineSchema.safeParse({
      qty: 2,
      cost: 50,
      margin: 20,
      batch: 'B002',
      expiry: '',
    });
    expect(result.success).toBe(true);
  });
});
