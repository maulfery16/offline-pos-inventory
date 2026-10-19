'use client'

import { Database } from '@nozbe/watermelondb'
import { Q } from '@nozbe/watermelondb'
import InventoryBatch from '@/core/db/models/InventoryBatch'

/**
 * Result of an expiry check for a product.
 * - 'ok': all batches are valid
 * - 'warning': some batches expired, but at least one is still valid (FEFO applies)
 * - 'blocked': no valid batches — product cannot be sold
 */
export type ExpiryCheckResult =
  | { status: 'ok' }
  | { status: 'warning'; message: string }
  | { status: 'blocked'; message: string }

/**
 * Checks the expiry status of all inventory batches for a given product.
 * Queries WatermelonDB locally — no network requests.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export async function checkProductExpiry(
  productId: string,
  db: Database,
): Promise<ExpiryCheckResult> {
  try {
    const batches = await db
      .get<InventoryBatch>('inventory_batches')
      .query(Q.where('product_id', productId))
      .fetch()

    // 6.1 — No batches found: product not in stock
    if (batches.length === 0) {
      return {
        status: 'blocked',
        message: 'Stok tidak ditemukan untuk produk ini',
      }
    }

    const now = new Date()

    // 6.2 — A batch is expired if its expiryDate is in the past OR it is explicitly blocked.
    //        Null expiryDate means non-perishable → treated as non-expired.
    const expiredBatches = batches.filter((batch) => {
      const isExpiredByDate =
        batch.expiryDate != null && batch.expiryDate < now
      return isExpiredByDate || batch.isBlocked === true
    })

    // 6.3 — All batches expired/blocked: product cannot be sold
    if (expiredBatches.length === batches.length) {
      return {
        status: 'blocked',
        message:
          'Produk tidak dapat dijual — semua batch telah kedaluwarsa atau diblokir',
      }
    }

    // 6.4 — Some (but not all) batches expired: warn, FEFO will skip bad batches
    if (expiredBatches.length > 0) {
      return {
        status: 'warning',
        message: 'Beberapa batch telah kedaluwarsa. FEFO otomatis diterapkan.',
      }
    }

    // 6.5 — All batches valid
    return { status: 'ok' }
  } catch (error) {
    // 6.6 — Fail-safe: block the sale if the check cannot be completed
    console.error('[expiryGuard] Failed to check product expiry:', error)
    return {
      status: 'blocked',
      message: 'Gagal memeriksa status kedaluwarsa produk. Silakan coba lagi.',
    }
  }
}
