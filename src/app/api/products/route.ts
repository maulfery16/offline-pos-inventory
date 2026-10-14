export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/products?search=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { sku: { contains: search, mode: 'insensitive' as const } },
              { barcode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              inventoryBatches: {
                where: { deletedAt: null, isBlocked: false },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const body = await request.json();
    const { sku, name, barcode, unit, reorderPoint, defaultPrice } = body;

    if (!sku || !name || defaultPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sku, name, defaultPrice' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        sku,
        name,
        barcode: barcode ?? null,
        unit: unit ?? 'pcs',
        reorderPoint: reorderPoint ?? 0,
        defaultPrice,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists for this tenant' },
        { status: 409 }
      );
    }
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
