'use client';

import { useState } from 'react';
import { ShieldAlert, ArrowDownNarrowWide, Lock, Bell, Calculator, History } from 'lucide-react';
import { cn } from '@/shared/utils';

interface Batch {
  id: string;
  sku: string;
  name: string;
  batch: string;
  expiry: string;
  branch: string;
  qty: number;
  cost: number;
  blocked: boolean;
  action: string | null;
}

const TODAY = new Date(); // TODO: replace with WatermelonDB server-synced timestamp for testability

// TODO: replace with WatermelonDB query — this is prototype mock data
const batches: Batch[] = [
  { id: 'b1', sku: '8991234567890', name: 'Susu Ultra 250ml', batch: 'B1174', expiry: '2026-04-23', branch: 'Kebayoran', qty: 12, cost: 5900, blocked: false, action: null },
  { id: 'b2', sku: '8998765432109', name: 'Roti Tawar Sari Roti', batch: 'B1180', expiry: '2026-04-21', branch: 'Kebayoran', qty: 6, cost: 14000, blocked: false, action: null },
  { id: 'b3', sku: '8996000223344', name: 'Yogurt Cimory 200ml', batch: 'B1160', expiry: '2026-04-16', branch: 'Kebayoran', qty: 4, cost: 7400, blocked: true, action: 'blocked' },
  { id: 'b4', sku: '8991234567890', name: 'Susu Ultra 250ml', batch: 'B1179', expiry: '2026-04-29', branch: 'Bintaro', qty: 24, cost: 5900, blocked: false, action: null },
  { id: 'b5', sku: '8991002101147', name: 'Indomie Goreng 85g', batch: 'B2321', expiry: '2026-05-12', branch: 'Kebayoran', qty: 48, cost: 2900, blocked: false, action: null },
  { id: 'b6', sku: '8997000334455', name: 'Yakult Original 65ml', batch: 'B1181', expiry: '2026-05-01', branch: 'Bintaro', qty: 30, cost: 2100, blocked: false, action: null },
  { id: 'b7', sku: '8996000223344', name: 'Keju Cheddar 170g', batch: 'B1170', expiry: '2026-05-18', branch: 'Kebayoran', qty: 9, cost: 23500, blocked: false, action: 'return' },
  { id: 'b8', sku: '8995000112233', name: 'Kopi Kapal Api 165g', batch: 'B2280', expiry: '2026-11-14', branch: 'Kebayoran', qty: 21, cost: 9800, blocked: false, action: null },
  { id: 'b9', sku: '8991112223334', name: 'Teh Pucuk 350ml', batch: 'B2305', expiry: '2026-07-23', branch: 'Bintaro', qty: 36, cost: 3400, blocked: false, action: null },
  { id: 'b10', sku: '8997000334455', name: 'Minyak Goreng 2L', batch: 'B2290', expiry: '2026-12-02', branch: 'Kebayoran', qty: 18, cost: 32000, blocked: false, action: null },
];

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

const daysLeft = (iso: string) => Math.round((new Date(iso + 'T00:00:00').getTime() - TODAY.getTime()) / 86400000);

type Range = '7' | '14' | '30' | 'all';
type Sort = 'fefo' | 'latest' | 'value';

export default function KedaluwarsaPage() {
  const [range, setRange] = useState<Range>('30');
  const [sort, setSort] = useState<Sort>('fefo');
  const [blockedBatches, setBlockedBatches] = useState<Set<string>>(new Set(['b3']));
  const [returnRequested, setReturnRequested] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([
    'Peringatan 7 hari dikirim ke Stok: 2 batch Yogurt dan Roti Tawar.',
    'Batch B2321 (Indomie Goreng) masuk dengan kedaluwarsa 12 Mei.',
    'Cimory 200ml diblokir otomatis setelah melewati tanggal kedaluwarsa.',
  ]);

  const bucketDefs = [
    { key: 'expired', label: 'Sudah kedaluwarsa', tone: 'danger', test: (d: number) => d <= 0 },
    { key: '7', label: '≤7 hari', tone: 'danger', test: (d: number) => d > 0 && d <= 7 },
    { key: '14', label: '8–14 hari', tone: 'warn', test: (d: number) => d > 7 && d <= 14 },
    { key: '30', label: '15–30 hari', tone: 'warn', test: (d: number) => d > 14 && d <= 30 },
    { key: 'later', label: '>30 hari', tone: 'calm', test: (d: number) => d > 30 },
  ];

  const inRange = (batch: Batch) => {
    if (range === 'all') return true;
    const days = daysLeft(batch.expiry);
    return days <= Number(range);
  };

  const getStatus = (batch: Batch) => {
    const days = daysLeft(batch.expiry);
    if (blockedBatches.has(batch.id)) return { chip: 'bg-[#101828] text-white', text: 'Diblokir' };
    if (days <= 0) return { chip: 'bg-[#fbe8e5] text-[#a52b22]', text: 'Kritis' };
    if (days <= 7) return { chip: 'bg-[#fbe8e5] text-[#a52b22]', text: 'Prioritas' };
    if (days <= 30) return { chip: 'bg-[#fdf0da] text-[#8a5300]', text: 'Perhatian' };
    return { chip: 'bg-[#e3f4e9] text-[#136b3f]', text: 'Normal' };
  };

  const sortedBatches = batches.filter(inRange).sort((a, b) => {
    if (sort === 'latest') return daysLeft(b.expiry) - daysLeft(a.expiry);
    if (sort === 'value') return (b.qty * b.cost) - (a.qty * a.cost);
    return daysLeft(a.expiry) - daysLeft(b.expiry);
  });

  const handleBlock = (id: string) => {
    setBlockedBatches((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const batch = batches.find((b) => b.id === id);
    if (batch) {
      setLog((prev) => [`${batch.name} batch ${batch.batch} diblokir. Pemindaian di kasir ditolak.`, ...prev.slice(0, 3)]);
    }
  };

  const handleUnblock = (id: string) => {
    setBlockedBatches((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const batch = batches.find((b) => b.id === id);
    if (batch) {
      setLog((prev) => [`${batch.name} batch ${batch.batch} dibuka kembali untuk kasir.`, ...prev.slice(0, 3)]);
    }
  };

  const handleReturn = (id: string) => {
    setReturnRequested((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const batch = batches.find((b) => b.id === id);
    if (batch) {
      setLog((prev) => [`Retur supplier diajukan untuk ${batch.name} batch ${batch.batch}.`, ...prev.slice(0, 3)]);
    }
  };

  const chartData = [
    { label: 'Kedaluwarsa', tone: 'danger', count: batches.filter((b) => daysLeft(b.expiry) <= 0).length },
    { label: '≤7 hari', tone: 'danger', count: batches.filter((b) => { const d = daysLeft(b.expiry); return d > 0 && d <= 7; }).length },
    { label: '8–14 hari', tone: 'warn', count: batches.filter((b) => { const d = daysLeft(b.expiry); return d > 7 && d <= 14; }).length },
    { label: '15–30 hari', tone: 'warn', count: batches.filter((b) => { const d = daysLeft(b.expiry); return d > 14 && d <= 30; }).length },
    { label: '>30 hari', tone: 'calm', count: batches.filter((b) => daysLeft(b.expiry) > 30).length },
  ];
  const maxCount = Math.max(1, ...chartData.map((d) => d.count));

  const blockedList = batches.filter((b) => blockedBatches.has(b.id));

  return (
    <div className="grid gap-6">
      {/* Bucket Cards + Notice */}
      <section className="grid gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {bucketDefs.map((bucket) => {
            const rows = batches.filter((b) => bucket.test(daysLeft(b.expiry)));
            const value = rows.reduce((sum, b) => sum + b.qty * b.cost, 0);
            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => setRange(bucket.key === 'expired' || bucket.key === '7' ? '7' : bucket.key === '14' ? '14' : bucket.key === '30' ? '30' : 'all')}
                className={cn(
                  'grid gap-1.5 p-4 text-left border rounded-[14px] bg-white cursor-pointer transition-all',
                  (range === '7' && (bucket.key === 'expired' || bucket.key === '7')) ||
                  (range === '14' && bucket.key === '14') ||
                  (range === '30' && bucket.key === '30') ||
                  (range === 'all' && bucket.key === 'later')
                    ? 'border-[#0f6d5f] shadow-[0_0_0_2px_#e2f2ee]'
                    : 'border-[#e2e6ec]'
                )}
              >
                <span className="flex items-center justify-between text-xs text-[#5a6675]">
                  <span>{bucket.label}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    bucket.tone === 'danger' ? 'bg-[#fbe8e5] text-[#a52b22]' :
                    bucket.tone === 'warn' ? 'bg-[#fdf0da] text-[#8a5300]' :
                    'bg-[#e3f4e9] text-[#136b3f]'
                  )}>
                    {rows.length} batch
                  </span>
                </span>
                <span className="text-2xl font-bold tabular-nums">{rupiah(value)}</span>
                <span className={cn('text-xs', bucket.tone === 'danger' ? 'text-[#a52b22]' : 'text-[#5a6675]')}>
                  {rows.reduce((sum, b) => sum + b.qty, 0)} unit pada {rows.length} batch
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 p-3 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
          <ShieldAlert className="w-4 h-4 flex-none" />
          <span>Kasir otomatis menolak pemindaian bila seluruh batch SKU sudah kedaluwarsa atau diblokir. Batch dengan kedaluwarsa terdekat selalu diambil lebih dulu.</span>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(280px,330px)] gap-6 items-start">
        <div className="grid gap-6">
          {/* Chart */}
          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Sebaran batch per rentang kedaluwarsa</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e3f4e9] text-[#136b3f]">{batches.length} batch terdaftar</span>
            </div>
            <div className="p-4 lg:p-5">
              <div
                className="grid grid-cols-5 gap-3 items-end h-[200px] p-3 rounded-[10px] bg-[#f7f8fa]"
                role="img"
                aria-label={`Diagram batang sebaran batch per rentang kedaluwarsa. ${chartData.map((d) => `${d.label} ${d.count} batch`).join(', ')}.`}
              >
                {chartData.map((d, i) => (
                  <div key={i} className="grid items-end justify-items-center gap-2 h-full">
                    <span className="text-xs font-semibold tabular-nums">{d.count}</span>
                    <span
                      className={cn(
                        'w-full max-w-[64px] rounded-t-[6px]',
                        d.tone === 'danger' ? 'bg-[#c25043]' : d.tone === 'warn' ? 'bg-[#d99b2b]' : 'bg-[#12507f]'
                      )}
                      style={{ height: `${Math.max(6, Math.round((d.count / maxCount) * 130))}px` }}
                    />
                    <span className="text-xs text-[#5a6675] text-center">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Table */}
          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Batch menurut urutan FEFO</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">{sortedBatches.length} batch</span>
            </div>
            <div className="p-4 lg:p-5 grid gap-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-wrap gap-1 p-1 bg-[#f7f8fa] rounded-[10px]" role="group">
                  {[
                    { key: '7' as Range, label: '≤7 hari' },
                    { key: '14' as Range, label: '≤14 hari' },
                    { key: '30' as Range, label: '≤30 hari' },
                    { key: 'all' as Range, label: 'Semua batch' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRange(r.key)}
                      aria-pressed={range === r.key}
                      className={cn(
                        'min-h-[36px] px-3 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors',
                        range === r.key ? 'bg-white text-[#182230] font-semibold shadow-sm' : 'text-[#5a6675]'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[13px] text-[#5a6675]">
                  Urutkan
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="min-h-[40px] px-2.5 text-[13px] border border-[#cbd2dc] rounded-[10px] bg-white focus:outline-none"
                  >
                    <option value="fefo">FEFO (terdekat dulu)</option>
                    <option value="latest">Kedaluwarsa terbaru</option>
                    <option value="value">Nilai HPP terbesar</option>
                  </select>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[660px] text-[13px]">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-[#5a6675] bg-[#f7f8fa]">
                      <th scope="col" className="text-left p-2.5 w-[21%]">Barang</th>
                      <th scope="col" className="text-left p-2.5 w-[9%]">No. batch</th>
                      <th scope="col" className="text-left p-2.5 w-[13%]">Kedaluwarsa</th>
                      <th scope="col" className="text-right p-2.5 w-[10%]">Sisa hari</th>
                      <th scope="col" className="text-left p-2.5 w-[11%]">Cabang</th>
                      <th scope="col" className="text-right p-2.5 w-[7%]">Stok batch</th>
                      <th scope="col" className="text-right p-2.5 w-[10%]">Nilai HPP</th>
                      <th scope="col" className="text-left p-2.5 w-[9%]">Status</th>
                      <th scope="col" className="text-left p-2.5 w-[10%]">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBatches.map((batch) => {
                      const days = daysLeft(batch.expiry);
                      const status = getStatus(batch);
                      const isBlocked = blockedBatches.has(batch.id);
                      const isReturnRequested = returnRequested.has(batch.id);

                      return (
                        <tr key={batch.id} className="border-b border-[#e2e6ec]">
                          <td className="p-2.5">
                            <span className="font-semibold">{batch.name}</span>
                            <span className="block text-xs text-[#5a6675] font-mono">{batch.sku}</span>
                          </td>
                          <td className="p-2.5">{batch.batch}</td>
                          <td className="p-2.5">
                            {new Date(batch.expiry + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className={cn('p-2.5 text-right tabular-nums', days <= 7 ? 'text-[#a52b22] font-semibold' : '')}>
                            {days <= 0 ? `Lewat ${Math.abs(days)} hari` : `${days} hari`}
                          </td>
                          <td className="p-2.5">{batch.branch}</td>
                          <td className="p-2.5 text-right tabular-nums">{batch.qty}</td>
                          <td className="p-2.5 text-right tabular-nums">{rupiah(batch.qty * batch.cost)}</td>
                          <td className="p-2.5">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.chip)}>
                              {status.text}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => handleReturn(batch.id)}
                                disabled={isReturnRequested}
                                className="min-h-[36px] px-2 text-xs font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isReturnRequested ? 'Retur diajukan' : 'Retur'}
                              </button>
                              <button
                                type="button"
                                onClick={() => isBlocked ? handleUnblock(batch.id) : handleBlock(batch.id)}
                                className={cn(
                                  'min-h-[36px] px-2 text-xs font-semibold rounded-[10px] cursor-pointer',
                                  isBlocked
                                    ? 'bg-white border border-[#cbd2dc] hover:border-[#0f6d5f]'
                                    : 'bg-white border border-[#e0aca6] text-[#a52b22] hover:bg-[#fbe8e5]'
                                )}
                              >
                                {isBlocked ? 'Buka blokir' : 'Blokir'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {sortedBatches.length === 0 && (
                <p className="p-6 text-center text-sm text-[#5a6675]">Tidak ada batch pada rentang ini. Coba perluas rentang kedaluwarsa.</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="grid gap-4 content-start">
          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Aturan FEFO aktif</h2>
            </div>
            <div className="p-4 lg:p-5">
              <ul className="grid gap-2 list-none m-0 p-0">
                {[
                  { icon: <ArrowDownNarrowWide className="w-4 h-4" />, text: 'Batch dengan tanggal kedaluwarsa paling dekat dipotong lebih dulu saat penjualan.' },
                  { icon: <Lock className="w-4 h-4" />, text: 'Batch melewati tanggal kedaluwarsa otomatis diblokir dari kasir.' },
                  { icon: <Bell className="w-4 h-4" />, text: 'Peringatan dikirim pada 7, 14 dan 30 hari sebelum kedaluwarsa.' },
                  { icon: <Calculator className="w-4 h-4" />, text: 'Laba kotor dihitung dari HPP batch yang benar-benar terjual.' },
                ].map((rule, i) => (
                  <li key={i} className="flex gap-2 p-3 rounded-[10px] bg-[#f7f8fa] text-xs text-[#5a6675]">
                    <span className="flex-none">{rule.icon}</span>
                    <span>{rule.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Diblokir dari kasir</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#101828] text-white">{blockedList.length} SKU</span>
            </div>
            <div className="p-4 lg:p-5">
              {blockedList.length === 0 ? (
                <p className="text-sm text-[#5a6675]">Tidak ada SKU yang diblokir saat ini.</p>
              ) : (
                <ul className="grid gap-2 list-none m-0 p-0">
                  {blockedList.map((batch) => (
                    <li key={batch.id} className="flex items-center justify-between gap-2 p-3 border border-[#e2e6ec] rounded-[10px]">
                      <div>
                        <strong className="text-[13px]">{batch.name}</strong>
                        <p className="m-0 text-xs text-[#5a6675]">{batch.batch} · {batch.qty} unit di kasir ditolak</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnblock(batch.id)}
                        className="min-h-[36px] px-2 text-xs font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
                      >
                        Buka
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Peringatan terbaru</h2>
            </div>
            <div className="p-4 lg:p-5">
              <ul className="grid gap-2 list-none m-0 p-0">
                {log.map((entry, i) => (
                  <li key={i} className="flex gap-2 p-3 rounded-[10px] bg-[#f7f8fa] text-xs text-[#5a6675]">
                    <History className="w-4 h-4 flex-none" />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
