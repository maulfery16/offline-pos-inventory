import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/core/auth';

// Page-level auth (dashboard routes: /kasir, /inventaris, /laporan, /barang-masuk, /kedaluwarsa)
// is handled client-side. The device token is stored in localStorage (not cookies), so middleware
// cannot access it. Client-side guards live in each page and in src/app/page.tsx (root redirect).
// This middleware only enforces JWT on /api/* routes.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth routes — let them through without JWT verification
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Verify JWT for all other /api/* routes
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token);

    // Inject tenant/branch/device context into request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', payload.tenantId);
    requestHeaders.set('x-branch-id', payload.branchId);
    requestHeaders.set('x-device-id', payload.deviceId);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
