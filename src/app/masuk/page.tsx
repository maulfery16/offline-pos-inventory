import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/shared/components';

export const metadata: Metadata = {
  title: 'Masuk — Pilih Peran',
  description: 'Pilih peran untuk melanjutkan ke sistem POS',
};

const roles = [
  {
    title: 'Kasir',
    icon: '🛒',
    description: 'Proses transaksi penjualan dengan cepat',
    href: '/kasir',
  },
  {
    title: 'Manajer Toko',
    icon: '📋',
    description: 'Kelola inventaris dan laporan stok',
    href: '/inventaris',
  },
  {
    title: 'Pemilik Usaha',
    icon: '📊',
    description: 'Analisis multi-lokasi dan laporan laba',
    href: '/laporan',
  },
];

export default function MasukPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* App Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">POS Offline</h1>
          <p className="text-lg text-gray-600">
            Sistem Point of Sale dan Manajemen Inventaris
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Link key={role.href} href={role.href} className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center space-y-4">
                  <div className="text-6xl mx-auto">{role.icon}</div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full min-h-[44px]">
                    Pilih Peran
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Offline Note */}
        <div className="text-center space-y-2">
          <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <span className="mr-1">⚡</span>
            Dapat digunakan offline
          </Badge>
          <p className="text-sm text-gray-500">
            Semua transaksi disimpan secara lokal dan akan disinkronkan saat online
          </p>
        </div>
      </div>
    </div>
  );
}
