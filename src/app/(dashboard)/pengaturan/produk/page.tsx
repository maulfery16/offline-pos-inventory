'use client';

import { useEffect, useState } from 'react';
import { getSessionToken, getDeviceToken, decodeSessionToken } from '@/core/auth/client';
import type { JWTPayload } from '@/core/auth/types';
import ProductTab from '../tabs/ProductTab';

export default function ProdukPengaturanPage() {
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
      <ProductTab {...props} />
    </div>
  );
}
