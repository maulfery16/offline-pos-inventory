'use client'

import { Model } from '@nozbe/watermelondb'
// @ts-ignore
import { field, relation } from '@nozbe/watermelondb/decorators'

export default class TransactionItem extends Model {
  static table = 'transaction_items'

  // @ts-ignore
  @field('transaction_id') transactionId!: string
  // @ts-ignore
  @field('product_id') productId!: string
  // @ts-ignore
  @field('product_name') productName!: string
  // @ts-ignore
  @field('quantity') quantity!: number
  // @ts-ignore
  @field('selling_price') sellingPrice!: number
  // @ts-ignore
  @relation('transactions', 'transaction_id') transaction!: any
}
