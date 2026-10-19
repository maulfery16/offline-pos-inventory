export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';
import bcrypt from 'bcryptjs';
import { signJWT, verifyJWT } from '@/core/auth';
import type { UserRole } from '@/core/auth/types';


export async function POST(request: NextRequest) {
  try {
    // Extract and verify device JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let devicePayload;
    try {
      devicePayload = await verifyJWT(token);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired device token' }, { status: 401 });
    }

    // tenantId and branchId come ONLY from verified JWT, never from body
    const { tenantId, branchId, deviceId } = devicePayload;

    const body = await request.json();
    const { userId, pin } = body;

    if (!userId || !pin) {
      return NextResponse.json({ error: 'Missing required fields: userId, pin' }, { status: 400 });
    }

    // Find user — must belong to the JWT's tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId, // CRITICAL: tenantId from JWT, not body
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Sign 8-hour session token
    const sessionToken = await signJWT(
      {
        tenantId,
        branchId,
        deviceId,
        role: user.role as UserRole,
        userId: user.id,
        userName: user.name,
      },
      '8h'
    );

    return NextResponse.json({
      sessionToken,
      userName: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('[POST /api/auth/pin-verify]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
