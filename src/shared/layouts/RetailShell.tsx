'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, WifiOff } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';

interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Kasir',
    href: '/kasir',
    icon: '🛒',
  },
  {
    label: 'Barang Masuk',
    href: '/barang-masuk',
    icon: '📦',
  },
  {
    label: 'Inventaris',
    href: '/inventaris',
    icon: '📋',
  },
  {
    label: 'Kedaluwarsa',
    href: '/kedaluwarsa',
    icon: '⏰',
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: '📊',
  },
];

export interface RetailShellProps {
  children: React.ReactNode;
  isOffline?: boolean;
}

export const RetailShell: React.FC<RetailShellProps> = ({
  children,
  isOffline = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200',
          'transition-all duration-300'
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            POS Offline
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  'min-h-[44px]', // Touch-friendly
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-300 md:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Brand with Close Button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            POS Offline
          </h1>
          <button
            onClick={closeSidebar}
            className={cn(
              'p-2 rounded-md text-gray-500 hover:bg-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-primary'
            )}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  'min-h-[44px]', // Touch-friendly
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 md:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-2 rounded-md text-gray-500 hover:bg-gray-100 md:hidden',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              'min-w-[44px] min-h-[44px]' // Touch-friendly
            )}
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* Offline Indicator */}
          {isOffline && (
            <Badge variant="offline" dot aria-label="Offline mode">
              <WifiOff className="w-4 h-4" aria-hidden="true" />
              <span>Offline</span>
            </Badge>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};
