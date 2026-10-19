'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/cn';
import { getAuthHeaders } from '@/core/auth/client';
import type { TabProps } from '../page';

interface TenantInfo {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface FormState {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export default function StoreTab({ tenantId }: TabProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [original, setOriginal] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTenant() {
      try {
        const res = await fetch(`/api/tenants/${tenantId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Gagal memuat data toko');
        const data: TenantInfo = await res.json();
        const state: FormState = {
          name: data.name ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
        };
        setForm(state);
        setOriginal(state);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat informasi toko');
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [tenantId]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!original) return;

    // Only send changed fields
    const changed: Partial<FormState> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      if (form[key] !== original[key]) {
        changed[key] = form[key];
      }
    });

    if (Object.keys(changed).length === 0) {
      toast.info('Tidak ada perubahan untuk disimpan');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(changed),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Gagal menyimpan');
      }

      const updated: TenantInfo = await res.json();
      const newState: FormState = {
        name: updated.name ?? '',
        address: updated.address ?? '',
        phone: updated.phone ?? '',
        email: updated.email ?? '',
      };
      setForm(newState);
      setOriginal(newState);
      toast.success('Informasi toko berhasil disimpan');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan informasi toko');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[13px] text-[#5a6675]">
        Memuat informasi toko…
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#e2e6ec] bg-white">
      {/* Card header */}
      <div className="border-b border-[#e2e6ec] px-6 py-4">
        <h2 className="text-[15px] font-semibold text-[#182230]">Informasi Toko</h2>
        <p className="mt-0.5 text-[12px] text-[#5a6675]">
          Kelola nama toko, alamat, dan kontak yang tampil di struk.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="grid gap-5 px-6 py-5">
        {/* Nama Toko */}
        <div className="grid gap-1.5">
          <label
            htmlFor="store-name"
            className="text-xs font-medium text-[#5a6675]"
          >
            Nama Toko
          </label>
          <input
            id="store-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Masukkan nama toko"
            required
            className={cn(
              'h-10 w-full rounded-[10px] border border-[#cbd2dc] bg-white px-3',
              'text-[13px] text-[#182230] placeholder:text-[#adb5c0]',
              'outline-none transition-colors',
              'focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10',
            )}
          />
        </div>

        {/* Alamat */}
        <div className="grid gap-1.5">
          <label
            htmlFor="store-address"
            className="text-xs font-medium text-[#5a6675]"
          >
            Alamat
          </label>
          <textarea
            id="store-address"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Masukkan alamat lengkap"
            rows={3}
            className={cn(
              'w-full resize-none rounded-[10px] border border-[#cbd2dc] bg-white px-3 py-2',
              'text-[13px] text-[#182230] placeholder:text-[#adb5c0]',
              'outline-none transition-colors',
              'focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10',
            )}
          />
        </div>

        {/* Telepon & Email — 2-col on md+ */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Nomor Telepon */}
          <div className="grid gap-1.5">
            <label
              htmlFor="store-phone"
              className="text-xs font-medium text-[#5a6675]"
            >
              Nomor Telepon
            </label>
            <input
              id="store-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="contoh: 021-1234567"
              className={cn(
                'h-10 w-full rounded-[10px] border border-[#cbd2dc] bg-white px-3',
                'text-[13px] text-[#182230] placeholder:text-[#adb5c0]',
                'outline-none transition-colors',
                'focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10',
              )}
            />
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <label
              htmlFor="store-email"
              className="text-xs font-medium text-[#5a6675]"
            >
              Email
            </label>
            <input
              id="store-email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contoh: toko@email.com"
              className={cn(
                'h-10 w-full rounded-[10px] border border-[#cbd2dc] bg-white px-3',
                'text-[13px] text-[#182230] placeholder:text-[#adb5c0]',
                'outline-none transition-colors',
                'focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10',
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e2e6ec] pt-4">
          <button
            type="button"
            onClick={() => original && setForm(original)}
            disabled={saving}
            className={cn(
              'h-9 rounded-[10px] border border-[#cbd2dc] px-4',
              'text-[13px] font-medium text-[#5a6675]',
              'transition-colors hover:bg-[#f6f8fa] disabled:opacity-50',
            )}
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'h-9 rounded-[10px] bg-[#0f6d5f] px-5',
              'text-[13px] font-medium text-white',
              'transition-colors hover:bg-[#0a5549] disabled:opacity-50',
            )}
          >
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
