'use client';

import { useEffect, useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionToken, getDeviceToken, decodeSessionToken } from '@/core/auth/client';
import type { JWTPayload } from '@/core/auth/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';

// Lazy-load tab panels to keep the initial bundle lean
const BranchTab = lazy(() => import('./tabs/BranchTab'));
const CashierTab = lazy(() => import('./tabs/CashierTab'));
const DeviceTab = lazy(() => import('./tabs/DeviceTab'));
const ProductTab = lazy(() => import('./tabs/ProductTab'));
const StoreTab = lazy(() => import('./tabs/StoreTab'));

/** Shared props every tab panel receives */
export interface TabProps {
  tenantId: string;
  branchId: string;
}

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-[13px] text-[#5a6675]">
      Memuat…
    </div>
  );
}

export default function PengaturanPage() {
  const router = useRouter();
  const [session, setSession] = useState<Pick<JWTPayload, 'tenantId' | 'branchId' | 'role'> | null>(null);

  useEffect(() => {
    // Prefer session token (cashier login), fall back to device token
    const raw = getSessionToken() ?? getDeviceToken();
    if (!raw) {
      // No token at all — send to login
      router.replace('/masuk');
      return;
    }

    const payload = decodeSessionToken<JWTPayload>(raw);
    if (!payload) {
      router.replace('/masuk');
      return;
    }

    // Role guard: kasir may not access settings
    if (payload.role === 'kasir') {
      router.replace('/kasir');
      return;
    }

    setSession({
      tenantId: payload.tenantId,
      branchId: payload.branchId,
      role: payload.role,
    });
  }, [router]);

  // Don't render anything until role is confirmed
  if (!session) return null;

  const tabProps: TabProps = {
    tenantId: session.tenantId,
    branchId: session.branchId,
  };

  return (
    <div className="grid gap-6">
      {/* Page header */}
      <header>
        <h1 className="m-0 text-xl font-bold text-[#182230]">Pengaturan</h1>
        <p className="m-0 mt-1 text-[13px] text-[#5a6675]">
          Kelola cabang, kasir, perangkat, produk, dan informasi toko.
        </p>
      </header>

      <Tabs defaultValue="cabang">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="cabang">Cabang</TabsTrigger>
          <TabsTrigger value="kasir">Kasir</TabsTrigger>
          <TabsTrigger value="perangkat">Perangkat</TabsTrigger>
          <TabsTrigger value="produk">Produk</TabsTrigger>
          <TabsTrigger value="info-toko">Info Toko</TabsTrigger>
        </TabsList>

        <TabsContent value="cabang">
          <Suspense fallback={<TabFallback />}>
            <BranchTab {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="kasir">
          <Suspense fallback={<TabFallback />}>
            <CashierTab {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="perangkat">
          <Suspense fallback={<TabFallback />}>
            <DeviceTab {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="produk">
          <Suspense fallback={<TabFallback />}>
            <ProductTab {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="info-toko">
          <Suspense fallback={<TabFallback />}>
            <StoreTab {...tabProps} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
