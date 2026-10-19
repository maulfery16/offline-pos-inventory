'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionToken, getDeviceToken, decodeSessionToken } from './client';
import type { JWTPayload } from './types';

/**
 * Client-side route guard.
 *
 * Redirects to /masuk if:
 * - No device token exists (device not registered)
 * - No session token exists (user not logged in for this session)
 * - Session token cannot be decoded
 * - allowedRoles is provided and the user's role is not in the list
 *
 * Usage in a page component:
 *   useRequireAuth(['kasir'])          // kasir only
 *   useRequireAuth(['admin', 'owner']) // admin or owner only
 *   useRequireAuth()                   // any authenticated session
 */
export function useRequireAuth(allowedRoles?: string[]) {
  const router = useRouter();

  useEffect(() => {
    const deviceToken = getDeviceToken();
    if (!deviceToken) {
      router.replace('/masuk');
      return;
    }

    const sessionToken = getSessionToken();
    if (!sessionToken) {
      router.replace('/masuk');
      return;
    }

    const payload = decodeSessionToken<JWTPayload>(sessionToken);
    if (!payload) {
      router.replace('/masuk');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(payload.role)) {
        // Redirect to correct dashboard based on actual role
        if (payload.role === 'kasir') router.replace('/kasir');
        else if (payload.role === 'owner') router.replace('/laporan');
        else router.replace('/inventaris');
      }
    }
  }, [router, allowedRoles]);
}
