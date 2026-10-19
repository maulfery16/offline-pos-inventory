import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/core/auth';

// NOTE: Middleware runs on the Edge runtime (default) so it can mutate
// request headers via NextResponse.next({ request: { headers } }).
// Device revocation (isRevoked) is enforced inside each API route handler
// via the injected x-device-id header, not here, because Prisma cannot
// run in the Edge runtime.

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

    // Inject tenant/branch/device context into request headers for route handlers
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
