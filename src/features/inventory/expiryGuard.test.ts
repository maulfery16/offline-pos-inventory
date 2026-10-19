/**
 * Property-based tests for expiryGuard.ts
 *
 * Property 1: Expiry guard blocks fully-expired products
 * Validates: Requirements 6.2
 *
 * Property 2: Expiry guard allows products with at least one valid batch
 * Validates: Requirements 6.3
 *
 * Property 3: Expiry guard blocks products with no batches
 * Validates: Requirements 6.4
 */

import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { checkProductExpiry } from './expiryGuard'
import type { Database } from '@nozbe/watermelondb'

// ---------------------------------------------------------------------------
// Mock factory helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal mock WatermelonDB Database that returns the given batch array
 * for any query on 'inventory_batches'.
 */
function makeMockDb(batches: Array<{
  expiryDate: Date | null
  isBlocked: boolean
}>): Database {
  const mockFetch = vi.fn().mockResolvedValue(batches)
  const mockQuery = vi.fn().mockReturnValue({ fetch: mockFetch })
  const mockGet = vi.fn().mockReturnValue({ query: mockQuery })

  return { get: mockGet } as unknown as Database
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const now = new Date()
const pastDate = new Date(now.getTime() - 86_400_000)   // yesterday
const futureDate = new Date(now.getTime() + 86_400_000)  // tomorrow

/** A batch that is definitively expired (past date, not blocked) */
const expiredByDateBatch = fc.record({
  expiryDate: fc.date({ min: new Date('2000-01-01'), max: new Date(now.getTime() - 1000) }),
  isBlocked: fc.constant(false),
})

/** A batch that is blocked (regardless of date) */
const blockedBatch = fc.record({
  expiryDate: fc.option(fc.date(), { nil: null }),
  isBlocked: fc.constant(true),
})

/** Any expired-or-blocked batch */
const expiredOrBlockedBatch = fc.oneof(expiredByDateBatch, blockedBatch)

/** A batch that is clearly valid: future expiry, not blocked */
const validBatch = fc.record({
  expiryDate: fc.date({ min: new Date(now.getTime() + 1000), max: new Date('2099-12-31') }),
  isBlocked: fc.constant(false),
})

/** A batch with null expiryDate (non-perishable) and not blocked — always valid */
const nullExpiryBatch = fc.record({
  expiryDate: fc.constant(null as Date | null),
  isBlocked: fc.constant(false),
})

// ---------------------------------------------------------------------------
// Property 1: Fully-expired/blocked products are blocked
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------

describe('Property 1: Expiry guard blocks fully-expired products', () => {
  it('returns blocked when ALL batches are expired or isBlocked=true', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(expiredOrBlockedBatch, { minLength: 1, maxLength: 10 }),
        async (batches) => {
          const db = makeMockDb(batches)
          const result = await checkProductExpiry('any-product-id', db)
          expect(result.status).toBe('blocked')
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: At least one valid batch → result is 'ok' or 'warning', never 'blocked'
// Validates: Requirements 6.3
// ---------------------------------------------------------------------------

describe('Property 2: Expiry guard allows products with at least one valid batch', () => {
  it('never returns blocked when at least one batch is valid (future expiry, not blocked)', () => {
    fc.assert(
      fc.asyncProperty(
        // Generate: 1+ valid batches + 0+ expired batches, shuffled
        fc.array(validBatch, { minLength: 1, maxLength: 5 }),
        fc.array(expiredOrBlockedBatch, { minLength: 0, maxLength: 5 }),
        async (validBatches, expiredBatches) => {
          const combined = [...validBatches, ...expiredBatches]
          // Shuffle to ensure order doesn't matter
          combined.sort(() => Math.random() - 0.5)

          const db = makeMockDb(combined)
          const result = await checkProductExpiry('any-product-id', db)

          expect(result.status).not.toBe('blocked')
          expect(['ok', 'warning']).toContain(result.status)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns ok when ALL batches are valid', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(validBatch, { minLength: 1, maxLength: 10 }),
        async (batches) => {
          const db = makeMockDb(batches)
          const result = await checkProductExpiry('any-product-id', db)
          expect(result.status).toBe('ok')
        },
      ),
      { numRuns: 50 },
    )
  })

  it('treats null expiryDate batches as valid (non-perishable)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(nullExpiryBatch, { minLength: 1, maxLength: 5 }),
        async (batches) => {
          const db = makeMockDb(batches)
          const result = await checkProductExpiry('any-product-id', db)
          expect(result.status).not.toBe('blocked')
        },
      ),
      { numRuns: 50 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3: No batches → blocked
// Validates: Requirements 6.4
// ---------------------------------------------------------------------------

describe('Property 3: Expiry guard blocks products with no batches', () => {
  it('returns blocked with appropriate message when batch array is empty', async () => {
    const db = makeMockDb([])
    const result = await checkProductExpiry('any-product-id', db)
    expect(result.status).toBe('blocked')
    if (result.status === 'blocked') {
      expect(result.message).toBeTruthy()
      expect(result.message.length).toBeGreaterThan(0)
    }
  })

  it('always returns blocked for empty batch arrays (property form)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constant([] as Array<{ expiryDate: Date | null; isBlocked: boolean }>),
        async (batches) => {
          const db = makeMockDb(batches)
          const result = await checkProductExpiry('any-product-id', db)
          expect(result.status).toBe('blocked')
        },
      ),
      { numRuns: 10 },
    )
  })
})

// ---------------------------------------------------------------------------
// Additional: warning status
// ---------------------------------------------------------------------------

describe('Warning status: some expired, some valid', () => {
  it('returns warning when mix of expired and valid batches exist', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(expiredByDateBatch, { minLength: 1, maxLength: 5 }),
        fc.array(validBatch, { minLength: 1, maxLength: 5 }),
        async (expired, valid) => {
          const db = makeMockDb([...expired, ...valid])
          const result = await checkProductExpiry('any-product-id', db)
          expect(result.status).toBe('warning')
        },
      ),
      { numRuns: 100 },
    )
  })
})
