'use client';

import { useEffect, useState } from 'react';
import { getSessionToken, getDeviceToken, decodeSessionToken } from '@/core/auth/client';
import type { JWTPayload } from '@/core/auth/types';
import CashierTab from '../tabs/CashierTab';

export default function KasirPengaturanPage() {
  const [props, setProps] = useState<{ tenantId: string; branchId: string } | null>(null);

  useEffect(() => {
    const raw = getSessionToken() ?? getDeviceToken();
    if (!raw) return;
    const payload = decodeSessionToken<JWTPayload>(raw);
    if (!payload) return;
    setProps({ tenantId: payload.tenantId, branchId: payload.branchId });
  }, []);

  if (!props) return null;

  return (
    <div className="grid gap-6">
      <CashierTab {...props} />
    </div>
  );
}
