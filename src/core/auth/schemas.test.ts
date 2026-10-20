/**
 * Property-based tests for auth schemas
 * Feature: form-validation-rhf-zod
 *
 * Task 3.2 — Property 1: deviceRegistrationSchema accepts valid and rejects invalid inputs
 * Validates: Requirements 2.4
 *
 * Task 3.3 — Property 2: adminLoginSchema validates email format
 * Validates: Requirements 2.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deviceRegistrationSchema, adminLoginSchema } from './schemas';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** String with at least `min` printable characters */
const strMin = (min: number) =>
  fc.string({ minLength: min, maxLength: 64 }).filter((s) => s.trim().length >= min);

/** String shorter than `max` characters (for triggering min-length failures) */
const strShorterThan = (max: number) =>
  fc.string({ minLength: 0, maxLength: max - 1 });

// ─── Task 3.2 ─────────────────────────────────────────────────────────────────

describe('deviceRegistrationSchema — Property 1 (Feature: form-validation-rhf-zod)', () => {
  /**
   * **Validates: Requirements 2.4**
   * Property: any combination of valid fields (tenantCode ≥ 2, branchCode ≥ 2,
   * deviceName ≥ 1, adminPassword ≥ 1) must parse successfully.
   */
  it('accepts all valid inputs', () => {
    fc.assert(
      fc.property(
        strMin(2), // tenantCode
        strMin(2), // branchCode
        strMin(1), // deviceName
        strMin(1), // adminPassword
        (tenantCode, branchCode, deviceName, adminPassword) => {
          const result = deviceRegistrationSchema.safeParse({
            tenantCode,
            branchCode,
            deviceName,
            adminPassword,
          });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.4**
   * Property: tenantCode shorter than 2 chars must always fail with an error
   * on the tenantCode field.
   */
  it('rejects tenantCode with fewer than 2 characters', () => {
    fc.assert(
      fc.property(
        strShorterThan(2), // tenantCode < 2 chars
        strMin(2),
        strMin(1),
        strMin(1),
        (tenantCode, branchCode, deviceName, adminPassword) => {
          const result = deviceRegistrationSchema.safeParse({
            tenantCode,
            branchCode,
            deviceName,
            adminPassword,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('tenantCode');
          }
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.4**
   * Property: branchCode shorter than 2 chars must always fail with an error
   * on the branchCode field.
   */
  it('rejects branchCode with fewer than 2 characters', () => {
    fc.assert(
      fc.property(
        strMin(2),
        strShorterThan(2), // branchCode < 2 chars
        strMin(1),
        strMin(1),
        (tenantCode, branchCode, deviceName, adminPassword) => {
          const result = deviceRegistrationSchema.safeParse({
            tenantCode,
            branchCode,
            deviceName,
            adminPassword,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('branchCode');
          }
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.4**
   * Property: empty deviceName must always fail.
   */
  it('rejects empty deviceName', () => {
    fc.assert(
      fc.property(strMin(2), strMin(2), strMin(1), (tenantCode, branchCode, adminPassword) => {
        const result = deviceRegistrationSchema.safeParse({
          tenantCode,
          branchCode,
          deviceName: '',
          adminPassword,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('deviceName');
        }
      }),
    );
  });

  /**
   * **Validates: Requirements 2.4**
   * Property: empty adminPassword must always fail.
   */
  it('rejects empty adminPassword', () => {
    fc.assert(
      fc.property(strMin(2), strMin(2), strMin(1), (tenantCode, branchCode, deviceName) => {
        const result = deviceRegistrationSchema.safeParse({
          tenantCode,
          branchCode,
          deviceName,
          adminPassword: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('adminPassword');
        }
      }),
    );
  });
});

// ─── Task 3.3 ─────────────────────────────────────────────────────────────────

describe('adminLoginSchema — Property 2 (Feature: form-validation-rhf-zod)', () => {
  /** Arbitrary valid email: localPart@domain.tld */
  const validEmail = fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{1,15}$/), // local part
      fc.stringMatching(/^[a-z]{2,10}$/),          // domain label
      fc.stringMatching(/^[a-z]{2,5}$/),            // tld
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  /** String that definitely has no '@' character */
  const noAtEmail = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => !s.includes('@'));

  /**
   * **Validates: Requirements 2.6**
   * Property: any input with a well-formed email, non-empty password/cabang,
   * and a boolean rememberDevice must parse successfully.
   */
  it('accepts valid inputs', () => {
    fc.assert(
      fc.property(
        validEmail,
        strMin(1), // password
        strMin(1), // cabang
        fc.boolean(),
        (email, password, cabang, rememberDevice) => {
          const result = adminLoginSchema.safeParse({ email, password, cabang, rememberDevice });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.6**
   * Property: any string without '@' used as email must always fail with an
   * error on the email field.
   */
  it('rejects email without @ symbol', () => {
    fc.assert(
      fc.property(
        noAtEmail,
        strMin(1),
        strMin(1),
        fc.boolean(),
        (email, password, cabang, rememberDevice) => {
          const result = adminLoginSchema.safeParse({ email, password, cabang, rememberDevice });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('email');
          }
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.6**
   * Property: empty password must always fail.
   */
  it('rejects empty password', () => {
    fc.assert(
      fc.property(validEmail, strMin(1), fc.boolean(), (email, cabang, rememberDevice) => {
        const result = adminLoginSchema.safeParse({
          email,
          password: '',
          cabang,
          rememberDevice,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('password');
        }
      }),
    );
  });

  /**
   * **Validates: Requirements 2.6**
   * Property: empty cabang must always fail.
   */
  it('rejects empty cabang', () => {
    fc.assert(
      fc.property(validEmail, strMin(1), fc.boolean(), (email, password, rememberDevice) => {
        const result = adminLoginSchema.safeParse({
          email,
          password,
          cabang: '',
          rememberDevice,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path[0]);
          expect(fields).toContain('cabang');
        }
      }),
    );
  });

  /**
   * **Validates: Requirements 2.6**
   * Property: non-boolean rememberDevice must always fail.
   */
  it('rejects non-boolean rememberDevice', () => {
    fc.assert(
      fc.property(
        validEmail,
        strMin(1),
        strMin(1),
        // anything that is NOT a boolean
        fc.oneof(fc.integer(), fc.string(), fc.constant(null), fc.constant(undefined)),
        (email, password, cabang, rememberDevice) => {
          const result = adminLoginSchema.safeParse({ email, password, cabang, rememberDevice });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('rememberDevice');
          }
        },
      ),
    );
  });
});
