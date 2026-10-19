export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';
import { verifyJWT } from '@/core/auth';

// GET /api/users?role=cashier
// Returns users scoped to the caller's tenantId (from JWT).
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const { tenantId } = payload;

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
        // Include branch via join through a device is not modelled on User
        // branchId is not on User model; we return without it
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
// Creates a new user. tenantId is always from the JWT, never from the body.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const { tenantId } = payload;

    const body = await request.json();
    const { name, hashedPin, branchId, role = 'cashier' } = body as {
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
