'use client';

import { RetailShell } from '@/shared/layouts';
import { isDeviceRegistered, getSessionToken } from '@/core/auth/client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'redirecting'>('loading');

  useEffect(() => {
    if (isDeviceRegistered() && getSessionToken()) {
      setAuthState('authorized');
    } else {
      setAuthState('redirecting');
      router.replace('/masuk');
    }
  }, [router]);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f4f7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f6d5f]" />
      </div>
    );
  }

  if (authState === 'redirecting') {
    return null;
  }

  return <RetailShell isOffline={isOffline}>{children}</RetailShell>;
}
