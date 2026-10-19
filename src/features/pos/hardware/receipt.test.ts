/**
 * Property-based tests for receipt.ts
 *
 * Property 4: Receipt builder includes all required fields
 * Validates: Requirements 2.2, 2.6
 *
 * Property 5: Receipt currency format is Indonesian Rupiah
 * Validates: Requirements 2.6
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { buildReceipt, formatRupiah, type ReceiptData } from './receipt'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Non-empty printable ASCII string (avoids control chars that mess up decoding) */
const printableString = fc.string({ minLength: 1, maxLength: 40 }).filter(
  (s) => s.trim().length > 0 && !/[\x00-\x1f\x7f]/.test(s),
)

const receiptItemArb = fc.record({
  name: printableString,
  quantity: fc.integer({ min: 1, max: 99 }),
  sellingPrice: fc.integer({ min: 0, max: 10_000_000 }),
})

const receiptDataArb: fc.Arbitrary<ReceiptData> = fc.record({
  storeName: printableString,
  branchName: printableString,
  receiptRef: printableString,
  transactionDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  items: fc.array(receiptItemArb, { minLength: 1, maxLength: 10 }),
  subtotal: fc.integer({ min: 0, max: 100_000_000 }),
  paymentMethod: printableString,
  cashReceived: fc.integer({ min: 0, max: 200_000_000 }),
  change: fc.integer({ min: 0, max: 100_000_000 }),
})

// ---------------------------------------------------------------------------
// Property 4: Receipt builder includes all required fields
// Validates: Requirements 2.2, 2.6
// ---------------------------------------------------------------------------

describe('Property 4: buildReceipt includes all required fields', () => {
  it('decoded output contains storeName, each item name, subtotal value, paymentMethod, and change', () => {
    fc.assert(
      fc.property(receiptDataArb, (data) => {
        const buffer = buildReceipt(data)
        const decoded = new TextDecoder('utf-8').decode(buffer)

        // storeName present
        expect(decoded).toContain(data.storeName)

        // each item name present
        for (const item of data.items) {
          expect(decoded).toContain(item.name)
          expect(decoded).toContain(String(item.quantity))
        }

        // subtotal amount present (formatted)
        expect(decoded).toContain(formatRupiah(data.subtotal))

        // paymentMethod present
        expect(decoded).toContain(data.paymentMethod)

        // change amount present (formatted)
        expect(decoded).toContain(formatRupiah(data.change))
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 5: formatRupiah returns valid Indonesian Rupiah format
// Validates: Requirements 2.6
// ---------------------------------------------------------------------------

describe('Property 5: formatRupiah produces Indonesian Rupiah format', () => {
  it('starts with "Rp" and uses period as thousands separator for whole numbers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (amount) => {
        const result = formatRupiah(amount)

        // Must start with "Rp "
        expect(result).toMatch(/^Rp /)

        // Indonesian locale: NO comma in the output (no decimal portion for whole numbers)
        expect(result).not.toContain(',')

        // Numeric portion: only digits and periods (period = thousands separator in id-ID)
        const numericPart = result.replace('Rp ', '')
        expect(numericPart).toMatch(/^[\d.]+$/)

        // Value round-trips: remove period separators, parse, should equal original
        const reconstructed = parseInt(numericPart.replace(/\./g, ''), 10)
        expect(reconstructed).toBe(Math.round(amount))
      }),
      { numRuns: 100 },
    )
  })

  it('handles zero correctly', () => {
    expect(formatRupiah(0)).toBe('Rp 0')
  })

  it('formats 15000 as "Rp 15.000"', () => {
    expect(formatRupiah(15000)).toBe('Rp 15.000')
  })

  it('formats 1500000 as "Rp 1.500.000"', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000')
  })
})
