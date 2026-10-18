import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { Toaster } from '@/shared/components/Toast';
import DatabaseProvider from '@/core/db/DatabaseProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Offline POS Inventory',
  description: 'Offline-First Multi-Tenant POS & Inventory System',
  manifest: '/manifest.json',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <DatabaseProvider>
          {children}
          <Toaster position="top-right" />
        </DatabaseProvider>
      </body>
    </html>
  );
}
