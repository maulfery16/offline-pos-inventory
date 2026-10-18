'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isDeviceRegistered } from '@/core/auth/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isDeviceRegistered()) {
      router.replace('/kasir');
    } else {
      router.replace('/masuk');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f4f7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0f6d5f] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#5a6675]">Memuat…</p>
      </div>
    </main>
  );
}
