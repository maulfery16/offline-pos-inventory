/**
 * Property-Based Tests for computeDiff
 * Feature: form-validation-rhf-zod, Property 8
 * Validates: Requirements 7.2
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeDiff } from "./diff";

describe("computeDiff", () => {
  /**
   * Property 8: Diff helper returns only changed keys
   * Validates: Requirements 7.2
   */
  it("returns only keys where current[key] !== original[key]", () => {
    fc.assert(
      fc.property(
        // Generate an object with string keys and primitive values
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter(k => !['__proto__', 'constructor', 'prototype'].includes(k)),
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
        ),
        // Generate a partial override object (same keys, some values changed)
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter(k => !['__proto__', 'constructor', 'prototype'].includes(k)),
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
        ),
        (base, overrides) => {
          const original = { ...base } as Record<string, unknown>;
          const current = { ...base, ...overrides } as Record<string, unknown>;
          const diff = computeDiff(original, current);

          // Every key in diff must have a different value in current vs original
          for (const key of Object.keys(diff)) {
            expect(current[key]).not.toBe(original[key]);
            expect(diff[key]).toBe(current[key]);
          }

          // Every changed key must appear in diff
          for (const key of Object.keys(current)) {
            if (current[key] !== original[key]) {
              expect(Object.prototype.hasOwnProperty.call(diff, key)).toBe(true);
              expect(diff[key]).toBe(current[key]);
            }
          }
        },
      ),
      { numRuns: 500 },
    );
  });

  it("returns {} when original and current are deeply equal (primitive values)", () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter(k => !['__proto__', 'constructor', 'prototype'].includes(k)),
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
        ),
        (obj) => {
          const original = { ...obj } as Record<string, unknown>;
          const current = { ...obj } as Record<string, unknown>;
          const diff = computeDiff(original, current);
          expect(Object.keys(diff)).toHaveLength(0);
        },
      ),
      { numRuns: 500 },
    );
  });

  it("does not include unchanged keys in result", () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter(k => !['__proto__', 'constructor', 'prototype'].includes(k)),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        ),
        (base) => {
          const original = { ...base } as Record<string, unknown>;
          const current = { ...base } as Record<string, unknown>;
          const diff = computeDiff(original, current);

          // No unchanged key should appear as an own property in the diff
          for (const key of Object.keys(original)) {
            if (original[key] === current[key]) {
              expect(Object.prototype.hasOwnProperty.call(diff, key)).toBe(false);
            }
          }
        },
      ),
      { numRuns: 500 },
    );
  });

  // Representative example-based cases
  it("example: detects single changed field", () => {
    const original = { name: "Alice", age: 30, active: true };
    const current = { name: "Alice", age: 31, active: true };
    expect(computeDiff(original, current)).toEqual({ age: 31 });
  });

  it("example: detects multiple changed fields", () => {
    const original = { name: "Alice", age: 30, city: "Jakarta" };
    const current = { name: "Bob", age: 30, city: "Bandung" };
    expect(computeDiff(original, current)).toEqual({
      name: "Bob",
      city: "Bandung",
    });
  });

  it("example: returns {} when nothing changed", () => {
    const obj = { x: 1, y: "hello", z: false };
    expect(computeDiff(obj, { ...obj })).toEqual({});
  });

  it("example: all fields changed", () => {
    const original = { a: 1, b: 2, c: 3 };
    const current = { a: 10, b: 20, c: 30 };
    expect(computeDiff(original, current)).toEqual({ a: 10, b: 20, c: 30 });
  });

  it("example: changed field mapped to current value not original", () => {
    const original = { status: "draft" };
    const current = { status: "published" };
    const diff = computeDiff(original, current);
    expect(diff.status).toBe("published");
  });
});
