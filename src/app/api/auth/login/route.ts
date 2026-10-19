export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/prisma';
import bcrypt from 'bcryptjs';
import { signJWT, verifyJWT } from '@/core/auth';
import type { UserRole } from '@/core/auth/types';

/**
 * POST /api/auth/login
 * Email + password login for admin / owner roles.
 * Requires a valid device token in the Authorization header (same as pin-verify).
 * Body: { email: string; password: string }
 * Returns: { sessionToken, userName, role }
 */
export async function POST(request: NextRequest) {
  try {
    // Require device JWT — tenantId/branchId come from it, never from the body
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 },
      );
    }

    const deviceToken = authHeader.slice(7);
    let devicePayload;
    try {
      devicePayload = await verifyJWT(deviceToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired device token' },
        { status: 401 },
      );
    }

    const { tenantId, branchId, deviceId } = devicePayload;

    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 },
      );
    }

    // Look up user by email within this tenant
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        email: email.toLowerCase().trim(),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Email atau kata sandi salah.' }, { status: 401 });
    }

    // Admin/owner use passwordHash field; cashiers use pinHash.
    // If passwordHash is not set fall back gracefully.
    const hashToCheck = user.passwordHash ?? user.pinHash;
    const valid = await bcrypt.compare(password, hashToCheck);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau kata sandi salah.' }, { status: 401 });
    }

    // Only allow non-kasir roles through this endpoint
    if (user.role === 'kasir') {
      return NextResponse.json(
        { error: 'Kasir harus masuk dengan PIN, bukan email.' },
        { status: 403 },
      );
    }

    const sessionToken = await signJWT(
      {
        tenantId,
        branchId,
        deviceId,
        role: user.role as UserRole,
        userId: user.id,
        userName: user.name,
      },
      '8h',
    );

    return NextResponse.json({
      sessionToken,
      userName: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
