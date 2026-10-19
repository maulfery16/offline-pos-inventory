'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/core/auth/client';
import { cn } from '@/shared/utils';
import type { TabProps } from '../page';

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
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: name.trim(), code: code.trim(), address: address.trim() || undefined }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Gagal menambahkan cabang');
      }
      const newBranch: Branch = await res.json();
      setBranches((prev) => [newBranch, ...prev]);
      toast.success('Cabang berhasil ditambahkan');
      setName('');
      setAddress('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan cabang');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setName('');
    setCode('');
    setAddress('');
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
            'rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors',
            showForm
              ? 'bg-[#f0f3f7] text-[#5a6675] hover:bg-[#e2e6ec]'
              : 'bg-[#0f6d5f] text-white hover:bg-[#0a5a4e]',
          )}
        >
          {showForm ? 'Batal' : '+ Tambah Cabang'}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-b border-[#e2e6ec] bg-[#f8fafc] px-5 py-4"
        >
          <p className="mb-3 text-[13px] font-medium text-[#182230]">Cabang Baru</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                Nama Cabang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Cabang Utama"
                className="w-full rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2 text-[13px] text-[#182230] placeholder:text-[#9ca3af] focus:border-[#0f6d5f] focus:outline-none focus:ring-1 focus:ring-[#0f6d5f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                Kode Cabang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                placeholder="cth. PUSAT"
                className="w-full rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2 text-[13px] font-mono text-[#182230] placeholder:text-[#9ca3af] focus:border-[#0f6d5f] focus:outline-none focus:ring-1 focus:ring-[#0f6d5f]"
              />
              <p className="mt-1 text-[11px] text-[#8a94a3]">Digunakan saat registrasi perangkat. Tidak bisa diubah.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                Alamat <span className="text-[#9ca3af]">(opsional)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth. Jl. Merdeka No. 1"
                className="w-full rounded-[8px] border border-[#d1d5db] bg-white px-3 py-2 text-[13px] text-[#182230] placeholder:text-[#9ca3af] focus:border-[#0f6d5f] focus:outline-none focus:ring-1 focus:ring-[#0f6d5f]"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || !name.trim() || !code.trim()}
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
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e6ec] bg-[#f8fafc]">
                <th className="px-5 py-3 font-semibold text-[#374151]">Nama Cabang</th>
                <th className="px-5 py-3 font-semibold text-[#374151]">Kode</th>
                <th className="px-5 py-3 font-semibold text-[#374151]">Alamat</th>
                <th className="px-5 py-3 font-semibold text-[#374151]">Status</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b, idx) => (
                <tr
                  key={b.id}
                  className={cn(
                    'border-b border-[#e2e6ec] transition-colors hover:bg-[#f8fafc]',
                    idx === branches.length - 1 && 'border-b-0',
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
