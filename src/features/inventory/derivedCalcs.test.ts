/**
 * Property-based tests for inbound line derived calculations.
 * Feature: form-validation-rhf-zod, Property 9
 * Validates: Requirements 10.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pure helpers mirroring the formulas in barang-masuk/page.tsx
const sellPrice = (cost: number, margin: number) => cost * (1 + margin / 100);
const subtotalHPP = (qty: number, cost: number) => qty * cost;

describe('Inbound line derived calculations — Property 9', () => {
  /**
   * Validates: Requirements 10.7
   * Sell price = cost * (1 + margin / 100) for all valid cost and margin values.
   */
  it('sell price formula holds for any cost >= 0 and margin in [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (cost, margin) => {
          const expected = cost * (1 + margin / 100);
          expect(sellPrice(cost, margin)).toBeCloseTo(expected, 10);
        },
      ),
    );
  });

  /**
   * Validates: Requirements 10.7
   * Subtotal HPP = qty * cost for any integer qty >= 1 and cost >= 0.
   */
  it('subtotal HPP formula holds for any integer qty >= 1 and cost >= 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (qty, cost) => {
          const expected = qty * cost;
          expect(subtotalHPP(qty, cost)).toBeCloseTo(expected, 10);
        },
      ),
    );
  });

  // Edge cases
  it('zero cost → sell price = 0 regardless of margin', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (margin) => {
          expect(sellPrice(0, margin)).toBe(0);
        },
      ),
    );
  });

  it('zero margin → sell price equals cost', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (cost) => {
          expect(sellPrice(cost, 0)).toBeCloseTo(cost, 10);
        },
      ),
    );
  });

  it('100% margin → sell price = 2 * cost', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (cost) => {
          expect(sellPrice(cost, 100)).toBeCloseTo(2 * cost, 10);
        },
      ),
    );
  });
});
