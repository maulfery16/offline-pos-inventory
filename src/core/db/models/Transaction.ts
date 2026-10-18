'use client'

import { Model } from '@nozbe/watermelondb'
// @ts-ignore
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'

export default class Transaction extends Model {
  static table = 'transactions'

  // @ts-ignore
  @field('branch_id') branchId!: string
  // @ts-ignore
  @field('cashier_id') cashierId!: string
  // @ts-ignore
  @field('payment_method') paymentMethod!: string
  // @ts-ignore
  @field('status') status!: string
  // @ts-ignore
  @field('total_amount') totalAmount!: number
  // @ts-ignore
  @field('cash_received') cashReceived!: number
  // @ts-ignore
  @readonly @date('created_at') createdAt!: Date
  // @ts-ignore
  @date('synced_at') syncedAt!: Date | null
  // @ts-ignore
  @children('transaction_items') items!: any
}
