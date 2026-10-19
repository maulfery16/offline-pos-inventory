'use client'

import { Database, Q } from '@nozbe/watermelondb'
import Product from '@/core/db/models/Product'
import InventoryBatch from '@/core/db/models/InventoryBatch'

export interface LowStockSummary {
  count: number
  productNames: string[]
}

export async function getLowStockSummary(
  db: Database,
  branchId: string
): Promise<LowStockSummary> {
  try {
    const productsCollection = db.get<Product>('products')
    const batchesCollection = db.get<InventoryBatch>('inventory_batches')

    // Fetch all non-deleted products
    const products = await productsCollection
      .query(Q.where('deleted_at', null))
      .fetch()

    const lowStockProducts: Product[] = []

    for (const product of products) {
      // Sum currentQty for this product + branch
      const batches = await batchesCollection
        .query(
          Q.where('product_id', product.id),
          Q.where('branch_id', branchId)
        )
        .fetch()

      const totalQty = batches.reduce((sum, b) => sum + (b.currentQty ?? 0), 0)

      if (totalQty <= product.reorderPoint) {
        lowStockProducts.push(product)
      }
    }

    return {
      count: lowStockProducts.length,
      productNames: lowStockProducts.slice(0, 3).map((p) => p.name),
    }
  } catch {
    return { count: 0, productNames: [] }
  }
}
