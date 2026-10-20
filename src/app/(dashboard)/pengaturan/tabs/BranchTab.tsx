'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/core/auth/client';
import { cn } from '@/shared/utils';
import { branchFormSchema } from '@/features/tenants/schemas';
import { FieldError } from '@/shared/components/forms/FieldError';
import { fieldBorder } from '@/shared/components/forms/fieldBorder';
import type { TabProps } from '../types';
import { ChevronUp, Pencil, PlusCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  createdAt: string;
}

export default function BranchTab({ tenantId, branchId }: TabProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchFormSchema),
  });

  const editForm = useForm<{ name: string; address: string }>({
    defaultValues: { name: '', address: '' },
  });

  // Suppress unused-var lint — props are kept to match TabProps contract
  void tenantId;
  void branchId;

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    setLoading(true);
    try {
      const res = await fetch('/api/branches', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Gagal memuat data cabang');
      const json = await res.json();
      setBranches(json.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data cabang');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: data.name.trim(),
          code: data.code.trim(),
          address: data.address?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Gagal menambahkan cabang');
      }
      const newBranch: Branch = await res.json();
      setBranches((prev) => [newBranch, ...prev]);
      toast.success('Cabang berhasil ditambahkan');
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan cabang');
    } finally {
      setSubmitting(false);
    }
  });

  function handleCancel() {
    setShowForm(false);
    reset();
  }

  function startEdit(branch: Branch) {
    setEditingId(branch.id);
    editForm.setValue('name', branch.name);
    editForm.setValue('address', branch.address ?? '');
  }

  async function submitEdit(data: { name: string; address: string }) {
    if (!editingId) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/branches/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: data.name.trim(), address: data.address.trim() || null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? 'Gagal memperbarui cabang');
      }
      const updated: Branch = await res.json();
      setBranches((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...updated } : b)));
      toast.success(`Cabang "${updated.name}" berhasil diperbarui`);
      setEditingId(null);
      editForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui cabang');
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-[#e2e6ec] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e6ec] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#182230]">Cabang</h2>
          <p className="mt-0.5 text-[12px] text-[#5a6675]">
            Kelola semua cabang toko Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
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
            <><PlusCircle className="h-3.5 w-3.5" /><span>Tambah Cabang</span></>
          )}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="border-b border-[#e2e6ec] bg-[#f8fafc] px-5 py-4"
        >
          <p className="mb-3 text-[13px] font-medium text-[#182230]">Cabang Baru</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                Nama Cabang <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                {...register('name')}
                placeholder="cth. Cabang Utama"
                fullWidth
              />
              <FieldError>{errors.name?.message as string}</FieldError>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                Kode Cabang <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                {...register('code')}
                onChange={(e) => setValue('code', e.target.value.toUpperCase(), { shouldValidate: true })}
                autoCapitalize="characters"
                placeholder="cth. PUSAT"
                className="font-mono"
                fullWidth
              />
              <FieldError>{errors.code?.message as string}</FieldError>
              <p className="mt-1 text-[11px] text-[#8a94a3]">Digunakan saat registrasi perangkat. Tidak bisa diubah.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                Alamat <span className="text-[#9ca3af]">(opsional)</span>
              </label>
              <textarea
                {...register('address')}
                placeholder="cth. Jl. Merdeka No. 1"
                className={cn(
                  'w-full rounded-[8px] border bg-white px-3 py-2 text-[13px] text-[#182230] placeholder:text-[#9ca3af] focus:border-[#0f6d5f] focus:outline-none focus:ring-1 focus:ring-[#0f6d5f]',
                  fieldBorder(!!errors.address, 'border-[#d1d5db]'),
                )}
              />
              <FieldError>{errors.address?.message as string}</FieldError>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[8px] bg-[#0f6d5f] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a5a4e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="rounded-[8px] px-4 py-2 text-[13px] font-medium text-[#5a6675] transition-colors hover:bg-[#f0f3f7]"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-[13px] text-[#5a6675]">Memuat data…</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <span className="text-[13px] text-[#5a6675]">Belum ada cabang.</span>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-[13px] font-medium text-[#0f6d5f] hover:underline"
            >
              Tambah cabang pertama →
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e6ec] bg-[#f8fafc]">
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">Nama Cabang</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">Kode</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">Alamat</th>
                  <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3]">Status</th>
                  <th scope="col" className="pl-3 pr-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#8a94a3] w-16">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b, idx) => (
                  <React.Fragment key={b.id}>
                    <tr
                      className={cn(
                        'border-b border-[#e2e6ec] transition-colors hover:bg-[#f8fafc]',
                        editingId === b.id && 'bg-[#f7fffe]',
                        editingId !== b.id && idx === branches.length - 1 && 'border-b-0',
                      )}
                    >
                      <td className="px-5 py-3">
                        <span className="font-medium text-[#182230]">{b.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[12px] font-semibold tracking-wider text-[#0f6d5f] bg-[#e6f4f1] px-2 py-0.5 rounded-[5px]">
                          {b.code}
                        </span>
                        <p className="mt-0.5 text-[11px] text-[#8a94a3]">registrasi perangkat</p>
                      </td>
                      <td className="px-5 py-3 text-[#5a6675]">
                        {b.address ?? <span className="text-[#9ca3af]">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full bg-[#e6f4f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#0f6d5f]">
                          Aktif
                        </span>
                      </td>
                      <td className="pl-3 pr-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            title="Edit cabang"
                            onClick={() => editingId === b.id ? setEditingId(null) : startEdit(b)}
                            className={cn(
                              'inline-flex items-center justify-center w-8 h-8 rounded-[8px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f]',
                              editingId === b.id
                                ? 'border-[#c3e8e2] bg-[#e2f2ee] text-[#0f6d5f]'
                                : 'border-[#e2e6ec] text-[#5a6675] hover:bg-[#f0f4f8] hover:text-[#182230] hover:border-[#cbd2dc]',
                            )}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="sr-only">{editingId === b.id ? 'Tutup edit' : `Edit ${b.name}`}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === b.id && (
                      <tr className="bg-[#f7fffe] border-b border-[#c3e8e2]">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="relative pl-3">
                            <div className="absolute inset-y-0 left-0 w-[3px] bg-[#0f6d5f] rounded-full" aria-hidden="true" />
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#0f6d5f]">Edit Cabang</p>
                            <form onSubmit={editForm.handleSubmit(submitEdit)}>
                              <div className="flex flex-wrap gap-3 items-end">
                                {/* Kode (read-only) */}
                                <div className="flex flex-col gap-1">
                                  <label className="text-[12px] font-medium text-[#5a6675]">Kode</label>
                                  <span
                                    title="Kode tidak bisa diubah"
                                    className="inline-flex h-10 items-center rounded-[10px] bg-[#e6f4f1] px-3 font-mono text-[12px] font-semibold tracking-wider text-[#0f6d5f] cursor-default select-none"
                                  >
                                    {b.code}
                                  </span>
                                </div>
                                {/* Name */}
                                <div className="flex flex-col gap-1" style={{minWidth: 0, flex: '1 1 200px', maxWidth: 280}}>
                                  <label className="text-[12px] font-medium text-[#5a6675]">
                                    Nama <span className="text-[#a52b22]">*</span>
                                  </label>
                                  <Input
                                    type="text"
                                    {...editForm.register('name', { required: 'Nama wajib diisi' })}
                                    disabled={editSubmitting}
                                    autoFocus
                                    fullWidth
                                  />
                                  {editForm.formState.errors.name && (
                                    <span className="text-[11px] text-[#a52b22]">{editForm.formState.errors.name.message}</span>
                                  )}
                                </div>
                                {/* Address */}
                                <div className="flex flex-col gap-1" style={{minWidth: 0, flex: '1 1 220px', maxWidth: 360}}>
                                  <label className="text-[12px] font-medium text-[#5a6675]">Alamat</label>
                                <Input
                                    type="text"
                                    {...editForm.register('address')}
                                    placeholder="Opsional"
                                    disabled={editSubmitting}
                                    fullWidth
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="submit"
                                  disabled={editSubmitting}
                                  className="rounded-[8px] bg-[#0f6d5f] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a5a4e] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                >
                                  {editSubmitting ? 'Menyimpan…' : 'Simpan'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingId(null); editForm.reset(); }}
                                  disabled={editSubmitting}
                                  className="rounded-[8px] px-4 py-2 text-[13px] font-medium text-[#5a6675] hover:bg-[#f0f3f7] transition-colors"
                                >
                                  Batal
                                </button>
                              </div>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-[#e2e6ec] list-none m-0 p-0">
              {branches.map((b) => (
                <li key={b.id} className="px-5 py-4 grid gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 text-[14px] font-semibold text-[#182230]">{b.name}</p>
                    <span className="flex-none inline-flex items-center rounded-full bg-[#e6f4f1] px-2 py-0.5 text-[11px] font-semibold text-[#0f6d5f]">
                      Aktif
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold tracking-wider text-[#0f6d5f] bg-[#e6f4f1] px-2 py-0.5 rounded-[5px]">
                      {b.code}
                    </span>
                    <span className="text-[11px] text-[#8a94a3]">kode registrasi</span>
                  </div>
                  {b.address && (
                    <p className="m-0 text-[12px] text-[#5a6675]">{b.address}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editingId === b.id ? setEditingId(null) : startEdit(b)}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6d5f] min-h-[40px]',
                        editingId === b.id
                          ? 'border-[#c3e8e2] bg-[#e2f2ee] text-[#0f6d5f]'
                          : 'border-[#e2e6ec] bg-white text-[#5a6675] hover:bg-[#f0f4f8] hover:text-[#182230]',
                      )}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {editingId === b.id ? 'Tutup' : 'Edit'}
                    </button>
                  </div>
                  {editingId === b.id && (
                    <div className="mt-3 rounded-[10px] border border-[#c3e8e2] bg-[#f7fffe] px-4 py-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#0f6d5f]">Edit Cabang</p>
                      <form onSubmit={editForm.handleSubmit(submitEdit)} className="flex flex-col gap-3">
                        {/* Kode read-only */}
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[#5a6675]">Kode:</span>
                          <span
                            title="Kode tidak bisa diubah"
                            className="font-mono text-[12px] font-semibold tracking-wider text-[#0f6d5f] bg-[#e6f4f1] px-2 py-0.5 rounded-[5px]"
                          >
                            {b.code}
                          </span>
                          <span className="text-[11px] text-[#8a94a3]">(tidak bisa diubah)</span>
                        </div>
                        {/* Name input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-[#5a6675]">Nama <span className="text-[#a52b22]">*</span></label>
                          <Input
                            type="text"
                            {...editForm.register('name', { required: 'Nama wajib diisi' })}
                            disabled={editSubmitting}
                            fullWidth
                          />
                          {editForm.formState.errors.name && (
                            <span className="text-[11px] text-[#a52b22]">{editForm.formState.errors.name.message}</span>
                          )}
                        </div>
                        {/* Address input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-[#5a6675]">Alamat</label>
                          <Input
                            type="text"
                            {...editForm.register('address')}
                            placeholder="Opsional"
                            disabled={editSubmitting}
                            fullWidth
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={editSubmitting}
                            className="flex-1 inline-flex items-center justify-center rounded-[8px] bg-[#0f6d5f] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a5a4e] disabled:opacity-50 transition-colors min-h-[40px]"
                          >
                            {editSubmitting ? 'Menyimpan…' : 'Simpan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); editForm.reset(); }}
                            disabled={editSubmitting}
                            className="flex-1 inline-flex items-center justify-center rounded-[8px] border border-[#e2e6ec] bg-white px-4 py-2 text-[13px] font-medium text-[#5a6675] hover:bg-[#f7f9fb] transition-colors min-h-[40px]"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
