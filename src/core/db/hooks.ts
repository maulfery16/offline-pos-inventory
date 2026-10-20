'use client'

import { useContext, useState, useEffect } from 'react'
import { Database, Q } from '@nozbe/watermelondb'
import Product from './models/Product'
import InventoryBatch from './models/InventoryBatch'
import Transaction from './models/Transaction'
import { DatabaseContext } from './DatabaseProvider'

// ---------------------------------------------------------------------------
// useDatabase
// ---------------------------------------------------------------------------
export function useDatabase(): Database | null {
  return useContext(DatabaseContext)
}

// ---------------------------------------------------------------------------
// useProducts
// ---------------------------------------------------------------------------
export function useProducts(search?: string): {
  products: Product[]
  isLoading: boolean
} {
  const db = useDatabase()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) return

    const collection = db.collections.get<Product>('products')

    // Always filter soft-deleted records
    const baseCondition = Q.where('deleted_at', Q.eq(null))

    const subscription = (
      search
        ? collection.query(
            baseCondition,
            Q.or(
              Q.where('name', Q.like(`%${Q.sanitizeLikeString(search)}%`)),
              Q.where('sku', Q.like(`%${Q.sanitizeLikeString(search)}%`))
            )
          )
        : collection.query(baseCondition)
    ).observe()
      .subscribe((result) => {
        setProducts(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [db, search])

  return { products, isLoading }
}

// ---------------------------------------------------------------------------
// useInventoryBatches
// ---------------------------------------------------------------------------
export function useInventoryBatches(productId?: string): {
  batches: InventoryBatch[]
  isLoading: boolean
} {
  const db = useDatabase()
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) return

    const collection = db.collections.get<InventoryBatch>('inventory_batches')

    const subscription = (
      productId
        ? collection.query(Q.where('product_id', productId))
        : collection.query()
    ).observe()
      .subscribe((result) => {
        setBatches(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [db, productId])

  return { batches, isLoading }
}

// ---------------------------------------------------------------------------
// useProductCount
// ---------------------------------------------------------------------------
export function useProductCount(): number {
  const db = useDatabase()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!db) return
    db.get('products').query().fetchCount().then(setCount).catch(() => {})
  }, [db])
  return count
}

// ---------------------------------------------------------------------------
// useActiveTransactions
// ---------------------------------------------------------------------------
export function useActiveTransactions(): {
  transactions: Transaction[]
  isLoading: boolean
} {
  const db = useDatabase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) return

    const collection = db.collections.get<Transaction>('transactions')

    const subscription = collection
      .query(Q.where('synced_at', Q.eq(null)))
      .observe()
      .subscribe((result) => {
        setTransactions(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [db])

  return { transactions, isLoading }
}
