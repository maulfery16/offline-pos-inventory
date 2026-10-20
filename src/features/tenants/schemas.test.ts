/**
 * Property-based tests for tenant form schemas.
 *
 * Feature: form-validation-rhf-zod
 * Property 3 — branchFormSchema  | Validates: Requirements 2.7
 * Property 4 — storeFormSchema   | Validates: Requirements 2.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { branchFormSchema, storeFormSchema } from './schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Printable ASCII string with at least `min` chars, capped at `max`. */
const nonEmptyString = (min = 1, max = 80) =>
  fc.string({ minLength: min, maxLength: max, unit: 'grapheme-ascii' });

/**
 * Emails Zod's `.email()` validator accepts.
 * Uses simple `word@word.tld` form: alphanumeric only, no dots/dashes in
 * local part, to avoid edge cases (trailing dots, consecutive dots, etc.)
 * that Zod rejects.
 */
const alphaNum = fc.stringMatching(/^[a-z][a-z0-9]{1,15}$/);
const tld = fc.stringMatching(/^[a-z]{2,5}$/);
const validEmail = fc.tuple(alphaNum, alphaNum, tld).map(([local, domain, t]) => `${local}@${domain}.${t}`);

// ---------------------------------------------------------------------------
// Property 3 — branchFormSchema
// Validates: Requirements 2.7
// ---------------------------------------------------------------------------

describe('branchFormSchema — Property 3 (Validates: Requirements 2.7)', () => {
  it('accepts non-empty name, code ≥2 chars, no address', () => {
    fc.assert(
      fc.property(
        nonEmptyString(1),
        nonEmptyString(2),
        (name, code) => {
          const result = branchFormSchema.safeParse({ name, code });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('accepts non-empty name, code ≥2 chars, with address', () => {
    fc.assert(
      fc.property(
        nonEmptyString(1),
        nonEmptyString(2),
        nonEmptyString(1),
        (name, code, address) => {
          const result = branchFormSchema.safeParse({ name, code, address });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('accepts empty address string', () => {
    fc.assert(
      fc.property(
        nonEmptyString(1),
        nonEmptyString(2),
        (name, code) => {
          const result = branchFormSchema.safeParse({ name, code, address: '' });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('rejects empty name — fails on name field', () => {
    fc.assert(
      fc.property(nonEmptyString(2), (code) => {
        const result = branchFormSchema.safeParse({ name: '', code });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('name');
        }
      }),
    );
  });

  it('rejects code with 1 char — fails on code field', () => {
    fc.assert(
      fc.property(nonEmptyString(1), (name) => {
        const result = branchFormSchema.safeParse({ name, code: 'X' });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('code');
        }
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4 — storeFormSchema
// Validates: Requirements 2.8
// ---------------------------------------------------------------------------

describe('storeFormSchema — Property 4 (Validates: Requirements 2.8)', () => {
  it('accepts non-empty name, no email field', () => {
    fc.assert(
      fc.property(nonEmptyString(1), (name) => {
        const result = storeFormSchema.safeParse({ name });
        expect(result.success).toBe(true);
      }),
    );
  });

  it('accepts non-empty name, valid email', () => {
    fc.assert(
      fc.property(nonEmptyString(1), validEmail, (name, email) => {
        const result = storeFormSchema.safeParse({ name, email });
        expect(result.success).toBe(true);
      }),
    );
  });

  it('accepts non-empty name, empty email string', () => {
    fc.assert(
      fc.property(nonEmptyString(1), (name) => {
        const result = storeFormSchema.safeParse({ name, email: '' });
        expect(result.success).toBe(true);
      }),
    );
  });

  it('rejects empty name — fails on name field', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(undefined), validEmail, fc.constant('')),
        (email) => {
          const result = storeFormSchema.safeParse({ name: '', email });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('name');
          }
        },
      ),
    );
  });

  it('rejects non-empty invalid email (no @) — fails on email field', () => {
    // Strings that are non-empty but contain no "@" → not a valid email
    const invalidEmail = fc
      .string({ minLength: 1, maxLength: 50, unit: 'grapheme-ascii' })
      .filter((s) => s.trim().length > 0 && !s.includes('@'));

    fc.assert(
      fc.property(nonEmptyString(1), invalidEmail, (name, email) => {
        const result = storeFormSchema.safeParse({ name, email });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('email');
        }
      }),
    );
  });
});
