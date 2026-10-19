export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// GET /api/inventory/anomalies
// Returns all inventory batches flagged as anomalies for the authenticated tenant.
// tenantId is extracted from the x-tenant-id header injected by middleware — never from query params.
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const batches = await prisma.inventoryBatch.findMany({
      where: {
        hasAnomalyFlag: true,
        tenantId,
      },
      include: {
        product: true,
      },
    });

    const anomalies = batches.map((batch) => ({
      id: batch.id,
      productName: batch.product.name,
      sku: batch.product.sku,
      batchNumber: batch.batchNumber,
      currentQty: batch.currentQty,
      flaggedAt: batch.updatedAt,
    }));

    return NextResponse.json(anomalies, { status: 200 });
  } catch (error) {
    console.error('[GET /api/inventory/anomalies]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
