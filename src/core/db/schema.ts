'use client'

import { appSchema, tableSchema } from '@nozbe/watermelondb/Schema'

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'tenant_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'sku', type: 'string' },
        { name: 'selling_price', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'reorder_point', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'inventory_batches',
      columns: [
        { name: 'product_id', type: 'string' },
        { name: 'tenant_id', type: 'string' },
        { name: 'branch_id', type: 'string' },
        { name: 'batch_number', type: 'string' },
        { name: 'expiry_date', type: 'number' },
        { name: 'received_date', type: 'number' },
        { name: 'current_qty', type: 'number' },
        { name: 'unit_cost', type: 'number' },
        { name: 'selling_price', type: 'number' },
        { name: 'is_blocked', type: 'boolean' },
        { name: 'has_anomaly_flag', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'branch_id', type: 'string' },
        { name: 'cashier_id', type: 'string' },
        { name: 'payment_method', type: 'string' },
        { name: 'total_amount', type: 'number' },
        { name: 'cash_received', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transaction_items',
      columns: [
        { name: 'transaction_id', type: 'string' },
        { name: 'product_id', type: 'string' },
        { name: 'product_name', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'selling_price', type: 'number' },
      ],
    }),
  ],
})

export default schema
