'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PlusCircle, UserX, Loader2, ChevronUp, KeyRound, Users } from 'lucide-react';
import bcrypt from 'bcryptjs';
import type { TabProps } from '../page';
import { getAuthHeaders } from '@/core/auth/client';
import { cashierAddSchema, type CashierAddForm } from '@/core/auth/schemas';
import { FieldError } from '@/shared/components/forms/FieldError';
import { fieldBorder } from '@/shared/components/forms/fieldBorder';
import { cn } from '@/shared/utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Cashier {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CashierTab({ tenantId, branchId }: TabProps) {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CashierAddForm>({
    resolver: zodResolver(cashierAddSchema),
    defaultValues: { name: '', pin: '' },
  });

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
  const handleAdd = handleSubmit(async (data: CashierAddForm) => {
    setSubmitting(true);
    try {
      const hashedPin = await bcrypt.hash(data.pin, 10);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: data.name.trim(), hashedPin, branchId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Gagal menambah kasir');
      }
      toast.success(`Kasir "${data.name.trim()}" berhasil ditambahkan`);
      reset();
      setShowForm(false);
      void fetchCashiers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah kasir');
    } finally {
      setSubmitting(false);
    }
  });

  // ── Deactivate ────────────────────────────────────────────────────────────
  async function handleDeactivate(cashier: Cashier) {
    // NOTE: window.confirm removed — UI handles inline confirmation
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

  // ── Reset PIN (stub) ──────────────────────────────────────────────────────
  function handleResetPin(cashier: Cashier) {
    toast.info(`Reset PIN untuk "${cashier.name}" — fitur segera tersedia.`);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-[14px] border border-[#e2e6ec] bg-white overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-[#e2e6ec] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#182230]">Daftar Kasir</h2>
          <p className="mt-0.5 text-[12px] text-[#5a6675]">
            Kelola akun kasir dan PIN untuk cabang ini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); reset(); setConfirmId(null); }}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] focus-visible:ring-offset-2',
            showForm
              ? 'bg-[#e2f2ee] text-[#0f6d5f]'
              : 'bg-[#0f6d5f] text-white hover:bg-[#0a5a4e]',
          )}
        >
          {showForm ? (
            <><ChevronUp className="h-3.5 w-3.5" /><span>Tutup</span></>
          ) : (
            <><PlusCircle className="h-3.5 w-3.5" /><span>Tambah Kasir</span></>
          )}
        </button>
      </div>

      {/* ── Add form ────────────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="relative border-b border-[#e2e6ec] bg-[#f7f9fb] px-5 py-4"
        >
          {/* Left accent stripe */}
          <div className="absolute inset-y-0 left-0 w-[3px] bg-[#0f6d5f] rounded-l-[14px]" aria-hidden="true" />
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">
            Kasir Baru
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(200px,280px)_160px_auto] gap-3 items-end">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cashier-name" className="text-[12px] font-medium text-[#5a6675]">
                Nama lengkap <span className="text-[#a52b22]" aria-hidden="true">*</span>
              </label>
              <input
                id="cashier-name"
                type="text"
                placeholder="Contoh: Budi Santoso"
                {...register('name')}
                className={cn(
                  'h-10 w-full rounded-[10px] border bg-white px-3 text-[13px] text-[#182230] placeholder:text-[#b0b8c4] focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/20',
                  fieldBorder(!!errors.name, 'border-[#e2e6ec]'),
                )}
                disabled={submitting}
                autoComplete="off"
              />
              <FieldError>{errors.name?.message}</FieldError>
            </div>
            {/* PIN */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cashier-pin" className="text-[12px] font-medium text-[#5a6675]">
                PIN (4–6 digit) <span className="text-[#a52b22]" aria-hidden="true">*</span>
              </label>
              <input
                id="cashier-pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                {...register('pin')}
                onChange={(e) =>
                  setValue('pin', e.target.value.replace(/\D/g, ''), { shouldValidate: true })
                }
                className={cn(
                  'h-10 w-full rounded-[10px] border bg-white px-3 text-[13px] text-[#182230] placeholder:text-[#b0b8c4] focus:outline-none focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/20',
                  fieldBorder(!!errors.pin, 'border-[#e2e6ec]'),
                )}
                disabled={submitting}
                autoComplete="new-password"
              />
              <FieldError>{errors.pin?.message}</FieldError>
            </div>
            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#0f6d5f] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#0a5a4e] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] focus-visible:ring-offset-2"
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

      {/* ── Body states ─────────────────────────────────────────────────────── */}

      {/* Loading skeleton */}
      {loading ? (
        <div className="divide-y divide-[#e2e6ec]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#eaecf0] flex-none" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded bg-[#eaecf0]" style={{ maxWidth: 160 }} />
                <div className="h-2.5 rounded bg-[#eaecf0]" style={{ maxWidth: 80 }} />
              </div>
              <div className="w-14 h-5 rounded-full bg-[#eaecf0]" />
            </div>
          ))}
        </div>

      ) : cashiers.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f4f8] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#8a94a3]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#182230]">Belum ada kasir</p>
            <p className="mt-1 text-[12px] text-[#8a94a3] max-w-[260px] mx-auto leading-relaxed">
              Tambahkan akun kasir agar staf bisa masuk ke modul POS.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setConfirmId(null); }}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0f6d5f] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a5a4e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] focus-visible:ring-offset-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Tambah Kasir Pertama
          </button>
        </div>

      ) : (
        <>
          {/* ── Desktop table ─────────────────────────────────────────────── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#e2e6ec] bg-[#f7f9fb]">
                  <th scope="col" className="pl-5 pr-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">
                    Kasir
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3] w-28">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3] w-36">
                    Terdaftar
                  </th>
                  <th scope="col" className="pl-3 pr-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3] w-24">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e6ec]">
                {cashiers.map((cashier) => (
                  <React.Fragment key={cashier.id}>
                    {/* ── Data row ── */}
                    <tr
                      className={cn(
                        'transition-colors',
                        confirmId === cashier.id
                          ? 'bg-[#fff8f7]'
                          : 'hover:bg-[#f7f9fb]',
                      )}
                    >
                      {/* Avatar + name */}
                      <td className="pl-5 pr-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex-none w-8 h-8 rounded-full bg-[#e2f2ee] text-[#0f6d5f] text-[11px] font-bold flex items-center justify-center select-none"
                            aria-hidden="true"
                          >
                            {getInitials(cashier.name)}
                          </span>
                          <span className="text-[13px] font-medium text-[#182230]">
                            {cashier.name}
                          </span>
                        </div>
                      </td>
                      {/* Status badge */}
                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                            cashier.isActive
                              ? 'bg-[#e3f4e9] text-[#136b3f]'
                              : 'bg-[#f0f2f5] text-[#8a94a3]',
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full mr-1.5',
                              cashier.isActive ? 'bg-[#136b3f]' : 'bg-[#8a94a3]',
                            )}
                            aria-hidden="true"
                          />
                          {cashier.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      {/* Registered date */}
                      <td className="px-3 py-3.5 text-[12px] tabular-nums text-[#5a6675]">
                        {cashier.createdAt
                          ? new Date(cashier.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      {/* Action buttons */}
                      <td className="pl-3 pr-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {cashier.isActive && (
                            <>
                              <button
                                type="button"
                                title="Reset PIN"
                                onClick={() => handleResetPin(cashier)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] border border-[#e2e6ec] text-[#5a6675] transition-colors hover:bg-[#f0f4f8] hover:text-[#182230] hover:border-[#cbd2dc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f]"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span className="sr-only">Reset PIN {cashier.name}</span>
                              </button>
                              <button
                                type="button"
                                title={confirmId === cashier.id ? 'Batal' : 'Nonaktifkan'}
                                disabled={deactivating === cashier.id}
                                onClick={() =>
                                  setConfirmId((prev) =>
                                    prev === cashier.id ? null : cashier.id,
                                  )
                                }
                                className={cn(
                                  'inline-flex items-center justify-center w-8 h-8 rounded-[8px] border transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2',
                                  confirmId === cashier.id
                                    ? 'border-[#e8b4ae] bg-[#fbe8e5] text-[#a52b22] focus-visible:ring-[#a52b22]'
                                    : 'border-[#e2e6ec] text-[#a52b22] hover:bg-[#fbe8e5] hover:border-[#e8b4ae] focus-visible:ring-[#a52b22]',
                                )}
                              >
                                {deactivating === cashier.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                                <span className="sr-only">
                                  {confirmId === cashier.id ? 'Batal nonaktifkan' : 'Nonaktifkan'} {cashier.name}
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Inline confirmation row ── */}
                    {confirmId === cashier.id && (
                      <tr className="bg-[#fff8f7] border-b border-[#fdd9d3]">
                        <td colSpan={4} className="pl-5 pr-5 py-3">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-[13px] text-[#5a6675]">
                              Nonaktifkan{' '}
                              <span className="font-semibold text-[#182230]">
                                {cashier.name}
                              </span>
                              ? Kasir tidak bisa login setelah ini.
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#e2e6ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#5a6675] hover:bg-[#f7f9fb] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a94a3]"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={deactivating === cashier.id}
                                onClick={() => { void handleDeactivate(cashier); setConfirmId(null); }}
                                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#a52b22] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#8c2319] disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a52b22]"
                              >
                                {deactivating === cashier.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserX className="h-3 w-3" />
                                )}
                                Ya, Nonaktifkan
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {/* Table footer count */}
            <div className="border-t border-[#e2e6ec] px-5 py-3 bg-[#f7f9fb]">
              <p className="text-[12px] text-[#8a94a3]">
                {cashiers.filter((c) => c.isActive).length} aktif
                {cashiers.some((c) => !c.isActive) && (
                  <> · {cashiers.filter((c) => !c.isActive).length} nonaktif</>
                )}
                {' '}· {cashiers.length} total
              </p>
            </div>
          </div>

          {/* ── Mobile card list ────────────────────────────────────────────── */}
          <ul className="sm:hidden list-none m-0 p-0 divide-y divide-[#e2e6ec]">
            {cashiers.map((cashier) => (
              <li key={cashier.id} className="px-4 py-4">
                {/* Identity row */}
                <div className="flex items-center gap-3">
                  <span
                    className="flex-none w-9 h-9 rounded-full bg-[#e2f2ee] text-[#0f6d5f] text-[11px] font-bold flex items-center justify-center select-none"
                    aria-hidden="true"
                  >
                    {getInitials(cashier.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[14px] font-medium text-[#182230] truncate">
                      {cashier.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                          cashier.isActive
                            ? 'bg-[#e3f4e9] text-[#136b3f]'
                            : 'bg-[#f0f2f5] text-[#8a94a3]',
                        )}
                      >
                        {cashier.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {cashier.createdAt && (
                        <span className="text-[11px] text-[#8a94a3] tabular-nums">
                          {new Date(cashier.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action row — only for active cashiers */}
                {cashier.isActive && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetPin(cashier)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#e2e6ec] bg-white px-3 py-2 text-[12px] font-medium text-[#5a6675] hover:bg-[#f7f9fb] hover:text-[#182230] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] min-h-[40px]"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset PIN
                    </button>
                    <button
                      type="button"
                      disabled={deactivating === cashier.id}
                      onClick={() =>
                        setConfirmId((prev) =>
                          prev === cashier.id ? null : cashier.id,
                        )
                      }
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12px] font-medium transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 min-h-[40px]',
                        confirmId === cashier.id
                          ? 'border-[#e8b4ae] bg-[#fbe8e5] text-[#a52b22] focus-visible:ring-[#a52b22]'
                          : 'border-[#e2e6ec] bg-white text-[#a52b22] hover:bg-[#fbe8e5] hover:border-[#e8b4ae] focus-visible:ring-[#a52b22]',
                      )}
                    >
                      {deactivating === cashier.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserX className="h-3.5 w-3.5" />
                      )}
                      Nonaktifkan
                    </button>
                  </div>
                )}

                {/* Mobile inline confirmation */}
                {confirmId === cashier.id && cashier.isActive && (
                  <div className="mt-3 rounded-[10px] border border-[#fdd9d3] bg-[#fff8f7] px-4 py-3">
                    <p className="text-[12px] text-[#5a6675] leading-relaxed">
                      Kasir ini tidak bisa login setelah dinonaktifkan. Lanjutkan?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="flex-1 inline-flex items-center justify-center rounded-[8px] border border-[#e2e6ec] bg-white px-3 py-2 text-[12px] font-medium text-[#5a6675] hover:bg-[#f7f9fb] transition-colors min-h-[36px]"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={deactivating === cashier.id}
                        onClick={() => { void handleDeactivate(cashier); setConfirmId(null); }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[#a52b22] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#8c2319] disabled:opacity-60 transition-colors min-h-[36px]"
                      >
                        {deactivating === cashier.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        Ya, Nonaktifkan
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile footer count */}
          <div className="sm:hidden border-t border-[#e2e6ec] px-4 py-3 bg-[#f7f9fb]">
            <p className="text-[12px] text-[#8a94a3]">
              {cashiers.filter((c) => c.isActive).length} aktif · {cashiers.length} total
            </p>
          </div>
        </>
      )}
    </div>
  );
}
