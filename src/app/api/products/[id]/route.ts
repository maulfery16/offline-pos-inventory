export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteContext {
  params: { id: string };
}

// PUT /api/products/[id]
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const body = await request.json();
    const { name, barcode, unit, reorderPoint, defaultPrice } = body;

    const product = await prisma.product.updateMany({
      where: { id: params.id, tenantId, deletedAt: null },
      data: {
        ...(name !== undefined && { name }),
        ...(barcode !== undefined && { barcode }),
        ...(unit !== undefined && { unit }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(defaultPrice !== undefined && { defaultPrice }),
      },
    });

    if (product.count === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.product.findFirst({
      where: { id: params.id, tenantId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] — soft delete
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const result = await prisma.product.updateMany({
      where: { id: params.id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
