export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// PATCH /api/users/[id]
// Allows updating isActive (and optionally name/role).
// tenantId is always from middleware-injected header — never trusted from body.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Confirm user belongs to this tenant before updating
    const existing = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    // Only allow safe fields; ignore tenantId even if sent in body
    const { isActive, name } = body as { isActive?: boolean; name?: string };

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(name ? { name } : {}),
      },
      select: { id: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PATCH /api/users/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
