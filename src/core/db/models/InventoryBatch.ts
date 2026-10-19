'use client'

import { Model } from '@nozbe/watermelondb'
// @ts-ignore
import { field, date, relation } from '@nozbe/watermelondb/decorators'

export default class InventoryBatch extends Model {
  static table = 'inventory_batches'

  // @ts-ignore
  @field('product_id') productId!: string
  // @ts-ignore
  @field('tenant_id') tenantId!: string
  // @ts-ignore
  @field('branch_id') branchId!: string
  // @ts-ignore
  @field('batch_number') batchNumber!: string
  // @ts-ignore
  @date('expiry_date') expiryDate!: Date
  // @ts-ignore
  @date('received_date') receivedDate!: Date
  // @ts-ignore
  @field('current_qty') currentQty!: number
  // @ts-ignore
  @field('unit_cost') unitCost!: number
  // @ts-ignore
  @field('selling_price') sellingPrice!: number
  // @ts-ignore
  @field('is_blocked') isBlocked!: boolean
  // @ts-ignore
  @field('has_anomaly_flag') hasAnomalyFlag!: boolean

  // @ts-ignore
  @relation('products', 'product_id') product!: any
}
