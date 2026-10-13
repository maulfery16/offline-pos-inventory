import type { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components';
import { Button, Badge } from '@/shared/components';

export const metadata: Metadata = {
  title: 'Laporan Laba & Shift',
  description: 'Analisis keuntungan dan rekap shift',
};

export default function LaporanPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Laporan Laba & Shift"
        description="Analisis keuntungan dan rekap shift"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Laporan' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="min-h-[44px]">
              Filter Tanggal
            </Button>
            <Button variant="outline" className="min-h-[44px]">
              Export
            </Button>
          </div>
        }
      />

      {/* Profit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Laba Hari Ini</div>
              <div className="text-3xl font-bold text-green-600">
                Rp 2.450.000
              </div>
              <div className="text-xs text-gray-500">
                +12.5% dari kemarin
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Laba Minggu Ini</div>
              <div className="text-3xl font-bold text-green-600">
                Rp 15.280.000
              </div>
              <div className="text-xs text-gray-500">
                +8.3% dari minggu lalu
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Laba Bulan Ini</div>
              <div className="text-3xl font-bold text-green-600">
                Rp 58.900.000
              </div>
              <div className="text-xs text-gray-500">
                +15.2% dari bulan lalu
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Total Transaksi</div>
              <div className="text-3xl font-bold text-gray-900">
                1.248
              </div>
              <div className="text-xs text-gray-500">
                Bulan ini
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Report */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Shift</CardTitle>
          <CardDescription>Rekap kas per shift</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Shift
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Kasir
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Transaksi
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Kas Awal
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Penjualan
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Kas Akhir
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Placeholder Rows */}
                {[
                  { shift: 'Pagi (08:00-14:00)', cashier: 'Ani', txn: 45, start: 500000, sales: 2450000, end: 2950000, status: 'closed' },
                  { shift: 'Siang (14:00-20:00)', cashier: 'Budi', txn: 38, start: 500000, sales: 1980000, end: 2480000, status: 'closed' },
                  { shift: 'Malam (20:00-22:00)', cashier: 'Citra', txn: 15, start: 500000, sales: 850000, end: 1350000, status: 'active' },
                ].map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-gray-50 min-h-[52px]"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {item.shift}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.cashier}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {item.txn}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      Rp {item.start.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      Rp {item.sales.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
                      Rp {item.end.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'active' ? (
                        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-gray-100 text-gray-800 border-gray-300">
                          Selesai
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-200 mt-4">
              {/* TODO: WatermelonDB integration for shift tracking */}
              Data shift dan kas dari WatermelonDB
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
          <CardDescription>Top 10 produk bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { rank: 1, name: 'Produk A', qty: 245, revenue: 6125000 },
              { rank: 2, name: 'Produk B', qty: 198, revenue: 5940000 },
              { rank: 3, name: 'Produk C', qty: 167, revenue: 5010000 },
              { rank: 4, name: 'Produk D', qty: 142, revenue: 4260000 },
              { rank: 5, name: 'Produk E', qty: 128, revenue: 3840000 },
            ].map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {item.rank}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.qty} unit terjual
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Revenue
                  </div>
                </div>
              </div>
            ))}

            <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-200">
              {/* TODO: WatermelonDB integration for COGS and profit calculation */}
              Kalkulasi laba berdasarkan COGS dari WatermelonDB
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
