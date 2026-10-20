'use client';

import { useState, useEffect } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { getAuthHeaders, decodeSessionToken, getSessionToken, getTenantInfo } from '@/core/auth/client';

type Period = 'today' | 'week' | 'month';

interface ReportItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
}

interface ReportData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossMarginPct: string;
  transactionCount: number;
  items: ReportItem[];
}

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now);
  if (period === 'today') from.setHours(0, 0, 0, 0);
  else if (period === 'week') from.setDate(now.getDate() - 6);
  else from.setDate(now.getDate() - 29);
  return { from, to: now };
}

function periodLabel(period: Period) {
  if (period === 'today') return 'Hari ini';
  if (period === 'week') return '7 hari';
  return '30 hari';
}

export default function LaporanPage() {
  const sessionPayload = decodeSessionToken<{ userName?: string }>(getSessionToken() ?? '');
  const [period, setPeriod] = useState<Period>('week');
  const [shiftCash, setShiftCash] = useState<number | ''>('');
  const [shiftNote, setShiftNote] = useState('');
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [shiftResult, setShiftResult] = useState<'ok' | 'review' | null>(null);
  const [isClosingShift, setIsClosingShift] = useState(false);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isErrorReport, setIsErrorReport] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchReport = () => {
    if (!isOnline) return;
    const { from, to } = getPeriodRange(period);
    setIsLoadingReport(true);
    setIsErrorReport(false);
    fetch(`/api/reports/profit?from=${from.toISOString()}&to=${to.toISOString()}`, {
      headers: { ...getAuthHeaders() },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Non-OK response');
        return res.json();
      })
      .then((json: ReportData) => setReportData(json))
      .catch(() => setIsErrorReport(true))
      .finally(() => setIsLoadingReport(false));
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, isOnline]);

  // Derived values from API response
  const totalRevenue = reportData?.totalRevenue ?? 0;
  const totalCOGS = reportData?.totalCOGS ?? 0;
  const grossProfit = reportData?.grossProfit ?? 0;
  const marginPct = reportData ? parseFloat(reportData.grossMarginPct) : 0;
  const trxCount = reportData?.transactionCount ?? 0;
  const products = reportData?.items ?? [];
  const basket = trxCount > 0 ? totalRevenue / trxCount : 0;

  // Shift reconciliation (kept exactly as-is, using live revenue for expected cash)
  const expectedCash = Math.round(totalRevenue * 0.62);
  const qrisAmount = Math.round(totalRevenue * 0.26);
  const cardAmount = Math.round(totalRevenue * 0.12);
  const cashValue = typeof shiftCash === 'number' ? shiftCash : 0;
  const variance = cashValue - expectedCash;

  const handleShiftClose = async (type: 'ok' | 'review') => {
    if (!isOnline) {
      toast.error('Tutup kasir membutuhkan koneksi internet.');
      return;
    }
    const cashAmount = typeof shiftCash === 'number' ? shiftCash : 0;
    setIsClosingShift(true);
    try {
      const res = await fetch('/api/reports/shift/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ cashAmount, note: shiftNote, status: type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Gagal menutup kasir');
      }
      setShiftResult(type);
      setShowShiftDialog(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan saat menutup kasir.');
    } finally {
      setIsClosingShift(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex gap-2 p-3 rounded-[10px] bg-[#fdf0da] text-[#8a5300] text-[13px]">
          <Info className="w-4 h-4 flex-none mt-0.5" />
          <span>Data tidak tersedia offline. Sambungkan ke internet untuk memuat laporan terbaru.</span>
        </div>
      )}

      {/* Error state */}
      {isOnline && isErrorReport && !isLoadingReport && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-[10px] bg-[#fdf0da] text-[#8a5300] text-[13px]">
          <div className="flex gap-2">
            <Info className="w-4 h-4 flex-none mt-0.5" />
            <span>Gagal memuat data laporan. Periksa koneksi internet dan coba lagi.</span>
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="flex items-center gap-1.5 min-h-[34px] px-3 text-[13px] font-medium bg-white border border-[#e2c07a] rounded-[8px] hover:bg-[#fdf8ee] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      {/* KPI skeleton */}
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
      {!isLoadingReport && (
        <section className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
            <span className="text-xs text-[#5a6675]">Penjualan bersih</span>
            <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(totalRevenue)}</p>
            <span className="text-xs text-[#5a6675]">Rata-rata {rupiah(basket)} per transaksi</span>
          </div>
          <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
            <span className="text-xs text-[#5a6675]">HPP aktual (FEFO)</span>
            <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(totalCOGS)}</p>
            <span className="text-xs text-[#5a6675]">Dari batch yang benar-benar terjual</span>
          </div>
          <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
            <span className="text-xs text-[#5a6675]">Laba kotor</span>
            <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(grossProfit)}</p>
            <span className={cn('text-xs font-medium', marginPct >= 22 ? 'text-[#136b3f]' : 'text-[#a52b22]')}>
              {marginPct >= 22 ? 'Di atas target 22% · komposisi produk sehat' : 'Di bawah target 22% · periksa margin produk cepat laku'}
            </span>
          </div>
          <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
            <span className="text-xs text-[#5a6675]">Margin laba kotor</span>
            <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{marginPct.toFixed(1).replace('.', ',')}%</p>
            <span className="text-xs text-[#5a6675]">Target cabang 22%</span>
          </div>
          <div className="p-4 border border-[#e2e6ec] rounded-[14px] bg-white">
            <span className="text-xs text-[#5a6675]">Rata-rata nilai transaksi</span>
            <p className="m-0 mt-1 text-2xl font-bold tabular-nums">{rupiah(basket)}</p>
            <span className="text-xs text-[#5a6675]">{trxCount} transaksi · {periodLabel(period)}</span>
          </div>
        </section>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Trend chart — period selector + info placeholder */}
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
              {([
                { key: 'today' as Period, label: 'Hari ini' },
                { key: 'week' as Period, label: '7 hari' },
                { key: 'month' as Period, label: '30 hari' },
              ]).map((p) => (
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
            </div>

            {/* Chart skeleton */}
            {isLoadingReport && (
              <div className="w-full h-[120px] bg-[#f7f8fa] rounded-[10px] animate-pulse" />
            )}

            {/* Chart placeholder when loaded */}
            {!isLoadingReport && (
              <div className="flex flex-col items-center justify-center gap-2 w-full h-[120px] rounded-[10px] bg-[#f7f8fa]">
                <Info className="w-4 h-4 text-[#5a6675]" />
                <p className="text-[13px] text-[#5a6675] m-0">Grafik tren per periode tersedia dalam pengembangan</p>
                {reportData && (
                  <p className="text-xs text-[#5a6675] m-0">
                    Total {rupiah(totalRevenue)} penjualan · {rupiah(grossProfit)} laba kotor · {periodLabel(period)}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Branch breakdown — simplified, single-branch total */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Ringkasan periode</h2>
          </div>
          <div className="p-4 lg:p-5">
            {isLoadingReport && (
              <div className="grid gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-[#f7f8fa] rounded-[8px] animate-pulse" />
                ))}
              </div>
            )}
            {!isLoadingReport && (
              <div className="grid gap-3 text-[13px]">
                <div className="flex items-baseline justify-between p-3 rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">Total penjualan</span>
                  <strong className="tabular-nums">{rupiah(totalRevenue)}</strong>
                </div>
                <div className="flex items-baseline justify-between p-3 rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">HPP aktual</span>
                  <strong className="tabular-nums">{rupiah(totalCOGS)}</strong>
                </div>
                <div className="flex items-baseline justify-between p-3 rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">Laba kotor</span>
                  <strong className="tabular-nums text-[#136b3f]">{rupiah(grossProfit)}</strong>
                </div>
                <div className="flex items-baseline justify-between p-3 rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">Jumlah transaksi</span>
                  <strong className="tabular-nums">{trxCount}</strong>
                </div>
                {totalRevenue > 0 && (
                  <div className="mt-1">
                    <div className="h-2.5 rounded-full bg-[#e2e6ec] overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-[#0f6d5f]"
                        style={{ width: `${Math.min(100, marginPct)}%` }}
                        title={`Margin ${marginPct.toFixed(1)}%`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#5a6675]">Margin {marginPct.toFixed(1).replace('.', ',')}% dari target 22%</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 p-3 mt-4 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
              <Info className="w-4 h-4 flex-none" />
              <span>Breakdown per cabang tersedia dalam pengembangan selanjutnya.</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(300px,360px)] gap-6 items-start">
        {/* Product Table */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Kontribusi laba per produk</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">{products.length} produk</span>
          </div>

          {/* Table skeleton */}
          {isLoadingReport && (
            <div className="p-4 grid gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-[#f7f8fa] rounded-[8px] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoadingReport && products.length === 0 && !isErrorReport && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-[13px] text-[#5a6675]">
              <Info className="w-5 h-5" />
              <p className="m-0">Belum ada data produk untuk periode ini.</p>
            </div>
          )}

          {/* Populated table */}
          {!isLoadingReport && products.length > 0 && (
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
                  {products.map((p) => {
                    const pMargin = p.revenue > 0 ? (p.grossProfit / p.revenue) * 100 : 0;
                    return (
                      <tr key={p.productId} className="border-b border-[#e2e6ec]">
                        <td className="p-3">
                          <span className="font-semibold">{p.productName}</span>
                          <span className="block text-xs text-[#5a6675] font-mono">{p.sku}</span>
                        </td>
                        <td className="p-3 text-right tabular-nums">{p.quantity}</td>
                        <td className="p-3 text-right tabular-nums">{rupiah(p.revenue)}</td>
                        <td className="p-3 text-right tabular-nums">{rupiah(p.cogs)}</td>
                        <td className="p-3 text-right tabular-nums">{rupiah(p.grossProfit)}</td>
                        <td className="p-3 text-right tabular-nums">{pMargin.toFixed(1).replace('.', ',')}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Shift Reconciliation — kept exactly as-is */}
        <aside className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Rekonsiliasi tutup kasir</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">Shift terbuka</span>
          </div>
          <div className="p-4 lg:p-5">
            <p className="text-[13px] text-[#5a6675]">{sessionPayload?.userName ?? 'Kasir'} · {getTenantInfo()?.branchName ?? 'Cabang'} · {trxCount} transaksi</p>
            <ul className="mt-3 grid gap-2 list-none m-0 p-0 text-[13px]">
              {/* TODO: Replace with real payment breakdown from GET /api/reports/shift when Shift model is added */}
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
            <p className="text-xs text-amber-600 mt-2">Estimasi berdasarkan rata-rata pembayaran</p>
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
                disabled={isClosingShift}
                className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isClosingShift ? 'Menutup…' : 'Tutup & tandai selesai'}
              </button>
              <button
                type="button"
                onClick={() => handleShiftClose('review')}
                disabled={isClosingShift}
                className="min-h-[42px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
