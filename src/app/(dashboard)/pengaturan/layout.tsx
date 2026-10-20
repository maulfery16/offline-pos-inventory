'use client';

/**
 * Shared layout for all /pengaturan/* sub-pages.
 * Handles auth guard (role check) so individual pages don't need to.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionToken, getDeviceToken, decodeSessionToken } from '@/core/auth/client';
import type { JWTPayload } from '@/core/auth/types';

export interface TabProps {
  tenantId: string;
  branchId: string;
}

export default function PengaturanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = getSessionToken() ?? getDeviceToken();
    if (!raw) { router.replace('/masuk'); return; }

    const payload = decodeSessionToken<JWTPayload>(raw);
    if (!payload) { router.replace('/masuk'); return; }

    if (payload.role === 'kasir') { router.replace('/kasir'); return; }

    setReady(true);
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
