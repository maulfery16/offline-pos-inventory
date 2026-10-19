'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  ScanBarcode,
  PackagePlus,
  Boxes,
  CalendarClock,
  ChartLine,
  Menu,
  X,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import { useLowStockBadge } from '@/features/inventory/hooks/useLowStockBadge';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group?: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Kasir (POS)', href: '/kasir', icon: <ScanBarcode className="w-[18px] h-[18px]" />, group: 'Operasional' },
  { label: 'Barang Masuk', href: '/barang-masuk', icon: <PackagePlus className="w-[18px] h-[18px]" />, group: 'Operasional' },
  { label: 'Inventaris', href: '/inventaris', icon: <Boxes className="w-[18px] h-[18px]" />, group: 'Operasional' },
  { label: 'Kedaluwarsa & FEFO', href: '/kedaluwarsa', icon: <CalendarClock className="w-[18px] h-[18px]" />, group: 'Operasional' },
  { label: 'Laporan Laba', href: '/laporan', icon: <ChartLine className="w-[18px] h-[18px]" />, group: 'Analitik' },
];

const getPageTitle = (pathname: string | null): string => {
  if (!pathname) return 'Dashboard';
  for (const item of navigationItems) {
    if (pathname.startsWith(item.href)) return item.label;
  }
  return 'Dashboard';
};

export interface RetailShellProps {
  children: React.ReactNode;
  isOffline?: boolean;
  title?: string;
  headerActions?: React.ReactNode;
}

export const RetailShell: React.FC<RetailShellProps> = ({
  children,
  isOffline = false,
  title,
  headerActions,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { count: lowStockCount } = useLowStockBadge();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const pageTitle = title ?? getPageTitle(pathname);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    drawerRef.current?.showModal();
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    drawerRef.current?.close();
  };

  // Close drawer on route change
  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        closeDrawer();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderNavItems = (onClick?: () => void) => {
    let currentGroup = '';
    return navigationItems.map((item) => {
      const isActive = pathname?.startsWith(item.href);
      const showGroupLabel = item.group !== currentGroup;
      currentGroup = item.group || '';

      return (
        <React.Fragment key={item.href}>
          {showGroupLabel && (
            <span className="px-3 mb-2 mt-4 first:mt-0 text-xs uppercase tracking-wider text-[#8593a6]">
              {item.group}
            </span>
          )}
          <Link
            href={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-[10px] text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-[#7fe3c9] focus-visible:outline-offset-2',
              isActive
                ? 'bg-[#0f6d5f] text-white'
                : 'text-[#d3dbe6] hover:bg-[#1b2534] hover:text-white'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={cn(isActive ? 'text-white' : 'text-[#8b98ab]')}>
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.href === '/inventaris' && lowStockCount > 0 && (
              <span className="ml-auto min-w-[20px] px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#fdf0da] text-[#8a5300]">
                {lowStockCount}
              </span>
            )}
          </Link>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#182230]">
      {/* Sidebar - Desktop */}
      <aside
        className="hidden min-[900px]:flex fixed inset-y-0 left-0 w-[248px] flex-col gap-5 px-4 py-5 bg-[#101828] text-[#e7ecf3] overflow-y-auto z-30"
        aria-label="Navigasi modul"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-[#0f6d5f] text-white">
            <Store className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="font-bold tracking-tight">Warung Nusantara</div>
            <div className="text-xs text-[#97a3b4]">Retail Operations</div>
          </div>
        </div>

        {/* Store Info */}
        <div className="grid gap-1 p-3 rounded-[10px] bg-[#1b2534] border border-[#2a3648] text-xs text-[#b6c1d0]">
          <span>Cabang aktif</span>
          <strong className="text-[13px] text-[#f2f6fb]">Cabang Kebayoran</strong>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-none',
                isOffline ? 'bg-[#f3b64a]' : 'bg-[#4ec38a]'
              )}
            />
            {isOffline ? 'Mode offline' : 'Data tersinkron · 2 menit lalu'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1" aria-label="Modul">
          {renderNavItems()}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-2 text-xs text-[#8593a6]">
          <div className="flex items-center gap-3 p-2 rounded-[10px] bg-[#1b2534]">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-[#12507f] text-white text-xs font-semibold">
              RA
            </span>
            <span>
              <span className="text-[13px] text-[#f2f6fb] font-semibold">Rani Anggraeni</span>
              <br />
              Admin · 2 cabang
            </span>
          </div>
          <span>Mode offline siap · 1.240 SKU lokal</span>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <dialog
        ref={drawerRef}
        className={cn(
          'm-0 w-[min(300px,88vw)] h-dvh max-h-[100dvh] border-0 p-5 bg-[#101828] text-[#d3dbe6]',
          '[&::backdrop]:bg-[rgba(15,22,33,0.55)]'
        )}
        aria-label="Navigasi modul"
      >
        <button
          onClick={closeDrawer}
          className={cn(
            'flex items-center justify-center gap-2 w-full min-h-[40px] px-3 mb-4 rounded-[10px]',
            'bg-[#1b2534] border border-[#2a3648] text-[#e7ecf3] text-sm cursor-pointer'
          )}
          type="button"
        >
          <X className="w-4 h-4" />
          Tutup menu
        </button>
        <nav className="flex flex-col gap-1" aria-label="Modul (seluler)">
          {renderNavItems(closeDrawer)}
        </nav>
      </dialog>

      {/* Main Body */}
      <div className="ml-0 min-[900px]:ml-[248px] min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#e2e6ec]">
          <div className="flex items-center justify-between gap-4 flex-wrap py-4 px-4 min-[900px]:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={openDrawer}
                className={cn(
                  'min-[900px]:hidden flex items-center gap-2 min-h-[40px] px-3 rounded-[10px]',
                  'border border-[#cbd2dc] bg-white text-inherit text-sm cursor-pointer',
                  'focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2'
                )}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isDrawerOpen}
              >
                <Menu className="w-4 h-4" />
                Menu
              </button>
              <div className="min-w-0">
                <span className="block text-xs text-[#5a6675]">{pageTitle}</span>
                <h1 className="m-0 text-xl min-[900px]:text-[22px] font-bold tracking-tight leading-tight">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {isOffline && (
                <Badge variant="warning" dot>
                  <WifiOff className="w-4 h-4" />
                  Offline
                </Badge>
              )}
              {headerActions}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="min-w-0 p-4 min-[900px]:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
