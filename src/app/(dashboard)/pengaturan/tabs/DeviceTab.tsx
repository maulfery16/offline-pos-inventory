'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import type { TabProps } from '../page';
import { getAuthHeaders } from '@/core/auth/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeviceRow {
  id: string;
  name: string;
  isRevoked: boolean;
  createdAt: string;
  branch: { name: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeviceTab({ tenantId }: TabProps) {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  // confirmId tracks which device row has the inline confirm open
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Fetch
  // ------------------------------------------------------------------

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices', {
        headers: {
          ...getAuthHeaders(),
          'x-tenant-id': tenantId,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? 'Gagal memuat perangkat');
      }

      const json = (await res.json()) as { devices: DeviceRow[] };
      setDevices(json.devices);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat perangkat');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  // ------------------------------------------------------------------
  // Revoke
  // ------------------------------------------------------------------

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'x-tenant-id': tenantId,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? 'Gagal mencabut akses');
      }

      // Mark device as revoked in local state (no refetch needed)
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isRevoked: true } : d))
      );
      setConfirmId(null);
      toast.success('Akses perangkat berhasil dicabut');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencabut akses');
    } finally {
      setRevoking(null);
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div
      className={cn(
        'rounded-[14px] border border-[#e2e6ec] bg-white',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e6ec] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#182230]">Perangkat Terdaftar</h2>
          <p className="mt-0.5 text-[12px] text-[#5a6675]">
            Kelola perangkat yang memiliki akses ke sistem ini.
          </p>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-[13px] text-[#5a6675]">Memuat perangkat…</span>
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <span className="text-2xl">📱</span>
          <span className="text-[13px] text-[#5a6675]">Belum ada perangkat terdaftar.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e6ec] bg-[#f8fafc]">
                <th className="px-5 py-3 text-left font-medium text-[#5a6675]">
                  Nama Perangkat
                </th>
                <th className="px-5 py-3 text-left font-medium text-[#5a6675]">Cabang</th>
                <th className="px-5 py-3 text-left font-medium text-[#5a6675]">Terdaftar</th>
                <th className="px-5 py-3 text-left font-medium text-[#5a6675]">Status</th>
                <th className="px-5 py-3 text-right font-medium text-[#5a6675]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e6ec]">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-[#f8fafc] transition-colors">
                  {/* Name */}
                  <td className="px-5 py-3 font-medium text-[#182230]">{device.name}</td>

                  {/* Branch */}
                  <td className="px-5 py-3 text-[#374151]">{device.branch.name}</td>

                  {/* Registered date */}
                  <td className="px-5 py-3 text-[#374151]">{formatDate(device.createdAt)}</td>

                  {/* Status badge */}
                  <td className="px-5 py-3">
                    {device.isRevoked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[11px] font-medium text-[#dc2626]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
                        Dicabut
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[11px] font-medium text-[#059669]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                        Aktif
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3 text-right">
                    {device.isRevoked ? (
                      <span className="text-[12px] text-[#8a94a3]">—</span>
                    ) : confirmId === device.id ? (
                      /* Inline confirm */
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[12px] text-[#374151]">Yakin?</span>
                        <button
                          onClick={() => void handleRevoke(device.id)}
                          disabled={revoking === device.id}
                          className={cn(
                            'rounded-md px-3 py-1 text-[12px] font-medium text-white',
                            'bg-[#dc2626] hover:bg-[#b91c1c] transition-colors',
                            'disabled:opacity-60 disabled:cursor-not-allowed'
                          )}
                        >
                          {revoking === device.id ? 'Mencabut…' : 'Cabut'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={revoking === device.id}
                          className="rounded-md border border-[#e2e6ec] px-3 py-1 text-[12px] font-medium text-[#374151] hover:bg-[#f8fafc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Batal
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmId(device.id)}
                        className={cn(
                          'rounded-md border border-[#e2e6ec] px-3 py-1.5 text-[12px] font-medium',
                          'text-[#dc2626] hover:border-[#dc2626] hover:bg-[#fee2e2] transition-colors'
                        )}
                      >
                        Cabut Akses
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      {!loading && devices.length > 0 && (
        <div className="border-t border-[#e2e6ec] px-5 py-3 text-[12px] text-[#8a94a3]">
          {devices.length} perangkat ·{' '}
          {devices.filter((d) => !d.isRevoked).length} aktif ·{' '}
          {devices.filter((d) => d.isRevoked).length} dicabut
        </div>
      )}
    </div>
  );
}
