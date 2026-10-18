export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';


// GET /api/reports/profit?from=&to=&branchId=
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const jwtBranchId = request.headers.get('x-branch-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const branchIdParam = searchParams.get('branchId') ?? jwtBranchId;

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required params: from, to (ISO date strings)' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // include end of day

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        ...(branchIdParam ? { branchId: branchIdParam } : {}),
        transactionDate: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: {
            batchesApplied: {
              include: {
                inventoryBatch: {
                  select: { unitCost: true },
                },
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCOGS = 0;
    const itemSummary: Array<{
      transactionId: string;
      productId: string;
      quantity: number;
      revenue: number;
      cogs: number;
      grossProfit: number;
    }> = [];

    for (const tx of transactions) {
      for (const item of tx.items) {
        const revenue = item.quantity * Number(item.sellingPrice) - Number(item.discountAmount);
        const cogs = item.batchesApplied.reduce((sum, b) => {
          return sum + b.qtyDeducted * Number(b.inventoryBatch.unitCost);
        }, 0);
        const grossProfit = revenue - cogs;

        totalRevenue += revenue;
        totalCOGS += cogs;

        itemSummary.push({
          transactionId: tx.id,
          productId: item.productId,
          quantity: item.quantity,
          revenue,
          cogs,
          grossProfit,
        });
      }
    }

    return NextResponse.json({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      branchId: branchIdParam,
      totalRevenue,
      totalCOGS,
      grossProfit: totalRevenue - totalCOGS,
      grossMarginPct:
        totalRevenue > 0
          ? (((totalRevenue - totalCOGS) / totalRevenue) * 100).toFixed(2)
          : '0.00',
      transactionCount: transactions.length,
      items: itemSummary,
    });
  } catch (error) {
    console.error('[GET /api/reports/profit]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
