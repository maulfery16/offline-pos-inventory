'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/utils';

interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  available: number;
  physical: number;
  reorder: number;
  expiring: number;
}

const items: InventoryItem[] = [
  { sku: '8991002101147', name: 'Indomie Goreng 85g', category: 'Makanan instan', available: 48, physical: 48, reorder: 24, expiring: 62 },
  { sku: '8992761123456', name: 'Aqua 600ml', category: 'Minuman', available: 9, physical: 7, reorder: 24, expiring: 118 },
  { sku: '8991234567890', name: 'Susu Ultra 250ml', category: 'Susu & olahan', available: 12, physical: 12, reorder: 18, expiring: 5 },
  { sku: '8998765432109', name: 'Roti Tawar Sari Roti', category: 'Bakery', available: 6, physical: 4, reorder: 10, expiring: 3 },
  { sku: '8991112223334', name: 'Teh Pucuk 350ml', category: 'Minuman', available: 36, physical: 36, reorder: 20, expiring: 96 },
  { sku: '8995000112233', name: 'Kopi Kapal Api 165g', category: 'Minuman', available: 21, physical: 21, reorder: 12, expiring: 210 },
  { sku: '8996000223344', name: 'Yogurt Cimory 200ml', category: 'Susu & olahan', available: 4, physical: 4, reorder: 8, expiring: -2 },
  { sku: '8997000334455', name: 'Sabun Lifebuoy 85g', category: 'Perawatan diri', available: 54, physical: 54, reorder: 20, expiring: 400 },
  { sku: '8998000445566', name: 'Beras Pandan Wangi 5kg', category: 'Sembako', available: 14, physical: 14, reorder: 8, expiring: 320 },
];


type Filter = 'all' | 'low' | 'expiry' | 'variance';

export default function InventarisPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [physicalValues, setPhysicalValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.sku, item.physical]))
  );
  const [adjustDialog, setAdjustDialog] = useState<{ sku: string; name: string; available: number } | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Opname tidak cocok');
  const [adjustNote, setAdjustNote] = useState('');
  const [opnameDone, setOpnameDone] = useState<Set<string>>(new Set(['8991002101147', '8992761123456', '8991234567890', '8998765432109', '8991112223334', '8995000112233']));
  const [showOpnameDialog, setShowOpnameDialog] = useState(false);

  const isLow = (item: InventoryItem) => item.available <= item.reorder;
  const isExpiring = (item: InventoryItem) => item.expiring <= 30;
  const getVariance = (item: InventoryItem) => (physicalValues[item.sku] ?? item.physical) - item.available;

  const matchesFilter = (item: InventoryItem) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.includes(search)) return false;
    if (filter === 'low') return isLow(item);
    if (filter === 'expiry') return isExpiring(item);
    if (filter === 'variance') return getVariance(item) !== 0;
    return true;
  };

  const getStatus = (item: InventoryItem) => {
    if (item.expiring <= 0) return { chip: 'bg-[#fbe8e5] text-[#a52b22]', text: 'Batch kedaluwarsa · diblokir' };
    if (isLow(item)) return { chip: 'bg-[#fdf0da] text-[#8a5300]', text: 'Menipis · di bawah reorder' };
    if (!opnameDone.has(item.sku)) return { chip: 'bg-[#e8eef7] text-[#12507f]', text: 'Perlu opname' };
    return { chip: 'bg-[#e3f4e9] text-[#136b3f]', text: 'Aman' };
  };

  const updatePhysical = (sku: string, value: number) => {
    setPhysicalValues((prev) => ({ ...prev, [sku]: value }));
  };

  const openAdjustDialog = (item: InventoryItem) => {
    setAdjustDialog({ sku: item.sku, name: item.name, available: item.available });
    setAdjustQty(physicalValues[item.sku] ?? item.physical);
  };

  const saveAdjust = () => {
    if (!adjustDialog) return;
    updatePhysical(adjustDialog.sku, adjustQty);
    setOpnameDone((prev) => {
      const next = new Set(prev);
      next.add(adjustDialog.sku);
      return next;
    });
    setAdjustDialog(null);
  };

  const finishOpname = () => {
    setShowOpnameDialog(true);
  };

  const resetOpname = () => {
    setOpnameDone(new Set());
    setPhysicalValues(Object.fromEntries(items.map((item) => [item.sku, item.physical])));
  };

  const filteredItems = items.filter(matchesFilter);
  const lowItems = items.filter(isLow);
  const varianceItems = items.filter((item) => getVariance(item) !== 0);

  const counts = {
    all: items.length,
    low: items.filter(isLow).length,
    expiry: items.filter(isExpiring).length,
    variance: items.filter((item) => getVariance(item) !== 0).length,
  };

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Nilai persediaan (HPP)</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">Rp284.750.000</p>
          <span className="text-xs text-[#5a6675]">1.240 SKU aktif · 8 batch baru minggu ini</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">SKU di bawah reorder point</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{counts.low}</p>
          <span className="text-xs text-[#8a5300]">Perlu pesan ulang dalam 2 hari</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Kedaluwarsa ≤30 hari</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">5 batch</p>
          <span className="text-xs text-[#a52b22]">Nilai HPP berisiko Rp4.180.000</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Selisih opname terakhir</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">−9 unit</p>
          <span className="text-xs text-[#5a6675]">Opname 14 Apr · 4 SKU berselisih</span>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        {/* Main Panel */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Daftar stok cabang</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">{filteredItems.length} SKU ditampilkan</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 lg:p-5 border-b border-[#e2e6ec]">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-[#f7f8fa] rounded-[10px]" role="tablist">
              {[
                { key: 'all' as Filter, label: 'Semua', count: counts.all },
                { key: 'low' as Filter, label: 'Menipis', count: counts.low },
                { key: 'expiry' as Filter, label: 'Akan kedaluwarsa', count: counts.expiry },
                { key: 'variance' as Filter, label: 'Selisih opname', count: counts.variance },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-2 min-h-[38px] px-3 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors',
                    filter === tab.key
                      ? 'bg-white text-[#182230] font-semibold shadow-sm'
                      : 'text-[#5a6675]'
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[11px]',
                    filter === tab.key ? 'bg-[#e2f2ee] text-[#0b564a]' : 'bg-[#e2e6ec] text-[#5a6675]'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 max-w-[340px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a94a3]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau SKU…"
                className="w-full min-h-[42px] pl-9 pr-3 text-[15px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[#f7f8fa] text-xs uppercase tracking-wider text-[#5a6675]">
                  <th className="text-left p-4 lg:px-5">Barang</th>
                  <th className="text-right p-4 lg:px-5">Tersedia</th>
                  <th className="text-right p-4 lg:px-5">Fisik</th>
                  <th className="text-right p-4 lg:px-5">Selisih</th>
                  <th className="text-left p-4 lg:px-5">Status</th>
                  <th className="text-left p-4 lg:px-5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const status = getStatus(item);
                  const physical = physicalValues[item.sku] ?? item.physical;
                  const variance = physical - item.available;

                  return (
                    <tr key={item.sku} className="border-b border-[#e2e6ec] min-h-[52px]">
                      <td className="p-4 lg:px-5">
                        <p className="m-0 text-[13px] font-semibold">{item.name}</p>
                        <p className="m-0 mt-0.5 text-xs text-[#5a6675]">{item.sku} · {item.category} · reorder {item.reorder}</p>
                      </td>
                      <td className="p-4 lg:px-5 text-right text-[13px] tabular-nums">{item.available}</td>
                      <td className="p-4 lg:px-5 text-right">
                        <input
                          type="number"
                          min={0}
                          value={physical}
                          onChange={(e) => updatePhysical(item.sku, Number(e.target.value) || 0)}
                          className="w-[96px] min-h-[38px] px-2 text-[13px] tabular-nums text-right border border-[#cbd2dc] rounded-[6px] focus:outline-none focus:border-[#0f6d5f]"
                          aria-label={`Stok fisik ${item.name}`}
                        />
                      </td>
                      <td className="p-4 lg:px-5 text-right">
                        <span className={cn(
                          'text-[13px] font-semibold tabular-nums',
                          variance < 0 ? 'text-[#a52b22]' : variance > 0 ? 'text-[#136b3f]' : 'text-[#5a6675]'
                        )}>
                          {variance > 0 ? '+' : ''}{variance}
                        </span>
                      </td>
                      <td className="p-4 lg:px-5">
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.chip)}>
                          {status.text}
                        </span>
                      </td>
                      <td className="p-4 lg:px-5">
                        <button
                          type="button"
                          onClick={() => openAdjustDialog(item)}
                          className="min-h-[36px] px-3 text-xs font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
                        >
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <p className="p-6 text-center text-sm text-[#5a6675]">Tidak ada SKU yang cocok dengan filter dan pencarian ini.</p>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="grid gap-4 content-start">
          {/* Low Stock Alerts */}
          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Peringatan stok menipis</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#fdf0da] text-[#8a5300]">{lowItems.length} SKU</span>
            </div>
            <div className="p-4 lg:p-5">
              {lowItems.length === 0 ? (
                <p className="text-sm text-[#5a6675]">Semua SKU berada di atas titik pemesanan ulang.</p>
              ) : (
                <ul className="grid gap-2 list-none m-0 p-0">
                  {lowItems.map((item) => {
                    const suggested = Math.max(item.reorder * 2 - item.available, item.reorder);
                    return (
                      <li key={item.sku} className="flex items-center justify-between gap-2 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                        <div>
                          <strong className="text-[13px]">{item.name}</strong>
                          <p className="m-0 text-xs text-[#5a6675]">Sisa {item.available} dari reorder {item.reorder}</p>
                        </div>
                        <span className="text-[13px] font-semibold text-[#0b564a] tabular-nums">Pesan {suggested} pcs</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Opname Session */}
          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Sesi stok opname</h2>
            </div>
            <div className="p-4 lg:p-5 grid gap-3">
              <p className="m-0 text-[13px] text-[#5a6675]">
                Mode opname memakai kamera ponsel untuk memindai dan menyesuaikan stok fisik di rak. Selisih ditandai sebelum disimpan.
              </p>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-[#5a6675]">SKU sudah dihitung</span>
                <strong className="text-[#182230] tabular-nums">{opnameDone.size} dari {items.length}</strong>
              </div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-[#5a6675]">Selisih terdeteksi</span>
                <strong className="text-[#182230] tabular-nums">{varianceItems.length} SKU</strong>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={finishOpname}
                  className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer"
                >
                  Simpan hasil opname
                </button>
                <button
                  type="button"
                  onClick={resetOpname}
                  className="min-h-[42px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
                >
                  Reset penghitungan
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Adjust Dialog */}
      {adjustDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div className="w-[min(520px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-4">
              <h2 className="m-0 text-lg font-bold">Sesuaikan stok fisik</h2>
              <p className="m-0 text-[13px] text-[#5a6675]">{adjustDialog.name} · tersedia {adjustDialog.available} unit. Masukkan jumlah fisik hasil hitung.</p>
              <div className="grid gap-1.5">
                <label htmlFor="adjust-qty" className="text-xs font-medium text-[#5a6675]">Jumlah fisik hasil hitung</label>
                <input
                  id="adjust-qty"
                  type="number"
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
                  className="min-h-[44px] px-3 text-[15px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="adjust-reason" className="text-xs font-medium text-[#5a6675]">Alasan penyesuaian</label>
                <select
                  id="adjust-reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f]"
                >
                  <option>Opname tidak cocok</option>
                  <option>Barang rusak</option>
                  <option>Salah input kasir</option>
                  <option>Retur supplier</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="adjust-note" className="text-xs font-medium text-[#5a6675]">Catatan (opsional)</label>
                <textarea
                  id="adjust-note"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Misal: 4 sachet bocor ditemukan di rak gantung."
                  className="min-h-[84px] px-3 py-2 text-[15px] border border-[#cbd2dc] rounded-[10px] resize-y focus:outline-none focus:border-[#0f6d5f]"
                />
              </div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-[#5a6675]">Selisih setelah penyesuaian</span>
                <strong className={cn(
                  'tabular-nums',
                  adjustQty - adjustDialog.available < 0 ? 'text-[#a52b22]' : adjustQty - adjustDialog.available > 0 ? 'text-[#136b3f]' : 'text-[#182230]'
                )}>
                  {adjustQty - adjustDialog.available}
                </strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => setAdjustDialog(null)}
                className="min-h-[42px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveAdjust}
                className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer"
              >
                Simpan penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opname Result Dialog */}
      {showOpnameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div className="w-[min(520px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <h2 className="m-0 text-lg font-bold">Hasil opname tersimpan</h2>
              <ul className="grid gap-2 list-none m-0 p-0">
                {varianceItems.length > 0 ? varianceItems.map((item) => {
                  const variance = getVariance(item);
                  return (
                    <li key={item.sku} className="flex items-center justify-between gap-2 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                      <strong className="text-[13px]">{item.name}</strong>
                      <span className="text-xs text-[#5a6675]">
                        {variance > 0 ? '+' : ''}{variance} unit dari {item.available}
                      </span>
                    </li>
                  );
                }) : (
                  <li className="flex items-center justify-between gap-2 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                    <strong className="text-[13px]">Tidak ada selisih</strong>
                    <span className="text-xs text-[#5a6675]">Semua SKU cocok dengan catatan sistem</span>
                  </li>
                )}
              </ul>
              <p className="text-xs text-[#5a6675]">Stok cloud diperbarui langsung karena perangkat sedang online. Bila offline, perubahan masuk antrean sinkronisasi.</p>
            </div>
            <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => setShowOpnameDialog(false)}
                className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
