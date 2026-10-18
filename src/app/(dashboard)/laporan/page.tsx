'use client';

import { useState, useMemo, useEffect } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { getAuthHeaders } from '@/core/auth/client';

type Period = 'today' | 'week' | 'month';

interface DayData {
  label: string;
  sales: number;
  profit: number;
}

interface BranchData {
  name: string;
  profit: number;
  sales: number;
}

interface ProductData {
  sku: string;
  name: string;
  qty: number;
  sales: number;
  cogs: number;
}

// TODO: replace with WatermelonDB query — this is prototype mock data
const periodsData: Record<Period, { label: string; trx: number; days: DayData[]; branches: BranchData[]; products: ProductData[] }> = {
  today: {
    label: 'Hari ini',
    trx: 62,
    days: [
      { label: '08–10', sales: 1750000, profit: 385000 },
      { label: '10–12', sales: 2140000, profit: 470000 },
      { label: '12–14', sales: 2680000, profit: 596000 },
      { label: '14–16', sales: 1520000, profit: 329000 },
    ],
    branches: [
      { name: 'Kebayoran', profit: 1240000, sales: 5480000 },
      { name: 'Bintaro', profit: 540000, sales: 2610000 },
    ],
    products: [
      { sku: '8991002101147', name: 'Indomie Goreng 85g', qty: 48, sales: 168000, cogs: 139200 },
      { sku: '8991112223334', name: 'Teh Pucuk 350ml', qty: 30, sales: 135000, cogs: 102000 },
      { sku: '8991234567890', name: 'Susu Ultra 250ml', qty: 14, sales: 105000, cogs: 82600 },
      { sku: '8995000112233', name: 'Kopi Kapal Api 165g', qty: 8, sales: 100000, cogs: 78400 },
      { sku: '8992761123456', name: 'Aqua 600ml', qty: 22, sales: 88000, cogs: 68200 },
    ],
  },
  week: {
    label: '7 hari',
    trx: 428,
    days: [
      { label: 'Sen', sales: 7250000, profit: 1610000 },
      { label: 'Sel', sales: 6890000, profit: 1502000 },
      { label: 'Rab', sales: 8120000, profit: 1790000 },
      { label: 'Kam', sales: 7540000, profit: 1655000 },
      { label: 'Jum', sales: 9380000, profit: 2088000 },
      { label: 'Sab', sales: 11240000, profit: 2521000 },
      { label: 'Min', sales: 8470000, profit: 1886000 },
    ],
    branches: [
      { name: 'Kebayoran', profit: 8120000, sales: 35400000 },
      { name: 'Bintaro', profit: 4933000, sales: 23460000 },
    ],
    products: [
      { sku: '8991002101147', name: 'Indomie Goreng 85g', qty: 312, sales: 1092000, cogs: 904800 },
      { sku: '8991112223334', name: 'Teh Pucuk 350ml', qty: 208, sales: 936000, cogs: 707200 },
      { sku: '8991234567890', name: 'Susu Ultra 250ml', qty: 96, sales: 720000, cogs: 566400 },
      { sku: '8995000112233', name: 'Kopi Kapal Api 165g', qty: 54, sales: 675000, cogs: 529200 },
      { sku: '8992761123456', name: 'Aqua 600ml', qty: 164, sales: 656000, cogs: 508400 },
    ],
  },
  month: {
    label: '30 hari',
    trx: 1842,
    days: [
      { label: 'Pek 1', sales: 46800000, profit: 10360000 },
      { label: 'Pek 2', sales: 51200000, profit: 11480000 },
      { label: 'Pek 3', sales: 49650000, profit: 10920000 },
      { label: 'Pek 4', sales: 52400000, profit: 11760000 },
    ],
    branches: [
      { name: 'Kebayoran', profit: 31260000, sales: 142400000 },
      { name: 'Bintaro', profit: 13260000, sales: 97600000 },
    ],
    products: [
      { sku: '8991002101147', name: 'Indomie Goreng 85g', qty: 1284, sales: 4494000, cogs: 3723600 },
      { sku: '8991112223334', name: 'Teh Pucuk 350ml', qty: 862, sales: 3879000, cogs: 2930800 },
      { sku: '8991234567890', name: 'Susu Ultra 250ml', qty: 402, sales: 3015000, cogs: 2371800 },
      { sku: '8995000112233', name: 'Kopi Kapal Api 165g', qty: 216, sales: 2700000, cogs: 2116800 },
      { sku: '8992761123456', name: 'Aqua 600ml', qty: 688, sales: 2752000, cogs: 2132800 },
    ],
  },
};

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

export default function LaporanPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [branch, setBranch] = useState('Kebayoran');
  const [shiftCash, setShiftCash] = useState<number | ''>('');
  const [shiftNote, setShiftNote] = useState('');
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [shiftResult, setShiftResult] = useState<'ok' | 'review' | null>(null);
  const [_reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const now = new Date();
    const from = new Date(now);
    if (period === 'today') from.setHours(0, 0, 0, 0);
    else if (period === 'week') from.setDate(now.getDate() - 6);
    else from.setDate(now.getDate() - 29);
    setIsLoadingReport(true);
    fetch(`/api/reports/profit?from=${from.toISOString()}&to=${now.toISOString()}`, {
      headers: { ...getAuthHeaders() },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => { if (json) setReportData(json); })
      .catch(() => {})
      .finally(() => setIsLoadingReport(false));
  }, [period, isOnline]);

  const data = periodsData[period];

  const branchData = useMemo(() => {
    const total = data.branches.reduce((sum, b) => sum + b.sales, 0) || 1;
    const found = data.branches.find((b) => b.name === branch) || data.branches[0];
    const factor = found.sales / total;
    return {
      label: data.label,
      trx: Math.max(1, Math.round(data.trx * factor)),
      days: data.days.map((d) => ({ label: d.label, sales: Math.round(d.sales * factor), profit: Math.round(d.profit * factor) })),
      branches: data.branches,
      products: data.products,
      branchSales: found.sales,
      branchProfit: found.profit,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, branch]);

  const cogs = branchData.products.reduce((sum, p) => sum + p.cogs, 0);
  const profit = branchData.branchSales - cogs;
  const margin = branchData.branchSales ? (profit / branchData.branchSales) * 100 : 0;
  const basket = branchData.branchSales / branchData.trx;

  const expectedCash = Math.round(branchData.branchSales * 0.62);
  const qrisAmount = Math.round(branchData.branchSales * 0.26);
  const cardAmount = Math.round(branchData.branchSales * 0.12);
  const cashValue = typeof shiftCash === 'number' ? shiftCash : 0;
  const variance = cashValue - expectedCash;

  const chartWidth = 720;
  const chartHeight = 240;
  const padX = 46;
  const padTop = 16;
  const padBottom = 40;
  const plotW = chartWidth - padX - 16;
  const plotH = chartHeight - padTop - padBottom;
  const max = Math.max(1, ...branchData.days.map((d) => d.sales));
  const step = branchData.days.length > 1 ? plotW / (branchData.days.length - 1) : 0;
  const x = (index: number) => padX + index * step;
  const y = (value: number) => padTop + plotH - (value / max) * plotH;

  const salesPoints = branchData.days.map((d, i) => `${x(i)},${y(d.sales)}`).join(' ');
  const profitPoints = branchData.days.map((d, i) => `${x(i)},${y(d.profit)}`).join(' ');

  const handleShiftClose = (type: 'ok' | 'review') => {
    setShiftResult(type);
    setShowShiftDialog(true);
  };

  return (
    <div className="grid gap-6">
      {/* Offline / loading state */}
      {!isOnline && (
        <div className="flex gap-2 p-3 rounded-[10px] bg-[#fdf0da] text-[#8a5300] text-[13px]">
          <Info className="w-4 h-4 flex-none mt-0.5" />
          <span>Data tidak tersedia offline. Sambungkan ke internet untuk memuat laporan terbaru.</span>
        </div>
      )}
      {isOnline && isLoadingReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white animate-pulse">
              <div className="h-3 w-24 bg-[#e2e6ec] rounded mb-3" />
              <div className="h-7 w-32 bg-[#e2e6ec] rounded" />
            </div>
          ))}
        </div>
      )}
      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Penjualan bersih</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(branchData.branchSales)}</p>
          <span className="text-xs text-[#5a6675]">Rata-rata {rupiah(basket)} per transaksi</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">HPP aktual (FEFO)</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(cogs)}</p>
          <span className="text-xs text-[#5a6675]">Dari batch yang benar-benar terjual</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Laba kotor</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(profit)}</p>
          <span className={cn('text-xs font-medium', margin >= 22 ? 'text-[#136b3f]' : 'text-[#a52b22]')}>
            {margin >= 22 ? 'Di atas target 22% · komposisi produk sehat' : 'Di bawah target 22% · periksa margin produk cepat laku'}
          </span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Margin laba kotor</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{margin.toFixed(1).replace('.', ',')}%</p>
          <span className="text-xs text-[#5a6675]">Target cabang 22%</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
          <span className="text-xs text-[#5a6675]">Rata-rata nilai transaksi</span>
          <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(basket)}</p>
          <span className="text-xs text-[#5a6675]">{branchData.trx} transaksi · {branchData.label} · {branch}</span>
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Line Chart */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Tren penjualan vs laba kotor</h2>
            <div className="flex flex-wrap gap-4 text-xs text-[#5a6675]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#12507f]" />Penjualan</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#0f6d5f]" />Laba kotor</span>
            </div>
          </div>
          <div className="p-4 lg:p-5">
            <div className="flex flex-wrap gap-1 p-1 mb-4 bg-[#f7f8fa] rounded-[10px]">
              {[
                { key: 'today' as Period, label: 'Hari ini' },
                { key: 'week' as Period, label: '7 hari' },
                { key: 'month' as Period, label: '30 hari' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  aria-pressed={period === p.key}
                  className={cn(
                    'min-h-[38px] px-3 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors',
                    period === p.key ? 'bg-white text-[#182230] font-semibold shadow-sm' : 'text-[#5a6675]'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto aspect-[4/1]" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="sales-chart-title">
              <title id="sales-chart-title">Penjualan 7 hari terakhir</title>
              {[0, 0.5, 1].map((ratio, i) => {
                const value = max * ratio;
                const yy = y(value);
                const label = value >= 1000000 ? `${(value / 1000000).toFixed(1).replace('.', ',')} jt` : `${Math.round(value / 1000)} rb`;
                return (
                  <g key={i}>
                    <line x1={padX} y1={yy} x2={padX + plotW} y2={yy} stroke="#e2e6ec" strokeWidth="1" />
                    <text x={padX - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#5a6675">{label}</text>
                  </g>
                );
              })}
              {branchData.days.map((d, i) => (
                <text key={i} x={x(i)} y={chartHeight - 14} textAnchor="middle" fontSize="11" fill="#5a6675">{d.label}</text>
              ))}
              <polyline points={salesPoints} fill="none" stroke="#12507f" strokeWidth="2.5" strokeLinejoin="round" />
              <polyline points={profitPoints} fill="none" stroke="#0f6d5f" strokeWidth="2.5" strokeLinejoin="round" />
              {branchData.days.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(d.profit)} r="3.5" fill="#0f6d5f" />
              ))}
            </svg>
            <p className="mt-3 text-xs text-[#5a6675]">
              Total {rupiah(branchData.days.reduce((sum, d) => sum + d.sales, 0))} penjualan dan {rupiah(branchData.days.reduce((sum, d) => sum + d.profit, 0))} laba kotor pada {branchData.label.toLowerCase()} di {branch}.
            </p>
          </div>
        </section>

        {/* Branch Bars */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Laba kotor per cabang</h2>
          </div>
          <div className="p-4 lg:p-5">
            <div className="flex flex-wrap gap-1 p-1 mb-4 bg-[#f7f8fa] rounded-[10px]">
              {branchData.branches.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setBranch(b.name)}
                  aria-pressed={branch === b.name}
                  className={cn(
                    'min-h-[36px] px-3 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors',
                    branch === b.name ? 'bg-white text-[#182230] font-semibold shadow-sm' : 'text-[#5a6675]'
                  )}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              {branchData.branches.map((b) => {
                const maxProfit = Math.max(...branchData.branches.map((br) => br.profit));
                const pct = Math.max(4, Math.round((b.profit / maxProfit) * 100));
                return (
                  <div key={b.name} className="grid gap-1.5">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span>{b.name}{b.name === branch ? ' (aktif)' : ''}</span>
                      <strong className="tabular-nums">{rupiah(b.profit)}</strong>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#f7f8fa] overflow-hidden">
                      <span
                        className={cn('block h-full rounded-full', b.name === branch ? 'bg-[#0f6d5f]' : 'bg-[#12507f]')}
                        style={{ width: `${pct}%` }}
                        title={`${b.name} · margin ${b.sales ? ((b.profit / b.sales) * 100).toFixed(1) : 0}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 p-3 mt-4 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
              <Info className="w-4 h-4 flex-none" />
              <span>HPP cabang Bintaro lebih tinggi karena komposisi susu dan bakery yang lebih besar.</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(300px,360px)] gap-6 items-start">
        {/* Product Table */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Kontribusi laba per produk</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">{branchData.products.length} produk</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[#5a6675] bg-[#f7f8fa]">
                  <th scope="col" className="text-left p-3 w-[30%]">Produk</th>
                  <th scope="col" className="text-right p-3 w-[10%]">Qty terjual</th>
                  <th scope="col" className="text-right p-3 w-[17%]">Penjualan</th>
                  <th scope="col" className="text-right p-3 w-[15%]">HPP</th>
                  <th scope="col" className="text-right p-3 w-[15%]">Laba kotor</th>
                  <th scope="col" className="text-right p-3 w-[13%]">Margin</th>
                </tr>
              </thead>
              <tbody>
                {branchData.products.map((p) => {
                  const pProfit = p.sales - p.cogs;
                  const pMargin = p.sales ? (pProfit / p.sales) * 100 : 0;
                  return (
                    <tr key={p.sku} className="border-b border-[#e2e6ec]">
                      <td className="p-3">
                        <span className="font-semibold">{p.name}</span>
                        <span className="block text-xs text-[#5a6675] font-mono">{p.sku}</span>
                      </td>
                      <td className="p-3 text-right tabular-nums">{p.qty}</td>
                      <td className="p-3 text-right tabular-nums">{rupiah(p.sales)}</td>
                      <td className="p-3 text-right tabular-nums">{rupiah(p.cogs)}</td>
                      <td className="p-3 text-right tabular-nums">{rupiah(pProfit)}</td>
                      <td className="p-3 text-right tabular-nums">{pMargin.toFixed(1).replace('.', ',')}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Shift Reconciliation */}
        <aside className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Rekonsiliasi tutup kasir</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">Shift terbuka</span>
          </div>
          <div className="p-4 lg:p-5">
            <p className="text-[13px] text-[#5a6675]">Kasir 01 · Sari Wulandari · 08:12–16:00 · 62 transaksi</p>
            <ul className="mt-3 grid gap-2 list-none m-0 p-0 text-[13px]">
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Kas seharusnya (sistem)</span>
                <strong className="text-[#182230] tabular-nums">{rupiah(expectedCash)}</strong>
              </li>
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Pembayaran QRIS</span>
                <strong className="text-[#182230] tabular-nums">{rupiah(qrisAmount)}</strong>
              </li>
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Kartu debit/kredit</span>
                <strong className="text-[#182230] tabular-nums">{rupiah(cardAmount)}</strong>
              </li>
            </ul>
            <div className="mt-3 grid gap-1.5">
              <label htmlFor="shift-cash" className="text-xs font-medium text-[#5a6675]">Kas fisik hasil hitung</label>
              <input
                id="shift-cash"
                type="number"
                min={0}
                step={1000}
                value={shiftCash}
                onChange={(e) => setShiftCash(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="min-h-[44px] px-3 text-[15px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
              />
            </div>
            <div className="mt-3 grid gap-1.5">
              <label htmlFor="shift-note" className="text-xs font-medium text-[#5a6675]">Catatan selisih (opsional)</label>
              <textarea
                id="shift-note"
                value={shiftNote}
                onChange={(e) => setShiftNote(e.target.value)}
                placeholder="Misal: selisih Rp5.000 karena pembulatan kembalian."
                className="min-h-[76px] px-3 py-2 text-[15px] border border-[#cbd2dc] rounded-[10px] resize-y focus:outline-none focus:border-[#0f6d5f]"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[#e2e6ec] flex items-baseline justify-between text-[15px] font-bold text-[#182230]">
              <span>Selisih</span>
              <strong className={cn(
                'text-lg tabular-nums',
                variance === 0 ? 'text-[#136b3f]' : variance > 0 ? 'text-[#12507f]' : 'text-[#a52b22]'
              )}>
                {rupiah(variance)}
              </strong>
            </div>
            <p className={cn(
              'mt-2 text-xs font-medium',
              shiftCash === '' ? 'text-[#5a6675]' :
              variance === 0 ? 'text-[#136b3f]' :
              Math.abs(variance) <= 10000 ? 'text-[#8a5300]' : 'text-[#a52b22]'
            )}>
              {shiftCash === '' ? 'Masukkan jumlah kas fisik untuk menghitung selisih.' :
               variance === 0 ? 'Kas fisik sama dengan catatan sistem. Aman untuk ditutup.' :
               Math.abs(variance) <= 10000 ? 'Selisih dalam batas toleransi Rp10.000. Tetap beri catatan bila perlu.' :
               'Selisih melebihi toleransi Rp10.000. Tandai perlu ditinjau agar tercatat di laporan.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleShiftClose('ok')}
                className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer"
              >
                Tutup & tandai selesai
              </button>
              <button
                type="button"
                onClick={() => handleShiftClose('review')}
                className="min-h-[42px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                Tandai perlu ditinjau
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Shift Result Dialog */}
      <Dialog open={showShiftDialog && !!shiftResult} onOpenChange={(open) => { if (!open) { setShowShiftDialog(false); setShiftResult(null); } }}>
        <DialogContent className="w-[min(460px,92vw)] max-w-none gap-0 p-0 bg-white border-[#e2e6ec] rounded-[14px] shadow-none">
          {shiftResult && (
            <>
              <div className="p-5 grid gap-3">
                <DialogTitle className="m-0 text-lg font-bold">
                  {shiftResult === 'ok' ? 'Shift berhasil ditutup' : 'Selisih perlu ditinjau'}
                </DialogTitle>
                <ul className="grid gap-2 list-none m-0 p-0 text-[13px]">
                  <li className="flex items-center justify-between p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                    <strong>Kas seharusnya</strong>
                    <span className="tabular-nums">{rupiah(expectedCash)}</span>
                  </li>
                  <li className="flex items-center justify-between p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                    <strong>Kas fisik</strong>
                    <span className="tabular-nums">{rupiah(cashValue)}</span>
                  </li>
                  <li className="flex items-center justify-between p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                    <strong>Selisih</strong>
                    <span className={cn('tabular-nums font-semibold', variance < 0 ? 'text-[#a52b22]' : variance > 0 ? 'text-[#136b3f]' : '')}>
                      {rupiah(variance)}
                    </span>
                  </li>
                </ul>
                <DialogDescription className="text-xs text-[#5a6675] m-0">
                  {shiftResult === 'ok'
                    ? 'Shift ditandai selesai dan siap untuk rekap harian.'
                    : 'Shift ditandai perlu ditinjau. Manajer akan memverifikasi selisih.'}
                </DialogDescription>
              </div>
              <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
                <button
                  type="button"
                  onClick={() => { setShowShiftDialog(false); setShiftResult(null); }}
                  className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
