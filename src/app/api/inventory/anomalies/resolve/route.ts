export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing x-tenant-id header' }, { status: 401 });
  }

  let batchId: string;
  let correctedQty: number;

  try {
    const body = await request.json();
    batchId = body.batchId;
    correctedQty = body.correctedQty;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!batchId || correctedQty === undefined || correctedQty === null) {
    return NextResponse.json({ error: 'batchId and correctedQty are required' }, { status: 400 });
  }

  if (typeof correctedQty !== 'number' || !Number.isInteger(correctedQty)) {
    return NextResponse.json({ error: 'correctedQty must be an integer' }, { status: 400 });
  }

  // Verify batch belongs to tenant before updating (prevent cross-tenant writes)
  const existing = await prisma.inventoryBatch.findFirst({
    where: { id: batchId, tenantId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  await prisma.inventoryBatch.update({
    where: { id: batchId },
    data: { currentQty: correctedQty, hasAnomalyFlag: false },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
