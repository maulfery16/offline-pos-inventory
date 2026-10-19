'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PlusCircle, UserX, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import bcrypt from 'bcryptjs';
import type { TabProps } from '../page';
import { getAuthHeaders } from '@/core/auth/client';
import { cn } from '@/shared/utils/cn';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/components/ui/table';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Cashier {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AddForm {
  name: string;
  pin: string;
}

const EMPTY_FORM: AddForm = { name: '', pin: '' };

// ── Component ─────────────────────────────────────────────────────────────────

export default function CashierTab({ tenantId, branchId }: TabProps) {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchCashiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users?role=kasir', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Gagal memuat daftar kasir');
      const json = await res.json();
      setCashiers((json.data ?? []) as Cashier[]);
    } catch {
      toast.error('Gagal memuat daftar kasir');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCashiers();
  }, [fetchCashiers]);

  // ── Suppress unused-var warning for tenantId (used via auth JWT, not body)
  void tenantId;

  // ── Add cashier ───────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedPin = form.pin.trim();

    if (!trimmedName) {
      toast.error('Nama kasir tidak boleh kosong');
      return;
    }
    if (!/^\d{4,6}$/.test(trimmedPin)) {
      toast.error('PIN harus berupa angka 4–6 digit');
      return;
    }

    setSubmitting(true);
    try {
      const hashedPin = await bcrypt.hash(trimmedPin, 10);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: trimmedName, hashedPin, branchId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Gagal menambah kasir');
      }

      toast.success(`Kasir "${trimmedName}" berhasil ditambahkan`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      void fetchCashiers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah kasir');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Deactivate ────────────────────────────────────────────────────────────

  async function handleDeactivate(cashier: Cashier) {
    if (!window.confirm(`Nonaktifkan kasir "${cashier.name}"?`)) return;

    setDeactivating(cashier.id);
    try {
      const res = await fetch(`/api/users/${cashier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isActive: false }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Gagal menonaktifkan kasir');
      }

      toast.success(`Kasir "${cashier.name}" telah dinonaktifkan`);
      setCashiers((prev) =>
        prev.map((c) => (c.id === cashier.id ? { ...c, isActive: false } : c)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menonaktifkan kasir');
    } finally {
      setDeactivating(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-[14px] border border-[#e2e6ec] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e6ec] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#182230]">Daftar Kasir</h2>
          <p className="mt-0.5 text-[12px] text-[#5a6675]">
            Kelola akun kasir untuk cabang ini.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setForm(EMPTY_FORM);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[13px] font-medium transition-colors',
            showForm
              ? 'bg-[#e8f4f2] text-[#0f6d5f]'
              : 'bg-[#0f6d5f] text-white hover:bg-[#0a5a4e]',
          )}
        >
          {showForm ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Tutup Form
            </>
          ) : (
            <>
              <PlusCircle className="h-3.5 w-3.5" />
              Tambah Kasir
            </>
          )}
        </button>
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <form
          onSubmit={(e) => void handleAdd(e)}
          className="border-b border-[#e2e6ec] bg-[#f8fafb] px-5 py-4"
        >
          <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-[#8a94a3]">
            Kasir Baru
          </p>
          <div className="flex flex-wrap items-end gap-3">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cashier-name"
                className="text-[12px] font-medium text-[#5a6675]"
              >
                Nama
              </label>
              <input
                id="cashier-name"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 w-52 rounded-[8px] border border-[#e2e6ec] bg-white px-3 text-[13px] text-[#182230] placeholder:text-[#b0b8c4] focus:outline-none focus:ring-2 focus:ring-[#0f6d5f]/30"
                disabled={submitting}
                autoComplete="off"
              />
            </div>

            {/* PIN */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cashier-pin"
                className="text-[12px] font-medium text-[#5a6675]"
              >
                PIN (4–6 digit)
              </label>
              <input
                id="cashier-pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={form.pin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))
                }
                className="h-9 w-32 rounded-[8px] border border-[#e2e6ec] bg-white px-3 text-[13px] text-[#182230] placeholder:text-[#b0b8c4] focus:outline-none focus:ring-2 focus:ring-[#0f6d5f]/30"
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#0f6d5f] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#0a5a4e] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlusCircle className="h-3.5 w-3.5" />
              )}
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-[#5a6675]">
          <Loader2 className="h-4 w-4 animate-spin text-[#0f6d5f]" />
          Memuat kasir…
        </div>
      ) : cashiers.length === 0 ? (
        <div className="py-14 text-center text-[13px] text-[#8a94a3]">
          Belum ada kasir terdaftar untuk cabang ini.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#e2e6ec] bg-[#f8fafb]">
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">
                Nama
              </TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">
                Cabang
              </TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">
                Status
              </TableHead>
              <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashiers.map((cashier) => (
              <TableRow
                key={cashier.id}
                className="border-b border-[#e2e6ec] last:border-0 hover:bg-[#f8fafb]"
              >
                <TableCell className="px-5 py-3 text-[13px] font-medium text-[#182230]">
                  {cashier.name}
                </TableCell>
                <TableCell className="px-5 py-3 text-[13px] text-[#5a6675]">
                  {/* User model has no branchId; shown from context */}
                  Cabang ini
                </TableCell>
                <TableCell className="px-5 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      cashier.isActive
                        ? 'bg-[#e8f4f2] text-[#0f6d5f]'
                        : 'bg-[#f5f6f8] text-[#8a94a3]',
                    )}
                  >
                    {cashier.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-3 text-right">
                  {cashier.isActive && (
                    <button
                      type="button"
                      disabled={deactivating === cashier.id}
                      onClick={() => void handleDeactivate(cashier)}
                      className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#e2e6ec] px-3 py-1.5 text-[12px] text-[#e53e3e] transition-colors hover:bg-[#fff5f5] disabled:opacity-50"
                    >
                      {deactivating === cashier.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      Nonaktifkan
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
