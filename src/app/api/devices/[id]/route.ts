export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// DELETE /api/devices/[id]  — revoke a device
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 401 });
    }

    const { id } = params;

    // Ensure device belongs to this tenant before revoking
    const device = await prisma.device.findFirst({
      where: { id, tenantId },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (device.isRevoked) {
      return NextResponse.json({ error: 'Device already revoked' }, { status: 409 });
    }

    const updated = await prisma.device.update({
      where: { id },
      data: { isRevoked: true },
    });

    return NextResponse.json({ device: updated });
  } catch (error) {
    console.error('[DELETE /api/devices/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
