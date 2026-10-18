'use client'

import { Model } from '@nozbe/watermelondb'
// @ts-ignore
import { field, date, children } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
  static table = 'products'

  // @ts-ignore
  @field('tenant_id') tenantId!: string
  // @ts-ignore
  @field('name') name!: string
  // @ts-ignore
  @field('sku') sku!: string
  // @ts-ignore
  @field('unit') unit!: string
  // @ts-ignore
  @field('selling_price') sellingPrice!: number
  // @ts-ignore
  @field('reorder_point') reorderPoint!: number
  // @ts-ignore
  @date('deleted_at') deletedAt!: Date | null
  // @ts-ignore
  @children('inventory_batches') batches!: any
}
