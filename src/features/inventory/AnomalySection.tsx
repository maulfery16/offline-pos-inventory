'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { getAuthHeaders } from '@/core/auth/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';

// Requirement 7.1 — shape of an anomaly entry from GET /api/inventory/anomalies
interface AnomalyEntry {
  id: string;
  productName: string;
  sku: string;
  batchNumber: string;
  currentQty: number;
  flaggedAt: string; // ISO date string
}

interface AnomaliSectionProps {
  role: string;
}

// Formats ISO date to locale date string
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// Requirement 7.7 — cashier never sees this section
export default function AnomalySection({ role }: AnomaliSectionProps) {
  if (role === 'cashier') return null;

  return <AnomalySectionInner />;
}

function AnomalySectionInner() {
  // Requirement 7.1 — fetch anomalies on mount
  const [anomalies, setAnomalies] = useState<AnomalyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);

  // Resolve dialog state
  const [resolveTarget, setResolveTarget] = useState<AnomalyEntry | null>(null);
  const [correctedQty, setCorrectedQty] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnomalies = useCallback(async () => {
    setIsLoading(true);
    setOfflineError(false);
    try {
      const res = await fetch('/api/inventory/anomalies', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('fetch failed');
      const data: AnomalyEntry[] = await res.json();
      setAnomalies(data);
    } catch {
      // Requirement 7.5 — offline / network error: show inline message, no dialog
      setOfflineError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  // Open resolve dialog
  const openResolve = (entry: AnomalyEntry) => {
    setResolveTarget(entry);
    setCorrectedQty(entry.currentQty < 0 ? 0 : entry.currentQty);
  };

  const closeResolve = () => {
    if (isSubmitting) return;
    setResolveTarget(null);
    setCorrectedQty('');
  };

  // Requirement 7.4 — POST resolve, then remove from list
  const handleResolveSubmit = async () => {
    if (!resolveTarget || correctedQty === '') return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/anomalies/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ batchId: resolveTarget.id, correctedQty: Number(correctedQty) }),
      });

      if (!res.ok) {
        // Requirement 7.6 — POST failure: toast error, keep entry
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Gagal menyelesaikan anomali. Coba lagi.');
        return;
      }

      // Requirement 7.4 — remove resolved entry from local state
      setAnomalies((prev) => prev.filter((a) => a.id !== resolveTarget.id));
      toast.success(`Anomali batch ${resolveTarget.batchNumber} berhasil diselesaikan.`);
      setResolveTarget(null);
      setCorrectedQty('');
    } catch {
      // Requirement 7.6 — network failure: toast error, keep entry
      toast.error('Koneksi gagal. Anomali belum diselesaikan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-[#f1f5f9]" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-[#f1f5f9]" />
          ))}
        </div>
      </div>
    );
  }

  // Requirement 7.5 — offline message (no dialog)
  if (offlineError) {
    return (
      <div className="rounded-[12px] border border-[#fde8c3] bg-[#fdf6ec] p-5">
        <div className="flex items-center gap-2 text-[#92400e]">
          <AlertTriangle className="h-4 w-4 flex-none" />
          <span className="text-sm font-medium">Anomali tidak tersedia secara offline</span>
        </div>
      </div>
    );
  }

  // Requirement 7.2 — empty state
  if (anomalies.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-5">
        <p className="text-sm font-semibold text-[#101828]">Anomali Stok</p>
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-[#64748b]">
          <CheckCircle className="h-6 w-6 text-[#22c55e]" />
          <span className="text-sm">Tidak ada anomali stok yang terdeteksi.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Requirement 7.3 — anomaly table */}
      <div className="rounded-[12px] border border-[#fde8c3] bg-white">
        <div className="flex items-center gap-2 border-b border-[#fde8c3] px-5 py-4">
          <AlertTriangle className="h-4 w-4 flex-none text-[#d97706]" />
          <p className="text-sm font-semibold text-[#101828]">
            Anomali Stok
          </p>
          <span className="ml-auto rounded-full bg-[#fde8c3] px-2.5 py-0.5 text-xs font-medium text-[#92400e]">
            {anomalies.length} item
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[#64748b]">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#64748b]">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#64748b]">Batch</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#64748b]">Qty Saat Ini</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#64748b]">Ditandai</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[#64748b]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {anomalies.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#fafafa]">
                  <td className="px-5 py-3 font-medium text-[#101828]">{entry.productName}</td>
                  <td className="px-4 py-3 font-mono text-[#475569]">{entry.sku}</td>
                  <td className="px-4 py-3 text-[#475569]">{entry.batchNumber}</td>
                  {/* Requirement 7.3 — highlight red if qty negative */}
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-semibold tabular-nums',
                      entry.currentQty < 0 ? 'text-[#dc2626]' : 'text-[#101828]'
                    )}
                  >
                    {entry.currentQty.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-[#64748b]">{formatDate(entry.flaggedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {/* Requirement 7.4 — resolve button per row */}
                    <button
                      type="button"
                      onClick={() => openResolve(entry)}
                      className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#0f6d5f] transition-colors hover:border-[#0f6d5f] hover:bg-[#f0faf8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] focus-visible:ring-offset-1"
                    >
                      Selesaikan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirement 7.4 — resolve dialog with corrected qty input */}
      <Dialog open={!!resolveTarget} onOpenChange={(open) => !open && closeResolve()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selesaikan Anomali</DialogTitle>
            <DialogDescription>
              Masukkan jumlah stok yang benar untuk batch{' '}
              <span className="font-semibold text-[#101828]">
                {resolveTarget?.batchNumber}
              </span>{' '}
              — {resolveTarget?.productName}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label
              htmlFor="corrected-qty"
              className="text-sm font-medium text-[#101828]"
            >
              Qty yang Benar
            </label>
            <input
              id="corrected-qty"
              type="number"
              step="1"
              value={correctedQty}
              onChange={(e) =>
                setCorrectedQty(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="h-10 w-full rounded-[8px] border border-[#e2e8f0] px-3 text-sm focus:border-[#0f6d5f] focus:outline-none focus:ring-2 focus:ring-[#0f6d5f]/20"
              placeholder="Contoh: 12"
              disabled={isSubmitting}
              autoFocus
            />
            {resolveTarget && resolveTarget.currentQty < 0 && (
              <p className="text-xs text-[#dc2626]">
                Qty saat ini negatif ({resolveTarget.currentQty}). Nilai 0 atau lebih disarankan.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={closeResolve}
              disabled={isSubmitting}
              className="flex-1 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResolveSubmit}
              disabled={isSubmitting || correctedQty === ''}
              className="flex-1 rounded-[8px] bg-[#0f6d5f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a5549] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] focus-visible:ring-offset-1"
            >
              {isSubmitting ? 'Menyimpan…' : 'Simpan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
