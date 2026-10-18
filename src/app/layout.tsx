import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import { Toaster } from '@/shared/components/Toast';
import DatabaseProvider from '@/core/db/DatabaseProvider';


export const viewport: Viewport = {
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Offline POS Inventory',
  description: 'Offline-First Multi-Tenant POS & Inventory System',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <DatabaseProvider>
          {children}
          <Toaster position="top-right" />
        </DatabaseProvider>
      </body>
    </html>
  );
}
