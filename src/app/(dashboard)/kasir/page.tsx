import type { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components';
import { Button, Input } from '@/shared/components';

export const metadata: Metadata = {
  title: 'Kasir — POS',
  description: 'Point of Sale untuk transaksi penjualan',
};

export default function KasirPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Kasir"
        description="Proses transaksi penjualan dengan cepat"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Kasir' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Browser - Left Side (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <Input
                type="search"
                placeholder="Cari produk atau scan barcode..."
                className="w-full"
              />

              {/* Product Grid - Placeholder */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <button
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left min-h-[120px] flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        Produk {i}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        SKU-000{i}
                      </div>
                    </div>
                    <div className="text-primary font-semibold mt-2">
                      Rp {(i * 15000).toLocaleString('id-ID')}
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-500 text-center py-4">
                {/* TODO: WatermelonDB integration for products */}
                Data produk akan dimuat dari WatermelonDB
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart / Order Summary - Right Side */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Keranjang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items - Placeholder */}
              <div className="space-y-3 min-h-[200px]">
                <div className="text-sm text-gray-500 text-center py-8">
                  Keranjang kosong
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rp 0</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak (10%)</span>
                  <span className="font-medium">Rp 0</span>
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-primary">Rp 0</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="primary"
                className="w-full min-h-[44px]"
              >
                Checkout
              </Button>

              <div className="text-xs text-gray-500 text-center">
                {/* TODO: WatermelonDB integration for transactions */}
                Transaksi disimpan lokal dan sync otomatis
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
