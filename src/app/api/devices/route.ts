export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// GET /api/devices
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const devices = await prisma.device.findMany({
      where: { tenantId },
      include: {
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('[GET /api/devices]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
