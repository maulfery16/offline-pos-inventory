export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// GET /api/branches — list all active branches for the authenticated tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, code: true, address: true, createdAt: true },
    });

    return NextResponse.json({ data: branches });
  } catch (error) {
    console.error('[GET /api/branches]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/branches — create a new branch for the authenticated tenant
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address } = body as { name?: string; address?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Field "name" wajib diisi' }, { status: 400 });
    }

    // Auto-generate a unique code from the name (slugified + timestamp suffix)
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const code = `${slug}-${Date.now().toString(36)}`;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: name.trim(),
        code,
        address: address?.trim() ?? null,
      },
      select: { id: true, name: true, code: true, address: true, createdAt: true },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Cabang dengan kode ini sudah ada' },
        { status: 409 },
      );
    }
    console.error('[POST /api/branches]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
