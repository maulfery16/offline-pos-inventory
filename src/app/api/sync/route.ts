export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';
import type { Prisma } from '@prisma/client';


// ---------------------------------------------------------------------------
// GET /api/sync?lastPulledAt={timestamp}
// WatermelonDB sync pull — returns created/updated/deleted records
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const branchId = request.headers.get('x-branch-id');

    if (!tenantId || !branchId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const lastPulledAtParam = searchParams.get('lastPulledAt');
    const lastPulledAt = lastPulledAtParam
      ? new Date(Number(lastPulledAtParam))
      : new Date(0);

    const now = Date.now();

    // Pull products for this tenant
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        OR: [
          { createdAt: { gt: lastPulledAt } },
          { updatedAt: { gt: lastPulledAt } },
        ],
      },
    });

    const createdProducts = products.filter(
      (p) => !p.deletedAt && p.createdAt > lastPulledAt
    );
    const updatedProducts = products.filter(
      (p) => !p.deletedAt && p.updatedAt > lastPulledAt && p.createdAt <= lastPulledAt
    );
    const deletedProductIds = products
      .filter((p) => p.deletedAt !== null)
      .map((p) => p.id);

    // Pull inventory batches for this tenant+branch
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        tenantId,
        branchId,
        OR: [
          { createdAt: { gt: lastPulledAt } },
          { updatedAt: { gt: lastPulledAt } },
        ],
      },
    });

    const createdBatches = batches.filter(
      (b) => !b.deletedAt && b.createdAt > lastPulledAt
    );
    const updatedBatches = batches.filter(
      (b) => !b.deletedAt && b.updatedAt > lastPulledAt && b.createdAt <= lastPulledAt
    );
    const deletedBatchIds = batches
      .filter((b) => b.deletedAt !== null)
      .map((b) => b.id);

    return NextResponse.json({
      changes: {
        products: {
          created: createdProducts,
          updated: updatedProducts,
          deleted: deletedProductIds,
        },
        inventory_batches: {
          created: createdBatches,
          updated: updatedBatches,
          deleted: deletedBatchIds,
        },
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('[GET /api/sync]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/sync
// WatermelonDB sync push — processes offline transactions with FEFO deduction
// ---------------------------------------------------------------------------

interface TransactionItemInput {
  id: string;
  productId: string;
  quantity: number;
  sellingPrice: number;
  discountAmount?: number;
}

interface TransactionInput {
  id: string; // UUID generated on frontend
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  cashierPinUsed?: string;
  transactionDate?: string;
  items: TransactionItemInput[];
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const branchId = request.headers.get('x-branch-id');

    if (!tenantId || !branchId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const body = await request.json();
    const transactions: TransactionInput[] = body.transactions ?? body;

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid payload: expected array of transactions' }, { status: 400 });
    }

    let processedCount = 0;
    const anomalies: { transactionId: string; productId: string; shortfall: number }[] = [];

    for (const tx of transactions) {
      // Process each transaction in its own Prisma transaction for row-level safety
      await prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
        // Idempotent upsert — skip if UUID already exists
        const existing = await prismaTx.transaction.findUnique({
          where: { id: tx.id },
        });
        if (existing) return;

        // Create the transaction record
        await prismaTx.transaction.create({
          data: {
            id: tx.id,
            tenantId, // from JWT, never from body
            branchId, // from JWT, never from body
            receiptNumber: tx.receiptNumber,
            totalAmount: tx.totalAmount,
            paymentMethod: tx.paymentMethod,
            cashierPinUsed: tx.cashierPinUsed,
            transactionDate: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
          },
        });

        for (const item of tx.items) {
          // Create transaction item
          const txItem = await prismaTx.transactionItem.create({
            data: {
              transactionId: tx.id,
              productId: item.productId,
              quantity: item.quantity,
              sellingPrice: item.sellingPrice,
              discountAmount: item.discountAmount ?? 0,
            },
          });

          // FEFO deduction: lock batches with SELECT FOR UPDATE
          // Sort by expiryDate ASC NULLS LAST, receivedDate ASC
          const batches = await prismaTx.$queryRaw<
            Array<{
              id: string;
              current_qty: number;
              unit_cost: string;
            }>
          >`
            SELECT id, current_qty, unit_cost
            FROM inventory_batches
            WHERE tenant_id = ${tenantId}
              AND branch_id = ${branchId}
              AND product_id = ${item.productId}
              AND deleted_at IS NULL
              AND is_blocked = false
            ORDER BY
              expiry_date ASC NULLS LAST,
              received_date ASC
            FOR UPDATE
          `;

          let remaining = item.quantity;

          for (const batch of batches) {
            if (remaining <= 0) break;

            const available = batch.current_qty;
            const toDeduct = Math.min(available, remaining);

            // Insert FEFO ledger entry
            await prismaTx.transactionItemBatch.create({
              data: {
                transactionItemId: txItem.id,
                inventoryBatchId: batch.id,
                qtyDeducted: toDeduct,
                costApplied: parseFloat(batch.unit_cost),
              },
            });

            const newQty = available - toDeduct;

            // Update batch qty — allow negative (offline tolerance)
            await prismaTx.$executeRaw`
              UPDATE inventory_batches
              SET current_qty = ${newQty},
                  has_anomaly_flag = CASE WHEN ${newQty} < 0 THEN true ELSE has_anomaly_flag END,
                  updated_at = NOW()
              WHERE id = ${batch.id}
            `;

            if (newQty < 0) {
              anomalies.push({
                transactionId: tx.id,
                productId: item.productId,
                shortfall: Math.abs(newQty),
              });
            }

            remaining -= toDeduct;
          }

          // If still remaining after all batches exhausted, create an anomaly entry
          if (remaining > 0) {
            anomalies.push({
              transactionId: tx.id,
              productId: item.productId,
              shortfall: remaining,
            });
          }
        }
      });

      processedCount++;
    }

    return NextResponse.json({ processedCount, anomalies });
  } catch (error) {
    console.error('[POST /api/sync]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
