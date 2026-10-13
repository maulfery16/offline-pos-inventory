import type { Metadata } from 'next';
import { PageHeader } from '@/shared/layouts';

export const metadata: Metadata = {
  title: 'Point of Sale',
  description: 'Kelola transaksi penjualan dengan cepat dan mudah',
};

export default function POSPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Point of Sale"
        description="Kelola transaksi penjualan dengan cepat dan mudah"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'POS' },
        ]}
      />
      
      <div className="mt-6">
        <p className="text-gray-600">POS Interface akan diimplementasikan di sini.</p>
      </div>
    </div>
  );
}
