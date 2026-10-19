'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { decodeJwt } from 'jose'
import { Q } from '@nozbe/watermelondb'
import { useDatabase } from '@/core/db/hooks'
import { getDeviceToken } from '@/core/auth/client'
import { getLowStockSummary } from '@/features/inventory/notifications'
import type { JWTPayload } from '@/core/auth/types'

// ---------------------------------------------------------------------------
// useLowStockBadge
// Reactively tracks the count of low-stock products for the device's branch.
// Subscribes to the WatermelonDB products + inventory_batches collections so
// the badge updates whenever local data changes (e.g. after a sync pull).
// On the first load, if count > 0 it fires a sonner toast.
// ---------------------------------------------------------------------------
export function useLowStockBadge(): { count: number } {
  const db = useDatabase()
  const [count, setCount] = useState(0)
  const hasToastedRef = useRef(false)

  useEffect(() => {
    if (!db) return

    // Decode branchId from the device JWT without verifying the signature
    // (verification happens server-side; here we only need the claim value).
    const rawToken = getDeviceToken()
    if (!rawToken) return

    let branchId: string
    try {
      const payload = decodeJwt(rawToken) as JWTPayload
      branchId = payload.branchId
    } catch {
      // Malformed token — bail out silently
      return
    }

    if (!branchId) return

    // Subscribe to both products and inventory_batches collections so the
    // hook re-runs whenever either collection changes (e.g. after sync).
    const productsCollection = db.collections.get('products')
    const batchesCollection = db.collections.get('inventory_batches')

    // We observe the products collection (non-deleted) as the primary trigger.
    // Any change to products or batches will re-evaluate low-stock counts.
    const productsSubscription = productsCollection
      .query(Q.where('deleted_at', Q.eq(null)))
      .observe()
      .subscribe(async () => {
        const summary = await getLowStockSummary(db, branchId)
        setCount(summary.count)

        // Fire the toast only once per mount, on the first data load
        if (!hasToastedRef.current && summary.count > 0) {
          hasToastedRef.current = true
          toast.warning(
            `${summary.count} produk stok rendah — periksa halaman Inventaris`
          )
        }
      })

    // Also observe batches so qty changes (e.g. after a POS transaction sync)
    // immediately update the badge without waiting for a product record write.
    const batchesSubscription = batchesCollection
      .query(Q.where('branch_id', branchId))
      .observe()
      .subscribe(async () => {
        const summary = await getLowStockSummary(db, branchId)
        setCount(summary.count)
      })

    return () => {
      productsSubscription.unsubscribe()
      batchesSubscription.unsubscribe()
    }
  }, [db])

  return { count }
}
