import type { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components';
import { Button, Badge, Input } from '@/shared/components';

export const metadata: Metadata = {
  title: 'Inventaris & Stok Opname',
  description: 'Kelola stok dan lakukan stok opname',
};

export default function InventarisPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Inventaris & Stok Opname"
        description="Kelola stok dan lakukan stok opname"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inventaris' },
        ]}
        actions={
          <Button variant="outline" className="min-h-[44px]">
            Mulai Stok Opname
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900">248</div>
              <div className="text-sm text-gray-600">Total Produk</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-bold text-yellow-600">18</div>
                <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Low
                </Badge>
              </div>
              <div className="text-sm text-gray-600">Stok Rendah</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-bold text-red-600">5</div>
                <Badge variant="destructive" className="text-xs">
                  Empty
                </Badge>
              </div>
              <div className="text-sm text-gray-600">Stok Habis</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-600">Kategori</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Daftar Inventaris</CardTitle>
            <Input
              type="search"
              placeholder="Cari produk..."
              className="md:w-80"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Produk
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Stok
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Harga
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Placeholder Rows */}
                {[
                  { sku: 'SKU-001', name: 'Produk A', stock: 45, status: 'success', price: 25000 },
                  { sku: 'SKU-002', name: 'Produk B', stock: 8, status: 'warning', price: 35000 },
                  { sku: 'SKU-003', name: 'Produk C', stock: 0, status: 'danger', price: 15000 },
                  { sku: 'SKU-004', name: 'Produk D', stock: 120, status: 'success', price: 45000 },
                  { sku: 'SKU-005', name: 'Produk E', stock: 5, status: 'warning', price: 55000 },
                ].map((item) => (
                  <tr
                    key={item.sku}
                    className="border-b border-gray-100 hover:bg-gray-50 min-h-[52px]"
                  >
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {item.stock}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'success' && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                          In Stock
                        </Badge>
                      )}
                      {item.status === 'warning' && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Low Stock
                        </Badge>
                      )}
                      {item.status === 'danger' && (
                        <Badge variant="destructive">
                          Out of Stock
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-200 mt-4">
              {/* TODO: WatermelonDB integration for real-time stock */}
              Data stok real-time dari WatermelonDB
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
