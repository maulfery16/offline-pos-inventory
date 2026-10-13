import type { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components';
import { Button, Input, Badge } from '@/shared/components';

export const metadata: Metadata = {
  title: 'Barang Masuk & Harga',
  description: 'Terima barang dan atur harga jual',
};

export default function BarangMasukPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Barang Masuk & Harga"
        description="Terima barang dan atur harga jual"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Barang Masuk' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receiving Form */}
        <Card>
          <CardHeader>
            <CardTitle>Form Penerimaan Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supplier */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Supplier
              </label>
              <Input
                type="text"
                placeholder="Pilih atau tambah supplier..."
                className="w-full"
              />
            </div>

            {/* Product */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Produk
              </label>
              <Input
                type="text"
                placeholder="Cari atau scan barcode produk..."
                className="w-full"
              />
            </div>

            {/* Quantity and Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Jumlah
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Harga Beli
                </label>
                <Input
                  type="number"
                  placeholder="Rp 0"
                  className="w-full"
                />
              </div>
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Harga Jual
              </label>
              <Input
                type="number"
                placeholder="Rp 0"
                className="w-full"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tanggal Kedaluwarsa
              </label>
              <Input
                type="date"
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              className="w-full min-h-[44px]"
            >
              Simpan Penerimaan
            </Button>

            <div className="text-xs text-gray-500">
              {/* TODO: WatermelonDB integration for batch tracking */}
              Data akan disimpan dengan batch tracking untuk FEFO
            </div>
          </CardContent>
        </Card>

        {/* Recent Inbound Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Penerimaan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Placeholder Rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Produk Sample {i}
                    </div>
                    <div className="text-sm text-gray-500">
                      Supplier {i} • {i * 10} unit
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date().toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      Rp {(i * 150000).toLocaleString('id-ID')}
                    </div>
                    <Badge variant="default" className="text-xs">
                      Selesai
                    </Badge>
                  </div>
                </div>
              ))}

              <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-200">
                {/* TODO: WatermelonDB integration for inbound history */}
                Riwayat penerimaan akan dimuat dari database
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
