export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// PATCH /api/branches/[id] — update name and/or address of a branch
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, address } = body as { name?: string; address?: string | null };

    // Validate: name must be a non-empty string if provided
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'Field "name" tidak boleh kosong' }, { status: 400 });
    }

    // Build update data — only patch provided fields
    const data: { name?: string; address?: string | null } = {};
    if (name !== undefined) data.name = name.trim();
    if (address !== undefined) data.address = address ? address.trim() : null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diperbarui' }, { status: 400 });
    }

    // tenantId in WHERE ensures cross-tenant writes are impossible
    const branch = await prisma.branch.update({
      where: { id, tenantId },
      data,
      select: { id: true, name: true, code: true, address: true, createdAt: true },
    });

    return NextResponse.json(branch);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Cabang tidak ditemukan' }, { status: 404 });
    }
    console.error('[PATCH /api/branches/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
