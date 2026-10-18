export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';
import type { Prisma } from '@prisma/client';


// GET /api/reports/shift?shiftId=&date=
// Since we don't have a Shift model yet, we use date-based filtering
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const branchId = request.headers.get('x-branch-id');

    if (!tenantId || !branchId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    // shiftId is optional — if not provided, use today
    const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions: Prisma.TransactionGetPayload<{ include: { items: { select: { quantity: true; sellingPrice: true; discountAmount: true } } } }>[] = await prisma.transaction.findMany({
      where: {
        tenantId,
        branchId,
        transactionDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: {
          select: {
            quantity: true,
            sellingPrice: true,
            discountAmount: true,
          },
        },
      },
    });

    const cashTransactions = transactions.filter(
      (tx) => tx.paymentMethod.toLowerCase() === 'tunai'
    );

    const expectedCash = cashTransactions.reduce((sum, tx) => {
      return sum + Number(tx.totalAmount);
    }, 0);

    const totalRevenue = transactions.reduce(
      (sum, tx) => sum + Number(tx.totalAmount),
      0
    );

    const breakdown = {
      tunai: cashTransactions.reduce((s, tx) => s + Number(tx.totalAmount), 0),
      qris: transactions
        .filter((tx) => tx.paymentMethod.toLowerCase() === 'qris')
        .reduce((s, tx) => s + Number(tx.totalAmount), 0),
      kartu: transactions
        .filter((tx) => tx.paymentMethod.toLowerCase() === 'kartu')
        .reduce((s, tx) => s + Number(tx.totalAmount), 0),
    };

    return NextResponse.json({
      date: dateParam,
      branchId,
      transactionCount: transactions.length,
      totalRevenue,
      expectedCash,
      paymentBreakdown: breakdown,
      // actualCash is entered by cashier during blind close — not stored here
      // Frontend compares expectedCash vs actualCash entered by user
    });
  } catch (error) {
    console.error('[GET /api/reports/shift]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
