'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Store,
  ScanBarcode,
  PackagePlus,
  Boxes,
  CalendarClock,
  ChartLine,
  Settings,
  Menu,
  X,
  WifiOff,
  LogOut,
} from 'lucide-react';
import { clearSessionToken, clearAllTokens } from '@/core/auth/client';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import { useLowStockBadge } from '@/features/inventory/hooks/useLowStockBadge';
import { decodeSessionRole } from '@/core/auth/client';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group?: string;
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  { label: 'Kasir (POS)',        href: '/kasir',        icon: <ScanBarcode   className="w-[18px] h-[18px]" />, group: 'Operasional', roles: ['kasir'] },
  { label: 'Barang Masuk',       href: '/barang-masuk', icon: <PackagePlus   className="w-[18px] h-[18px]" />, group: 'Operasional', roles: ['admin'] },
  { label: 'Inventaris',         href: '/inventaris',   icon: <Boxes         className="w-[18px] h-[18px]" />, group: 'Operasional', roles: ['admin'] },
  { label: 'Kedaluwarsa & FEFO', href: '/kedaluwarsa',  icon: <CalendarClock className="w-[18px] h-[18px]" />, group: 'Operasional', roles: ['admin'] },
  { label: 'Laporan Laba',       href: '/laporan',      icon: <ChartLine     className="w-[18px] h-[18px]" />, group: 'Analitik',    roles: ['admin', 'owner'] },
  { label: 'Pengaturan',         href: '/pengaturan',   icon: <Settings      className="w-[18px] h-[18px]" />, group: 'Sistem',      roles: ['admin', 'owner'] },
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
  const pathname  = usePathname();
  const router    = useRouter();
  const { count: lowStockCount } = useLowStockBadge();
  const pageTitle = title ?? getPageTitle(pathname);

  const [userRole, setUserRole] = useState<string | null>(null);
  useEffect(() => { setUserRole(decodeSessionRole()); }, []);

  const visibleNavItems = navigationItems.filter(
    item => !item.roles || !userRole || item.roles.includes(userRole)
  );

  const openDrawer  = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  // Close on route change
  useEffect(() => { closeDrawer(); }, [pathname]);

  // Close when viewport expands to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 900) closeDrawer(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);


  const renderNavItems = (onClick?: () => void) => {
    let currentGroup = '';
    let groupIndex   = -1;
    return visibleNavItems.map(item => {
      const isActive       = !!pathname?.startsWith(item.href);
      const showGroupLabel = item.group !== currentGroup;
      if (showGroupLabel) groupIndex++;
      currentGroup = item.group ?? '';

      return (
        <React.Fragment key={item.href}>
          {showGroupLabel && (
            <span className={cn(
              'px-3 mb-1 text-[10px] uppercase tracking-widest font-semibold text-[#8593a6]',
              groupIndex === 0 ? 'mt-1' : 'mt-5',
            )}>
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
                : 'text-[#d3dbe6] hover:bg-[#1b2534] hover:text-white',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={cn('flex-none', isActive ? 'text-white' : 'text-[#8b98ab]')}>
              {item.icon}
            </span>
            <span className="flex-1 min-w-0 truncate">{item.label}</span>
            {item.href === '/inventaris' && lowStockCount > 0 && (
              <span className="flex-none min-w-[20px] px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#fdf0da] text-[#8a5300]">
                {lowStockCount}
              </span>
            )}
          </Link>
        </React.Fragment>
      );
    });
  };

  // ─── Shared sidebar/drawer nav content ─────────────────────────────────────
  function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const [isSignoutOpen, setIsSignoutOpen] = useState(false);
    const signoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (signoutRef.current && !signoutRef.current.contains(e.target as Node)) {
          setIsSignoutOpen(false);
        }
      };
      if (isSignoutOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
      }
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isSignoutOpen]);

    return (
    <>
      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-3 pt-3 pb-4 flex-1 min-h-0 overflow-y-auto" aria-label="Modul">
        {renderNavItems(onLinkClick)}
      </nav>
      {/* User footer */}
      <div className="shrink-0 flex flex-col gap-2 px-4 pb-5 text-xs text-[#8593a6]">
        <div ref={signoutRef} className="relative">
          <div className="flex items-center gap-3 p-2.5 rounded-[10px] bg-[#1b2534]">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-[#12507f] text-white text-xs font-semibold flex-none">
              RA
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[13px] text-[#f2f6fb] font-semibold truncate">Rani Anggraeni</p>
              <p className="m-0 text-[11px] text-[#8593a6]">Admin · 2 cabang</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSignoutOpen(prev => !prev)}
              className="flex-none grid place-items-center w-8 h-8 rounded-[8px] text-[#8593a6] hover:bg-[#2a3648] hover:text-[#e7ecf3] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-[#7fe3c9] focus-visible:outline-offset-2"
              aria-label="Opsi keluar"
              aria-expanded={isSignoutOpen}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {isSignoutOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-[10px] bg-[#1b2534] border border-[#2a3648] overflow-hidden shadow-lg z-10">
              <button
                type="button"
                onClick={() => { clearSessionToken(); router.replace('/masuk'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#d3dbe6] hover:bg-[#2a3648] hover:text-white transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-[#7fe3c9]"
              >
                <LogOut className="w-4 h-4 flex-none text-[#8593a6]" />
                <div className="min-w-0 text-left">
                  <p className="m-0 font-medium">Keluar sesi</p>
                  <p className="m-0 text-[11px] text-[#8593a6]">Perangkat tetap terdaftar</p>
                </div>
              </button>
              <div className="h-px bg-[#2a3648]" />
              <button
                type="button"
                onClick={() => { clearAllTokens(); router.replace('/masuk'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#f3b64a] hover:bg-[#2a3648] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-[#7fe3c9]"
              >
                <LogOut className="w-4 h-4 flex-none" />
                <div className="min-w-0 text-left">
                  <p className="m-0 font-medium">Keluarkan perangkat</p>
                  <p className="m-0 text-[11px] text-[#f3b64a]/70">Hapus semua token, perlu registrasi ulang</p>
                </div>
              </button>
            </div>
          )}
        </div>
        <p className="m-0 px-1">Mode offline siap · 1.240 SKU lokal</p>
      </div>
    </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#182230]">

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="hidden min-[900px]:flex fixed inset-y-0 left-0 w-[248px] flex-col bg-[#101828] text-[#e7ecf3] z-30"
        aria-label="Navigasi modul"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0">
          <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-[#0f6d5f] text-white flex-none">
            <Store className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="font-bold tracking-tight truncate">Warung Nusantara</div>
            <div className="text-xs text-[#97a3b4]">Retail Operations</div>
          </div>
        </div>
        {/* Store info */}
        <div className="mx-4 shrink-0 grid gap-1 p-3 rounded-[10px] bg-[#1b2534] border border-[#2a3648] text-xs text-[#b6c1d0]">
          <span>Cabang aktif</span>
          <strong className="text-[13px] text-[#f2f6fb]">Cabang Kebayoran</strong>
          <span className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full flex-none', isOffline ? 'bg-[#f3b64a]' : 'bg-[#4ec38a]')} />
            {isOffline ? 'Mode offline' : 'Tersinkron · 2 menit lalu'}
          </span>
        </div>
        <NavContent />
      </aside>

      {/* ── Mobile drawer — CSS-controlled, no <dialog> ─────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={cn(
          'min-[900px]:hidden fixed inset-0 z-40 bg-[rgba(15,22,33,0.55)] transition-opacity duration-300',
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />
      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi modul"
        className={cn(
          'min-[900px]:hidden fixed top-0 left-0 z-50 h-dvh w-[min(300px,88vw)]',
          'flex flex-col bg-[#101828] text-[#d3dbe6]',
          'transition-transform duration-300 ease-in-out',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 shrink-0 border-b border-[#1b2534]">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-7 h-7 rounded-[8px] bg-[#0f6d5f] text-white flex-none">
              <Store className="w-4 h-4" />
            </span>
            <span className="font-semibold text-[#f2f6fb] text-sm">Warung Nusantara</span>
          </div>
          <button
            onClick={closeDrawer}
            className="grid place-items-center w-8 h-8 rounded-[8px] bg-[#1b2534] text-[#e7ecf3] cursor-pointer hover:bg-[#2a3648] transition-colors"
            type="button"
            aria-label="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <NavContent onLinkClick={closeDrawer} />
      </div>

      {/* ── Main body ────────────────────────────────────────────────────────── */}
      <div className="ml-0 min-[900px]:ml-[248px] min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#e2e6ec]">
          <div className="flex items-center gap-3 px-4 min-[900px]:px-6 h-[60px]">
            {/* Mobile menu button */}
            <button
              onClick={openDrawer}
              className={cn(
                'min-[900px]:hidden flex items-center gap-2 h-9 px-3 rounded-[10px] shrink-0',
                'border border-[#cbd2dc] bg-white text-inherit text-sm cursor-pointer',
                'focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2',
              )}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isDrawerOpen}
            >
              <Menu className="w-4 h-4 flex-none" />
              <span className="text-sm font-medium">Menu</span>
            </button>
            {/* Page title */}
            <h1 className="flex-1 min-w-0 m-0 text-xl min-[900px]:text-[22px] font-bold tracking-tight leading-tight truncate">
              {pageTitle}
            </h1>
            {/* Right actions */}
            {(isOffline || headerActions) && (
              <div className="flex items-center gap-2 shrink-0">
                {isOffline && (
                  <Badge variant="warning" dot>
                    <WifiOff className="w-4 h-4" />
                    Offline
                  </Badge>
                )}
                {headerActions}
              </div>
            )}
          </div>
        </header>
        {/* Content */}
        <main className="min-w-0 p-4 min-[900px]:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
