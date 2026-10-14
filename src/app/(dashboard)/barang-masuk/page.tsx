'use client';

import { useState, useCallback } from 'react';
import { ScanBarcode, Plus, Info, CircleAlert, TriangleAlert, CircleCheck, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ReceivingLine {
  id: string;
  sku: string;
  name: string;
  unit: string;
  perishable: boolean;
  qty: number;
  cost: number;
  margin: number;
  batch: string;
  expiry: string;
}

const catalog: Record<string, { name: string; unit: string; perishable: boolean; cost: number; margin: number }> = {
  '8991002101147': { name: 'Indomie Goreng 85g', unit: 'pcs', perishable: true, cost: 2900, margin: 20 },
  '8991234567890': { name: 'Susu Ultra 250ml', unit: 'pcs', perishable: true, cost: 5900, margin: 25 },
  '8992761123456': { name: 'Aqua 600ml', unit: 'pcs', perishable: false, cost: 3100, margin: 22 },
  '8998765432109': { name: 'Roti Tawar Sari Roti', unit: 'pcs', perishable: true, cost: 14000, margin: 28 },
  '8991112223334': { name: 'Teh Pucuk 350ml', unit: 'pcs', perishable: false, cost: 3400, margin: 30 },
  '8995000112233': { name: 'Kopi Kapal Api 165g', unit: 'pack', perishable: false, cost: 9800, margin: 27 },
};

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

const TODAY = new Date('2026-04-18');

export default function BarangMasukPage() {
  const [lines, setLines] = useState<ReceivingLine[]>([
    { id: '1', sku: '8991002101147', name: 'Indomie Goreng 85g', unit: 'pcs', perishable: true, qty: 24, cost: 2900, margin: 20, batch: 'B2321', expiry: '2026-06-19' },
    { id: '2', sku: '8991234567890', name: 'Susu Ultra 250ml', unit: 'pcs', perishable: true, qty: 12, cost: 5900, margin: 25, batch: 'B2322', expiry: '2026-05-02' },
    { id: '3', sku: '8992761123456', name: 'Aqua 600ml', unit: 'pcs', perishable: false, qty: 36, cost: 3100, margin: 22, batch: 'B2323', expiry: '' },
    { id: '4', sku: '8998765432109', name: 'Roti Tawar Sari Roti', unit: 'pcs', perishable: true, qty: 12, cost: 14000, margin: 28, batch: 'B2324', expiry: '' },
  ]);
  const [scanInput, setScanInput] = useState('');
  const [rowSeq, setRowSeq] = useState(5);
  const [supplier, setSupplier] = useState('PT Sumber Pangan Jaya');
  const [invoice, setInvoice] = useState('INV/SPJ/0418');
  const [date, setDate] = useState('2026-04-18');
  const [warehouse, setWarehouse] = useState('Gudang Utama — Kebayoran');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const updateLine = useCallback((id: string, field: keyof ReceivingLine, value: string | number) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const sku = scanInput.trim();
    const item = catalog[sku];
    if (!item) return;

    const existing = lines.find((line) => line.sku === sku);
    if (existing) {
      updateLine(existing.id, 'qty', existing.qty + 1);
    } else {
      const newLine: ReceivingLine = {
        id: String(rowSeq),
        sku,
        name: item.name,
        unit: item.unit,
        perishable: item.perishable,
        qty: 1,
        cost: item.cost,
        margin: item.margin,
        batch: `B${2320 + rowSeq}`,
        expiry: '',
      };
      setLines((prev) => [...prev, newLine]);
      setRowSeq((prev) => prev + 1);
    }
    setScanInput('');
  };

  const totalUnits = lines.reduce((sum, line) => sum + line.qty, 0);
  const totalCost = lines.reduce((sum, line) => sum + line.qty * line.cost, 0);
  const totalSales = lines.reduce((sum, line) => sum + line.qty * line.cost * (1 + line.margin / 100), 0);
  const totalProfit = totalSales - totalCost;
  const avgMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1).replace('.', ',') : '0,0';

  const getLineStatus = (line: ReceivingLine) => {
    const missing = [];
    if (line.qty <= 0) missing.push('qty');
    if (line.cost <= 0) missing.push('HPP');
    if (!line.batch.trim()) missing.push('nomor batch');
    if (line.perishable && !line.expiry) missing.push('kedaluwarsa');

    const expired = line.expiry ? new Date(line.expiry + 'T00:00:00') <= TODAY : false;

    if (missing.length > 0) {
      return { level: 'danger', text: `Belum lengkap: ${missing.join(', ')}` };
    }
    if (expired) {
      return { level: 'danger', text: 'Kedaluwarsa — perbarui tanggal' };
    }
    if (line.perishable) {
      return { level: 'warn', text: 'Perishable · FEFO' };
    }
    return { level: 'ok', text: 'Siap disimpan' };
  };

  const issues = [];
  if (lines.length === 0) issues.push({ level: 'warn', text: 'Belum ada baris penerimaan. Pindai SKU untuk menambah baris.' });
  const incomplete = lines.filter((line) => getLineStatus(line).level === 'danger');
  if (incomplete.length > 0) issues.push({ level: 'danger', text: `${incomplete.length} baris belum lengkap. Lengkapi batch, kedaluwarsa, qty dan HPP sebelum menyimpan.` });
  const soonExpiring = lines.filter((line) => {
    if (!line.expiry) return false;
    const days = (new Date(line.expiry + 'T00:00:00').getTime() - TODAY.getTime()) / 86400000;
    return days >= 0 && days <= 30;
  });
  if (soonExpiring.length > 0) issues.push({ level: 'warn', text: `${soonExpiring.length} batch kedaluwarsa ≤30 hari. Pertimbangkan menurunkan margin agar cepat terjual.` });
  if (issues.length === 0 && lines.length > 0) issues.push({ level: 'ok', text: 'Semua baris lengkap dan siap disimpan.' });

  const handleSave = () => {
    const incompleteLines = lines.filter((line) => getLineStatus(line).level === 'danger');
    if (incompleteLines.length > 0) return;
    if (lines.length === 0) return;
    setShowSaveDialog(true);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(280px,320px)] gap-6 items-start">
      {/* Stats Row */}
      <section className="col-span-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
          <span className="text-xs text-[#5a6675]">Nomor penerimaan</span>
          <p className="m-0 mt-1 text-lg font-bold tabular-nums">GR-2026-0418</p>
          <span className="text-xs text-[#5a6675]">Draft · belum diposting ke stok</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
          <span className="text-xs text-[#5a6675]">Supplier</span>
          <p className="m-0 mt-1 text-[15px] font-bold truncate">PT Sumber Pangan Jaya</p>
          <span className="text-xs text-[#5a6675]">Kontrak harga berlaku s/d 30 Jun</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
          <span className="text-xs text-[#5a6675]">Baris & unit</span>
          <p className="m-0 mt-1 text-lg font-bold tabular-nums">{lines.length} baris</p>
          <span className="text-xs text-[#5a6675]">{totalUnits} unit diterima</span>
        </div>
        <div className="p-4 border border-[#e2e6ec] rounded-[10px] bg-white">
          <span className="text-xs text-[#5a6675]">Total HPP</span>
          <p className="m-0 mt-1 text-lg font-bold tabular-nums">{rupiah(totalCost)}</p>
          <span className="text-xs text-[#5a6675]">Menjadi dasar COGS saat terjual FEFO</span>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Document Details */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Detail dokumen</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">Batch & kedaluwarsa wajib untuk perishable</span>
          </div>
          <div className="p-4 lg:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="supplier" className="text-xs font-medium text-[#5a6675]">Supplier</label>
                <select
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f]"
                >
                  <option>PT Sumber Pangan Jaya</option>
                  <option>CV Anugerah Snack</option>
                  <option>PT Dairy Prima Nusantara</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="invoice" className="text-xs font-medium text-[#5a6675]">Nomor faktur supplier</label>
                <input
                  id="invoice"
                  type="text"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  className="min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="date" className="text-xs font-medium text-[#5a6675]">Tanggal terima</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="warehouse" className="text-xs font-medium text-[#5a6675]">Gudang tujuan</label>
                <select
                  id="warehouse"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] bg-white focus:outline-none focus:border-[#0f6d5f]"
                >
                  <option>Gudang Utama — Kebayoran</option>
                  <option>Gudang Cabang Bintaro</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Receiving Lines */}
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Baris penerimaan</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('scan-input')?.focus()}
                className="flex items-center gap-2 min-h-[44px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                <ScanBarcode className="w-4 h-4" />
                Pindai barcode
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('scan-input')?.focus()}
                className="flex items-center gap-2 min-h-[44px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Baris manual
              </button>
            </div>
          </div>
          <div className="p-4 lg:p-5 grid gap-4">
            <div className="max-w-[460px] grid gap-1.5">
              <label htmlFor="scan-input" className="text-xs font-medium text-[#5a6675]">Kolom pindai SKU</label>
              <input
                id="scan-input"
                type="search"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Pindai atau ketik SKU, lalu Enter…"
                className="min-h-[44px] px-3 text-[15px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
              />
              <p className="text-xs text-[#5a6675]">Barcode contoh: 8991002101147, 8991234567890, 8992761123456.</p>
            </div>

            {/* Lines */}
            <ul className="grid gap-3 list-none m-0 p-0">
              {lines.map((line) => {
                const status = getLineStatus(line);
                const sellPrice = line.cost * (1 + line.margin / 100);
                const lineCost = line.qty * line.cost;

                return (
                  <li
                    key={line.id}
                    className={cn(
                      'grid gap-3 p-4 border rounded-[10px] bg-white',
                      status.level === 'danger' ? 'border-[#e7b7b1] bg-[#fff9f8]' : 'border-[#e2e6ec]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="m-0 text-[15px] font-semibold">{line.name}</p>
                        <p className="m-0 mt-0.5 text-xs text-[#5a6675] font-mono">{line.sku} · {line.unit}</p>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        status.level === 'danger' ? 'bg-[#fbe8e5] text-[#a52b22]' :
                        status.level === 'warn' ? 'bg-[#fdf0da] text-[#8a5300]' :
                        'bg-[#e3f4e9] text-[#136b3f]'
                      )}>
                        {status.text}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
                      <div className="grid gap-1">
                        <span className="text-xs text-[#5a6675]">Qty</span>
                        <input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value) || 0)}
                          className="min-h-[42px] px-2.5 text-[13px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                        />
                      </div>
                      <div className="grid gap-1">
                        <span className="text-xs text-[#5a6675]">HPP / unit</span>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={line.cost}
                          onChange={(e) => updateLine(line.id, 'cost', Number(e.target.value) || 0)}
                          className="min-h-[42px] px-2.5 text-[13px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                        />
                      </div>
                      <div className="grid gap-1">
                        <span className="text-xs text-[#5a6675]">Margin %</span>
                        <input
                          type="number"
                          min={0}
                          value={line.margin}
                          onChange={(e) => updateLine(line.id, 'margin', Number(e.target.value) || 0)}
                          className="min-h-[42px] px-2.5 text-[13px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                        />
                      </div>
                      <div className="grid gap-1">
                        <span className="text-xs text-[#5a6675]">No. batch</span>
                        <input
                          type="text"
                          value={line.batch}
                          onChange={(e) => updateLine(line.id, 'batch', e.target.value)}
                          className="min-h-[42px] px-2.5 text-[13px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                        />
                      </div>
                      <div className="grid gap-1">
                        <span className="text-xs text-[#5a6675]">Kedaluwarsa{line.perishable ? ' (wajib)' : ''}</span>
                        <input
                          type="date"
                          value={line.expiry}
                          onChange={(e) => updateLine(line.id, 'expiry', e.target.value)}
                          className="min-h-[42px] px-2.5 text-[13px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center justify-between min-h-[42px] px-2.5 border border-dashed border-[#cbd2dc] rounded-[10px] bg-[#f7f8fa] text-[13px] min-w-[140px]">
                        <span>Harga jual</span>
                        <strong className="tabular-nums">{rupiah(sellPrice)}</strong>
                      </div>
                      <div className="flex items-center justify-between min-h-[42px] px-2.5 border border-dashed border-[#cbd2dc] rounded-[10px] bg-[#f7f8fa] text-[13px] min-w-[140px]">
                        <span>Subtotal HPP</span>
                        <strong className="tabular-nums">{rupiah(lineCost)}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="px-2 py-1.5 text-xs font-medium text-[#a52b22] hover:bg-[#fbe8e5] rounded-[10px] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Hapus baris
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="grid gap-4 content-start">
        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Ringkasan biaya</h2>
          </div>
          <div className="p-4 lg:p-5">
            <ul className="grid gap-2 list-none m-0 p-0 text-sm">
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Total unit</span>
                <strong className="text-[#182230] tabular-nums">{totalUnits}</strong>
              </li>
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Total HPP</span>
                <strong className="text-[#182230] tabular-nums">{rupiah(totalCost)}</strong>
              </li>
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Estimasi penjualan</span>
                <strong className="text-[#182230] tabular-nums">{rupiah(totalSales)}</strong>
              </li>
              <li className="flex items-baseline justify-between text-[#5a6675]">
                <span>Estimasi laba kotor</span>
                <strong className="text-[#182230] tabular-nums">{rupiah(totalProfit)}</strong>
              </li>
              <li className="pt-3 border-t border-[#e2e6ec] flex items-baseline justify-between text-[15px] font-bold text-[#182230]">
                <span>Margin rata-rata</span>
                <strong className="text-lg">{avgMargin}%</strong>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Pemeriksaan</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">{issues.length} catatan</span>
          </div>
          <div className="p-4 lg:p-5">
            <ul className="grid gap-2 list-none m-0 p-0">
              {issues.map((issue, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex gap-2 p-3 rounded-[10px] text-xs',
                    issue.level === 'danger' ? 'bg-[#fbe8e5] text-[#a52b22]' :
                    issue.level === 'warn' ? 'bg-[#fdf0da] text-[#8a5300]' :
                    'bg-[#e3f4e9] text-[#136b3f]'
                  )}
                >
                  {issue.level === 'danger' ? <CircleAlert className="w-4 h-4 flex-none" /> :
                   issue.level === 'warn' ? <TriangleAlert className="w-4 h-4 flex-none" /> :
                   <CircleCheck className="w-4 h-4 flex-none" />}
                  <span>{issue.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="p-4 lg:p-5">
            <div className="flex gap-2 p-3 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
              <Info className="w-4 h-4 flex-none" />
              <span>Menyimpan dokumen menambah stok batch dan memakai HPP ini sebagai dasar COGS saat barang terjual memakai urutan FEFO.</span>
            </div>
          </div>
        </section>
        <button
          type="button"
          onClick={handleSave}
          disabled={lines.length === 0 || incomplete.length > 0}
          className="min-h-[44px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed w-full"
        >
          Simpan penerimaan
        </button>
      </aside>

      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div className="w-[min(520px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <h2 className="m-0 text-lg font-bold">Penerimaan tersimpan ke antrean stok</h2>
              <p className="m-0 text-[13px] text-[#5a6675]">
                Dokumen <strong>GR-2026-0418</strong> disimpan lokal dan dikirim ke cloud saat koneksi tersedia.
              </p>
              <ul className="grid gap-2 list-none m-0 p-0 text-[13px]">
                <li className="flex items-baseline justify-between p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">Baris barang</span>
                  <strong className="text-[#182230] tabular-nums">{lines.length} SKU</strong>
                </li>
                <li className="flex items-baseline justify-between p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">Total unit</span>
                  <strong className="text-[#182230] tabular-nums">{totalUnits} unit</strong>
                </li>
                <li className="flex items-baseline justify-between p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                  <span className="text-[#5a6675]">Total HPP masuk</span>
                  <strong className="text-[#182230] tabular-nums">{rupiah(totalCost)}</strong>
                </li>
              </ul>
            </div>
            <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => setShowSaveDialog(false)}
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
