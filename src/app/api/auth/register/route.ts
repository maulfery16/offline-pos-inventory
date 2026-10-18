export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/core/auth';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantCode, branchCode, deviceName, adminPassword } = body;

    if (!tenantCode || !branchCode || !deviceName || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantCode, branchCode, deviceName, adminPassword' },
        { status: 400 }
      );
    }

    // Find tenant by code
    const tenant = await prisma.tenant.findFirst({
      where: { code: tenantCode, deletedAt: null },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 401 });
    }

    // Find branch by code within tenant
    const branch = await prisma.branch.findFirst({
      where: { tenantId: tenant.id, code: branchCode, deletedAt: null },
    });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 401 });
    }

    // Verify admin password
    const tenantAdmin = await prisma.tenantAdmin.findUnique({
      where: { tenantId: tenant.id },
    });
    if (!tenantAdmin) {
      return NextResponse.json({ error: 'Admin not configured for this tenant' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(adminPassword, tenantAdmin.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Register device
    const device = await prisma.device.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: deviceName,
      },
    });

    // Sign long-lived device JWT (30 days)
    const token = await signJWT(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        deviceId: device.id,
        role: 'device',
      },
      '30d'
    );

    return NextResponse.json({
      token,
      deviceId: device.id,
      tenantName: tenant.name,
      branchName: branch.name,
    });
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
