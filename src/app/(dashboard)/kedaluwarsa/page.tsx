import type { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components';
import { Badge } from '@/shared/components';

export const metadata: Metadata = {
  title: 'Kedaluwarsa & FEFO',
  description: 'Kelola produk berdasarkan FEFO (First Expired First Out)',
};

export default function KedaluwarsaPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Kedaluwarsa & FEFO"
        description="Kelola produk berdasarkan FEFO (First Expired First Out)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Kedaluwarsa' },
        ]}
      />

      {/* Expiry Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Kadaluwarsa 7 Hari</CardTitle>
            <CardDescription>Prioritas tinggi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Produk A', batch: 'BTH-001', qty: 12, days: 3 },
                { name: 'Produk B', batch: 'BTH-002', qty: 8, days: 5 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Batch: {item.batch}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.qty} unit
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {item.days} hari
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Kadaluwarsa 14 Hari</CardTitle>
            <CardDescription>Perhatian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Produk C', batch: 'BTH-003', qty: 20, days: 10 },
                { name: 'Produk D', batch: 'BTH-004', qty: 15, days: 12 },
                { name: 'Produk E', batch: 'BTH-005', qty: 25, days: 14 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 border border-yellow-200 rounded-lg bg-yellow-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Batch: {item.batch}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.qty} unit
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                      {item.days} hari
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Kadaluwarsa 30 Hari</CardTitle>
            <CardDescription>Monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Produk F', batch: 'BTH-006', qty: 50, days: 22 },
                { name: 'Produk G', batch: 'BTH-007', qty: 35, days: 28 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 border border-blue-200 rounded-lg bg-blue-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Batch: {item.batch}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.qty} unit
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                      {item.days} hari
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FEFO Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Antrian FEFO (First Expired First Out)</CardTitle>
          <CardDescription>
            Prioritas pengambilan berdasarkan tanggal kedaluwarsa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Prioritas
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Produk
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Batch
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Qty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Kadaluwarsa
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Placeholder Rows */}
                {[
                  { priority: 1, name: 'Produk A', batch: 'BTH-001', qty: 12, expiry: '3 hari', status: 'danger' },
                  { priority: 2, name: 'Produk B', batch: 'BTH-002', qty: 8, expiry: '5 hari', status: 'danger' },
                  { priority: 3, name: 'Produk C', batch: 'BTH-003', qty: 20, expiry: '10 hari', status: 'warning' },
                  { priority: 4, name: 'Produk D', batch: 'BTH-004', qty: 15, expiry: '12 hari', status: 'warning' },
                  { priority: 5, name: 'Produk E', batch: 'BTH-005', qty: 25, expiry: '14 hari', status: 'warning' },
                  { priority: 6, name: 'Produk F', batch: 'BTH-006', qty: 50, expiry: '22 hari', status: 'info' },
                ].map((item) => (
                  <tr
                    key={item.batch}
                    className="border-b border-gray-100 hover:bg-gray-50 min-h-[52px]"
                  >
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      #{item.priority}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.batch}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.expiry}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'danger' && (
                        <Badge variant="destructive">
                          Segera
                        </Badge>
                      )}
                      {item.status === 'warning' && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Perhatian
                        </Badge>
                      )}
                      {item.status === 'info' && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                          Monitor
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-200 mt-4">
              {/* TODO: WatermelonDB integration for batch expiry tracking */}
              Sistem FEFO otomatis dari batch tracking WatermelonDB
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
