'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ScanBarcode, Plus, Info, CircleAlert, TriangleAlert, CircleCheck,
  Trash2, ChevronDown, ChevronUp, ReceiptText,
  AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { useDatabase } from '@/core/db/hooks';
import { getAuthHeaders } from '@/core/auth/client';
import { toast } from 'sonner';
import useSyncManager from '@/core/sync/useSyncManager';
import { inboundHeaderSchema, inboundLineSchema } from '@/features/inventory/schemas';
import { FieldError } from '@/shared/components/forms/FieldError';
import { fieldBorder } from '@/shared/components/forms/fieldBorder';

// ─── Combined schema ───────────────────────────────────────────────────────────
const inboundFormSchema = inboundHeaderSchema.extend({
  lines: z.array(inboundLineSchema),
});
type InboundFormValues = z.infer<typeof inboundFormSchema>;

// ─── Display-only metadata not tracked by zod ─────────────────────────────────
interface LineMeta {
  sku: string;
  name: string;
  unit: string;
  perishable: boolean;
}

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');
const TODAY = new Date();

// ─── Status badge — short, icon-led, never wraps ──────────────────────────────
function StatusBadge({ level, text }: { level: string; text: string }) {
  // Shorten long danger/warn texts for the badge; full text is in the issues panel
  const short =
    text.startsWith('Belum lengkap:') ? 'Belum lengkap' :
    text === 'Kedaluwarsa — perbarui tanggal' ? 'Kedaluwarsa' :
    text;

  const icon =
    level === 'danger' ? <AlertTriangle className="w-3 h-3 flex-none" /> :
    level === 'warn'   ? <Clock className="w-3 h-3 flex-none" /> :
    <CircleCheck className="w-3 h-3 flex-none" />;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap',
      level === 'danger' ? 'bg-[#fbe8e5] text-[#a52b22]' :
      level === 'warn'   ? 'bg-[#fdf0da] text-[#8a5300]' :
                           'bg-[#e3f4e9] text-[#136b3f]',
    )}>
      {icon}
      {short}
    </span>
  );
}

export default function BarangMasukPage() {
  const db = useDatabase();
  const { triggerSync } = useSyncManager(db);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ─── RHF ────────────────────────────────────────────────────────────────────
  const { register, handleSubmit, control, setError, watch, formState: { errors } } =
    useForm<InboundFormValues>({
      resolver: zodResolver(inboundFormSchema),
      defaultValues: {
        supplier: '',
        invoice: '',
        date: new Date().toISOString().split('T')[0],
        warehouse: '',
        lines: [],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const [linesMeta, setLinesMeta] = useState<LineMeta[]>([]);

  const [scanInput, setScanInput] = useState('');
  const [rowSeq, setRowSeq] = useState(1);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState<{ value: string; label: string }[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Array<{ id: string; name: string }>) => {
        setSupplierOptions(data.map(s => ({ value: s.name, label: s.name })));
      })
      .catch(() => {
        setSupplierOptions([{ value: 'Supplier Lainnya', label: 'Supplier Lainnya' }]);
      });
    fetch('/api/branches')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Array<{ id: string; name: string }>) => {
        setWarehouseOptions(data.map(b => ({ value: b.name, label: b.name })));
      })
      .catch(() => {
        setWarehouseOptions([{ value: 'Gudang Utama', label: 'Gudang Utama' }]);
      });
  }, []);

  // ─── Derived totals ─────────────────────────────────────────────────────────
  const watchedLines = watch('lines') ?? [];
  const totalUnits  = watchedLines.reduce((s, l) => s + (Number(l?.qty)  || 0), 0);
  const totalCost   = watchedLines.reduce((s, l) => s + (Number(l?.qty)  || 0) * (Number(l?.cost) || 0), 0);
  const totalSales  = watchedLines.reduce((s, l) => s + (Number(l?.qty)  || 0) * (Number(l?.cost) || 0) * (1 + (Number(l?.margin) || 0) / 100), 0);
  const totalProfit = totalSales - totalCost;
  const avgMargin   = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1).replace('.', ',') : '0,0';

  // ─── Scan ────────────────────────────────────────────────────────────────────
  const handleScan = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const sku = scanInput.trim();
    if (db) {
      try {
        const Q = await import('@nozbe/watermelondb').then(m => m.Q);
        const products = await db.collections.get('products').query(Q.where('sku', sku)).fetch();
        if (products.length > 0) {
          const p = products[0] as any;
          const idx = linesMeta.findIndex(m => m.sku === sku);
          if (idx !== -1) {
            toast.info(`SKU ${sku} sudah ada di baris ${idx + 1}. Ubah qty langsung di baris.`);
          } else {
            append({ qty: 1, cost: 0, margin: 20, batch: `B${2320 + rowSeq}`, expiry: '' });
            setLinesMeta(prev => [...prev, { sku, name: p.name as string, unit: (p.unit as string) || 'pcs', perishable: true }]);
            setRowSeq(prev => prev + 1);
          }
          setScanInput('');
          return;
        }
      } catch { /* fall through */ }
    }
    toast.error(<span>Produk tidak ditemukan. <a href="/produk" className="underline font-semibold">Tambahkan di menu Produk</a></span>);
    setScanInput('');
  }, [scanInput, linesMeta, rowSeq, append, db]);

  // ─── Remove ──────────────────────────────────────────────────────────────────
  const handleRemoveLine = useCallback((index: number) => {
    remove(index);
    setLinesMeta(prev => prev.filter((_, i) => i !== index));
  }, [remove]);

  // ─── Line status ─────────────────────────────────────────────────────────────
  const getLineStatus = (index: number) => {
    const line = watchedLines[index];
    const meta = linesMeta[index];
    if (!line || !meta) return { level: 'ok', text: 'Siap disimpan' };
    const missing: string[] = [];
    if ((Number(line.qty)  || 0) <= 0) missing.push('qty');
    if ((Number(line.cost) || 0) <= 0) missing.push('HPP');
    if (!String(line.batch ?? '').trim()) missing.push('no. batch');
    if (meta.perishable && !line.expiry) missing.push('kedaluwarsa');
    const expired = line.expiry ? new Date(line.expiry + 'T00:00:00') <= TODAY : false;
    if (missing.length > 0) return { level: 'danger', text: `Belum lengkap: ${missing.join(', ')}` };
    if (expired) return { level: 'danger', text: 'Kedaluwarsa — perbarui tanggal' };
    if (meta.perishable) return { level: 'warn', text: 'Perishable · FEFO' };
    return { level: 'ok', text: 'Siap disimpan' };
  };

  // ─── Issues ──────────────────────────────────────────────────────────────────
  const issues: { level: string; text: string }[] = [];
  if (fields.length === 0) issues.push({ level: 'warn', text: 'Belum ada baris penerimaan. Pindai SKU untuk menambah baris.' });
  const incompleteCount = fields.filter((_, i) => getLineStatus(i).level === 'danger').length;
  if (incompleteCount > 0) issues.push({ level: 'danger', text: `${incompleteCount} baris belum lengkap. Lengkapi batch, kedaluwarsa, qty dan HPP.` });
  const soonExpiringCount = watchedLines.filter(l => {
    if (!l?.expiry) return false;
    return (new Date(l.expiry + 'T00:00:00').getTime() - TODAY.getTime()) / 86400000 <= 30;
  }).length;
  if (soonExpiringCount > 0) issues.push({ level: 'warn', text: `${soonExpiringCount} batch kedaluwarsa ≤30 hari.` });
  if (issues.length === 0 && fields.length > 0) issues.push({ level: 'ok', text: 'Semua baris lengkap dan siap disimpan.' });

  // ─── Save ────────────────────────────────────────────────────────────────────
  const onSave = handleSubmit(async (data) => {
    let hasError = false;
    data.lines.forEach((line, i) => {
      if (linesMeta[i]?.perishable && !line.expiry) {
        setError(`lines.${i}.expiry`, { type: 'manual', message: 'Kedaluwarsa wajib diisi untuk produk perishable' });
        hasError = true;
      }
    });
    if (hasError) return;
    if (!isOnline) { toast.error('Penerimaan barang membutuhkan koneksi internet.'); return; }
    setShowSaveDialog(true);
  });

  const handleConfirmSave = async () => {
    const data = watch();
    setIsSaving(true);
    try {
      const payload = {
        invoiceNumber: data.invoice,
        items: data.lines.map((line, i) => ({
          productId: linesMeta[i]?.sku ?? '',
          qty: line.qty,
          unitCost: line.cost,
          batchNumber: line.batch,
          expiryDate: line.expiry || null,
          sellingPrice: Math.round(line.cost * (1 + line.margin / 100)),
        })),
      };
      const res = await fetch('/api/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menyimpan');
      toast.success('Penerimaan barang berhasil disimpan.');
      triggerSync();
      fields.forEach((_, i) => remove(fields.length - 1 - i));
      setLinesMeta([]);
      setShowSaveDialog(false);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : null) || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Sidebar content (desktop + mobile drawer) ───────────────────────────────
  const SidebarContent = () => (
    <>
      <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
        <div className="p-4 border-b border-[#e2e6ec]">
          <h2 className="m-0 text-[15px] font-semibold">Ringkasan biaya</h2>
        </div>
        <div className="p-4">
          <ul className="grid gap-2.5 list-none m-0 p-0 text-sm">
            <li className="flex items-baseline justify-between gap-2 text-[#5a6675]">
              <span>Total unit</span>
              <strong className="text-[#182230] tabular-nums">{totalUnits}</strong>
            </li>
            <li className="flex items-baseline justify-between gap-2 text-[#5a6675]">
              <span>Total HPP</span>
              <strong className="text-[#182230] tabular-nums">{rupiah(totalCost)}</strong>
            </li>
            <li className="flex items-baseline justify-between gap-2 text-[#5a6675]">
              <span>Est. penjualan</span>
              <strong className="text-[#182230] tabular-nums">{rupiah(totalSales)}</strong>
            </li>
            <li className="flex items-baseline justify-between gap-2 text-[#5a6675]">
              <span>Est. laba kotor</span>
              <strong className="text-[#182230] tabular-nums">{rupiah(totalProfit)}</strong>
            </li>
            <li className="pt-3 border-t border-[#e2e6ec] flex items-baseline justify-between gap-2 text-[15px] font-bold text-[#182230]">
              <span>Margin rata-rata</span>
              <strong className="text-lg tabular-nums">{avgMargin}%</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#e2e6ec]">
          <h2 className="m-0 text-[15px] font-semibold">Pemeriksaan</h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8eef7] text-[#12507f]">{issues.length}</span>
        </div>
        <div className="p-4">
          <ul className="grid gap-2 list-none m-0 p-0">
            {issues.map((issue, i) => (
              <li key={i} className={cn(
                'flex gap-2 p-3 rounded-[10px] text-xs leading-snug',
                issue.level === 'danger' ? 'bg-[#fbe8e5] text-[#a52b22]' :
                issue.level === 'warn'   ? 'bg-[#fdf0da] text-[#8a5300]' :
                                           'bg-[#e3f4e9] text-[#136b3f]',
              )}>
                {issue.level === 'danger' ? <CircleAlert className="w-4 h-4 flex-none mt-px" /> :
                 issue.level === 'warn'   ? <TriangleAlert className="w-4 h-4 flex-none mt-px" /> :
                                            <CircleCheck className="w-4 h-4 flex-none mt-px" />}
                <span>{issue.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex gap-2 p-3 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs leading-snug">
        <Info className="w-4 h-4 flex-none mt-px shrink-0" />
        <span>Simpan menambah stok batch dan memakai HPP ini sebagai dasar COGS FEFO saat terjual.</span>
      </div>
    </>
  );

  // ─── Input class helper ──────────────────────────────────────────────────────
  const inputCls = (hasErr: boolean, extra = '') =>
    cn('w-full min-h-[44px] px-3 text-[15px] border rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10', fieldBorder(hasErr, 'border-[#cbd2dc]'), extra);

  const fieldInputCls = (hasErr: boolean) =>
    cn('w-full min-h-[44px] px-3 text-[14px] tabular-nums border rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10', fieldBorder(hasErr, 'border-[#cbd2dc]'));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(272px,308px)] gap-6 items-start pb-28 min-[900px]:pb-0">

        {/* ── Stats row ───────────────────────────────────────────────────────── */}
        {/* Mobile: 2-col (operational stats front, document meta hidden); sm+: 4-col */}
        <section className="col-span-full grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Priority 1 on mobile: lines + units in progress */}
          <div className="p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
            <span className="text-xs text-[#5a6675]">Baris &amp; unit</span>
            <p className="m-0 mt-1 text-lg font-bold tabular-nums">{fields.length} baris</p>
            <span className="text-xs text-[#5a6675]">{totalUnits} unit diterima</span>
          </div>
          {/* Priority 2 on mobile: running cost */}
          <div className="p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
            <span className="text-xs text-[#5a6675]">Total HPP</span>
            <p className="m-0 mt-1 text-lg font-bold tabular-nums">{rupiah(totalCost)}</p>
            <span className="text-xs text-[#5a6675]">Dasar COGS FEFO</span>
          </div>
          {/* Secondary on mobile — hidden at xs, shown sm+ */}
          <div className="hidden sm:block p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
            <span className="text-xs text-[#5a6675]">Nomor penerimaan</span>
            <p className="m-0 mt-1 text-[15px] font-bold tabular-nums">GR-2026-0418</p>
            <span className="text-xs text-[#5a6675]">Draft · belum diposting</span>
          </div>
          <div className="hidden sm:block p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
            <span className="text-xs text-[#5a6675]">Supplier</span>
            <p className="m-0 mt-1 text-[15px] font-bold truncate">{watch('supplier') || '—'}</p>
            <span className="text-xs text-[#5a6675]">Kontrak s/d 30 Jun</span>
          </div>
        </section>

        {/* ── Main content ────────────────────────────────────────────────────── */}
        <div className="grid gap-6 min-w-0">

          {/* Document details ─────────────────────────────────────────────────── */}
          <section className="bg-white border border-[#e2e6ec] rounded-[14px] min-w-0">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Detail dokumen</h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8eef7] text-[#12507f]">Batch &amp; kedaluwarsa wajib</span>
            </div>
            {/* 1-col on mobile · 2-col on sm · 4-col on lg */}
            <div className="p-4 lg:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="supplier" className="text-xs font-medium text-[#5a6675]">Supplier</label>
                <div className="relative">
                  <select id="supplier" {...register('supplier')} className={inputCls(!!errors.supplier, 'appearance-none pr-10 cursor-pointer')}>
                    {supplierOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6675]" />
                </div>
                <FieldError>{errors.supplier?.message}</FieldError>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="invoice" className="text-xs font-medium text-[#5a6675]">Nomor faktur</label>
                <input id="invoice" type="text" {...register('invoice')} className={inputCls(!!errors.invoice)} />
                <FieldError>{errors.invoice?.message}</FieldError>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="date" className="text-xs font-medium text-[#5a6675]">Tanggal terima</label>
                <input id="date" type="date" {...register('date')} className={inputCls(!!errors.date)} />
                <FieldError>{errors.date?.message}</FieldError>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="warehouse" className="text-xs font-medium text-[#5a6675]">Gudang tujuan</label>
                <div className="relative">
                  <select id="warehouse" {...register('warehouse')} className={inputCls(!!errors.warehouse, 'appearance-none pr-10 cursor-pointer')}>
                    {warehouseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6675]" />
                </div>
                <FieldError>{errors.warehouse?.message}</FieldError>
              </div>
            </div>
          </section>

          {/* Receiving lines ──────────────────────────────────────────────────── */}
          <section className="bg-white border border-[#e2e6ec] rounded-[14px] min-w-0">
            {/* Section header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Baris penerimaan</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('scan-input')?.focus()}
                  className="flex items-center gap-1.5 min-h-[40px] px-3 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
                  aria-label="Pindai barcode"
                >
                  <ScanBarcode className="w-4 h-4 flex-none" />
                  <span className="hidden sm:inline">Pindai</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('scan-input')?.focus()}
                  className="flex items-center gap-1.5 min-h-[40px] px-3 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
                  aria-label="Tambah baris manual"
                >
                  <Plus className="w-4 h-4 flex-none" />
                  <span className="hidden sm:inline">Baris manual</span>
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-5 grid gap-5 min-w-0 overflow-hidden">
              {/* Scan input */}
              <div className="grid gap-1.5 min-w-0">
                <label htmlFor="scan-input" className="text-xs font-medium text-[#5a6675]">Pindai / ketik SKU</label>
                <input
                  id="scan-input"
                  type="search"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={handleScan}
                  placeholder="Ketik atau pindai barcode, lalu Enter…"
                  className="w-full min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10"
                />
              </div>

              {/* Line cards */}
              <ul className="grid gap-4 list-none m-0 p-0 min-w-0">
                {fields.map((field, index) => {
                  const status     = getLineStatus(index);
                  const meta       = linesMeta[index];
                  const watched    = watchedLines[index];
                  const sellPrice  = (Number(watched?.cost) || 0) * (1 + (Number(watched?.margin) || 0) / 100);
                  const lineCost   = (Number(watched?.qty)  || 0) * (Number(watched?.cost) || 0);
                  const lineErrors = errors.lines?.[index];
                  const isDanger   = status.level === 'danger';

                  return (
                    <li
                      key={field.id}
                      className={cn(
                        'grid gap-4 p-4 border rounded-[14px] min-w-0',
                        isDanger ? 'border-[#e8b4ae] bg-[#fff9f8]' : 'border-[#e2e6ec] bg-white',
                      )}
                    >
                      {/* ── Product identity + status ── */}
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[15px] font-semibold leading-tight truncate">{meta?.name ?? '—'}</p>
                          <p className="m-0 mt-0.5 text-xs text-[#5a6675] font-mono">{meta?.sku} · {meta?.unit}</p>
                        </div>
                        <StatusBadge level={status.level} text={status.text} />
                      </div>

                      {/* ── Row 1: Qty + HPP (core numbers) ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <label className="text-xs font-medium text-[#5a6675]" htmlFor={`qty-${field.id}`}>Qty</label>
                          <input
                            id={`qty-${field.id}`}
                            type="number"
                            min={1}
                            {...register(`lines.${index}.qty`)}
                            className={fieldInputCls(!!lineErrors?.qty)}
                          />
                          <FieldError>{lineErrors?.qty?.message}</FieldError>
                        </div>
                        <div className="grid gap-1">
                          <label className="text-xs font-medium text-[#5a6675]" htmlFor={`cost-${field.id}`}>HPP / unit (Rp)</label>
                          <input
                            id={`cost-${field.id}`}
                            type="number"
                            min={0}
                            step={100}
                            {...register(`lines.${index}.cost`)}
                            className={fieldInputCls(!!lineErrors?.cost)}
                          />
                          <FieldError>{lineErrors?.cost?.message}</FieldError>
                        </div>
                      </div>

                      {/* ── Row 2: Margin + Batch ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <label className="text-xs font-medium text-[#5a6675]" htmlFor={`margin-${field.id}`}>Margin %</label>
                          <input
                            id={`margin-${field.id}`}
                            type="number"
                            min={0}
                            {...register(`lines.${index}.margin`)}
                            className={fieldInputCls(!!lineErrors?.margin)}
                          />
                          <FieldError>{lineErrors?.margin?.message}</FieldError>
                        </div>
                        <div className="grid gap-1">
                          <label className="text-xs font-medium text-[#5a6675]" htmlFor={`batch-${field.id}`}>No. batch</label>
                          <input
                            id={`batch-${field.id}`}
                            type="text"
                            {...register(`lines.${index}.batch`)}
                            className={cn('w-full min-h-[44px] px-3 text-[14px] border rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10', fieldBorder(!!lineErrors?.batch, 'border-[#cbd2dc]'))}
                          />
                          <FieldError>{lineErrors?.batch?.message}</FieldError>
                        </div>
                      </div>

                      {/* ── Row 3: Expiry (full-width) ── */}
                      <div className="grid gap-1">
                        <label className="text-xs font-medium text-[#5a6675]" htmlFor={`expiry-${field.id}`}>
                          Tanggal kedaluwarsa{meta?.perishable ? <span className="ml-1 text-[#a52b22]">*</span> : <span className="ml-1 text-[#8a94a3]">(opsional)</span>}
                        </label>
                        <input
                          id={`expiry-${field.id}`}
                          type="date"
                          {...register(`lines.${index}.expiry`)}
                          className={cn('w-full min-h-[44px] px-3 text-[15px] border rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10', fieldBorder(!!lineErrors?.expiry, 'border-[#cbd2dc]'))}
                        />
                        <FieldError>{lineErrors?.expiry?.message}</FieldError>
                      </div>

                      {/* ── Derived + delete ── */}
                      <div className="flex items-stretch gap-2 pt-1 border-t border-[#e2e6ec]">
                        {/* Stacked derived values — full width, no truncation */}
                        <div className="flex-1 rounded-[8px] bg-[#f7f8fa] border border-dashed border-[#e2e6ec] divide-y divide-[#e2e6ec] overflow-hidden">
                          <div className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                            <span className="text-[#5a6675]">Harga jual</span>
                            <strong className="tabular-nums text-[#182230]">{rupiah(sellPrice)}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                            <span className="text-[#5a6675]">Subtotal HPP</span>
                            <strong className="tabular-nums text-[#182230]">{rupiah(lineCost)}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          className="flex-none w-9 self-center flex items-center justify-center text-[#a52b22] hover:bg-[#fbe8e5] rounded-[8px] cursor-pointer transition-colors h-9"
                          aria-label={`Hapus ${meta?.name ?? 'baris'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden xl:grid gap-4 content-start">
          <SidebarContent />
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={fields.length === 0 || incompleteCount > 0}
            className="min-h-[44px] w-full px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
          >
            Simpan penerimaan
          </button>
        </aside>
      </div>

      {/* ── Mobile sticky bottom bar ─────────────────────────────────────────── */}
      <div className="min-[900px]:hidden fixed bottom-0 inset-x-0 z-30">
        {showMobileSummary && (
          <div className="bg-white border-t border-[#e2e6ec] max-h-[60vh] overflow-y-auto">
            <div className="p-4 grid gap-4">
              <SidebarContent />
            </div>
          </div>
        )}
        <div className="bg-white border-t border-[#e2e6ec] px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileSummary(v => !v)}
            className="flex-1 flex items-center justify-between gap-2 min-h-[44px] px-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa] text-left"
            aria-expanded={showMobileSummary}
            aria-label="Ringkasan biaya"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ReceiptText className="w-4 h-4 flex-none text-[#5a6675]" />
              <div className="min-w-0">
                <p className="m-0 text-xs text-[#5a6675]">{fields.length} baris · {totalUnits} unit</p>
                <p className="m-0 text-[13px] font-semibold tabular-nums text-[#182230]">
                  {rupiah(totalCost)}
                  {incompleteCount > 0 && <span className="ml-2 text-xs font-normal text-[#a52b22]">{incompleteCount} belum lengkap</span>}
                </p>
              </div>
            </div>
            {showMobileSummary
              ? <ChevronDown className="w-4 h-4 flex-none text-[#5a6675]" />
              : <ChevronUp   className="w-4 h-4 flex-none text-[#5a6675]" />
            }
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={fields.length === 0 || incompleteCount > 0}
            className="flex-none min-h-[44px] px-5 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* ── Save confirmation dialog ─────────────────────────────────────────── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="w-[min(520px,92vw)] max-w-none gap-0 p-0 bg-white border border-[#e2e6ec] rounded-[14px] shadow-none">
          <div className="p-5 grid gap-3">
            <DialogTitle className="m-0 text-lg font-bold">Penerimaan tersimpan ke antrean stok</DialogTitle>
            <DialogDescription className="m-0 text-[13px] text-[#5a6675]">
              Dokumen <strong>GR-2026-0418</strong> disimpan lokal dan dikirim ke cloud saat koneksi tersedia.
            </DialogDescription>
            <ul className="grid gap-2 list-none m-0 p-0 text-[13px]">
              {[
                { label: 'Baris barang',   value: `${fields.length} SKU` },
                { label: 'Total unit',     value: `${totalUnits} unit` },
                { label: 'Total HPP masuk', value: rupiah(totalCost) },
              ].map(({ label, value }) => (
                <li key={label} className="flex items-baseline justify-between gap-2 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">{label}</span>
                  <strong className="text-[#182230] tabular-nums">{value}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-[#e2e6ec] bg-[#f7f8fa]">
            <button
              type="button"
              onClick={() => setShowSaveDialog(false)}
              className="min-h-[42px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#a52b22] cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Menyimpan…' : 'Konfirmasi simpan'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
