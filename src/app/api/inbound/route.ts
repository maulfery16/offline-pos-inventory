export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface InboundItem {
  productId: string;
  qty: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
  sellingPrice: number;
}

interface InboundBody {
  supplierId?: string;
  invoiceNumber: string;
  items: InboundItem[];
}

// POST /api/inbound
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const branchId = request.headers.get('x-branch-id');

    if (!tenantId || !branchId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const body: InboundBody = await request.json();
    const { invoiceNumber, items } = body;

    if (!invoiceNumber || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceNumber, items' },
        { status: 400 }
      );
    }

    let totalHPP = 0;
    const createdBatches: string[] = [];

    await prisma.$transaction(async (prismaTx) => {
      for (const item of items) {
        const { productId, qty, unitCost, batchNumber, expiryDate, sellingPrice } = item;

        if (!productId || qty <= 0 || unitCost < 0 || sellingPrice < 0) {
          throw new Error(`Invalid item data for productId: ${productId}`);
        }

        // Verify product belongs to this tenant
        const product = await prismaTx.product.findFirst({
          where: { id: productId, tenantId, deletedAt: null },
        });
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        // Create inventory batch
        const batch = await prismaTx.inventoryBatch.create({
          data: {
            tenantId,
            branchId,
            productId,
            batchNumber: batchNumber ?? null,
            receivedDate: new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            unitCost,
            initialQty: qty,
            currentQty: qty,
          },
        });

        createdBatches.push(batch.id);
        totalHPP += qty * unitCost;

        // Update product's default price if sellingPrice changed
        if (Number(product.defaultPrice) !== sellingPrice) {
          await prismaTx.product.update({
            where: { id: productId },
            data: { defaultPrice: sellingPrice },
          });
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        invoiceNumber,
        batchesCreated: createdBatches.length,
        batchIds: createdBatches,
        totalHPP,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[POST /api/inbound]', error);
    const isClientError = message.includes('not found') || message.includes('Invalid item');
    return NextResponse.json(
      { error: message },
      { status: isClientError ? 400 : 500 }
    );
  }
}
