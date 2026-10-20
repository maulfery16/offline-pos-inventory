export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';

// GET /api/users?role=kasir
// tenantId is injected by middleware from the verified JWT — never read from body.
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = request.nextUrl.searchParams.get('role') ?? undefined;

    const users = await prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users
// Creates a new user. tenantId is always from the middleware-injected header.
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, hashedPin, branchId, role = 'kasir' } = body as {
      name?: string;
      hashedPin?: string;
      branchId?: string;
      role?: string;
    };

    if (!name || !hashedPin || !branchId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, hashedPin, branchId' },
        { status: 400 },
      );
    }

    // Validate the branch belongs to this tenant
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId, deletedAt: null },
    });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found or unauthorized' }, { status: 403 });
    }

    const user = await prisma.user.create({
      data: {
        tenantId,
        name,
        pinHash: hashedPin,
        role,
        isActive: true,
      },
      select: { id: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
