export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// POST /api/reports/shift/close
// Body: { cashAmount: number, note?: string, status?: 'ok' | 'review' }
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const branchId = request.headers.get('x-branch-id');
    const deviceId = request.headers.get('x-device-id');

    if (!tenantId || !branchId || !deviceId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const body = await request.json();
    const { cashAmount, note, status } = body;

    if (cashAmount === undefined || cashAmount === null || typeof cashAmount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required field: cashAmount (number)' },
        { status: 400 }
      );
    }

    // Query all transactions since last shift close for this branch
    const lastShift = await prisma.shiftReport.findFirst({
      where: { tenantId, branchId },
      orderBy: { closedAt: 'desc' },
    });

    const since = lastShift?.closedAt ?? new Date(0); // beginning of time if no prior shift

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        branchId,
        transactionDate: { gte: since },
      },
    });

    const cashTransactions = transactions.filter(
      (tx) => tx.paymentMethod.toLowerCase() === 'tunai'
    );

    const expectedCash = cashTransactions.reduce(
      (sum, tx) => sum + Number(tx.totalAmount),
      0
    );

    const totalRevenue = transactions.reduce(
      (sum, tx) => sum + Number(tx.totalAmount),
      0
    );

    const variance = cashAmount - expectedCash;
    const resolvedStatus = status === 'review' ? 'review' : 'ok';

    const shiftReport = await prisma.shiftReport.create({
      data: {
        tenantId,
        branchId,
        expectedCash,
        physicalCash: cashAmount,
        variance,
        status: resolvedStatus,
        note: note ?? null,
        closedByDeviceId: deviceId,
        transactionCount: transactions.length,
        totalRevenue,
      },
    });

    return NextResponse.json({
      success: true,
      shiftReportId: shiftReport.id,
      closedAt: shiftReport.closedAt,
      expectedCash,
      physicalCash: cashAmount,
      variance,
      transactionCount: transactions.length,
      totalRevenue,
      status: resolvedStatus,
    });
  } catch (error) {
    console.error('[POST /api/reports/shift/close]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
