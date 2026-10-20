'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/cn';
import { computeDiff } from '@/shared/utils/diff';
import { getAuthHeaders } from '@/core/auth/client';
import { storeFormSchema } from '@/features/tenants/schemas';
import { FieldError } from '@/shared/components/forms/FieldError';
import { fieldBorder } from '@/shared/components/forms/fieldBorder';
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
  const [tenantCode, setTenantCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const originalRef = useRef<FormState | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormState>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: { name: '', address: '', phone: '', email: '' },
  });

  useEffect(() => {
    async function loadTenant() {
      try {
        const res = await fetch(`/api/tenants/${tenantId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Gagal memuat data toko');
        const data: TenantInfo = await res.json();
        setTenantCode(data.code ?? '');
        const state: FormState = {
          name: data.name ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
        };
        originalRef.current = state;
        reset(state);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat informasi toko');
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [tenantId, reset]);

  const onSave = handleSubmit(async (data) => {
    if (!originalRef.current) return;
    const changed = computeDiff(
      originalRef.current as unknown as Record<string, unknown>,
      (data as unknown) as Record<string, unknown>,
    ) as Partial<FormState>;
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
      originalRef.current = newState;
      reset(newState);
      toast.success('Informasi toko berhasil disimpan');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan informasi toko');
    } finally {
      setSaving(false);
    }
  });

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
      <form onSubmit={onSave} className="grid gap-5 px-6 py-5">
        {/* Kode Toko — read-only, used for device registration */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-[#5a6675]">
            Kode Toko
          </label>
          <div className={cn(
            'flex items-center justify-between h-10 w-full rounded-[10px] border border-[#e2e6ec] bg-[#f8fafc] px-3',
            'text-[13px]',
          )}>
            <span className="font-mono font-semibold tracking-widest text-[#182230]">
              {tenantCode || '—'}
            </span>
            <span className="text-[11px] text-[#8a94a3]">Digunakan untuk registrasi perangkat</span>
          </div>
        </div>

        {/* Nama Toko */}
        <div className="grid gap-1.5">
          <label
            htmlFor="store-name"
            className="text-xs font-medium text-[#5a6675]"
          >
            Nama Toko
            <span className="text-red-500">*</span>
          </label>
          <input
            id="store-name"
            type="text"
            {...register('name')}
            placeholder="Masukkan nama toko"
            className={cn(
              'h-10 w-full rounded-[10px] border bg-white px-3',
              'text-[13px] text-[#182230] placeholder:text-[#adb5c0]',
              'outline-none transition-colors',
              fieldBorder(!!errors.name, 'border-[#cbd2dc]'),
              !errors.name && 'focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10',
            )}
          />
          <FieldError>{errors.name?.message}</FieldError>
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
            {...register('address')}
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
              {...register('phone')}
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
              <span className="text-red-500">*</span>
            </label>
            <input
              id="store-email"
              type="email"
              {...register('email')}
              placeholder="contoh: toko@email.com"
              className={cn(
                'h-10 w-full rounded-[10px] border bg-white px-3',
                'text-[13px] text-[#182230] placeholder:text-[#adb5c0]',
                'outline-none transition-colors',
                fieldBorder(!!errors.email, 'border-[#cbd2dc]'),
                !errors.email && 'focus:border-[#0f6d5f] focus:ring-2 focus:ring-[#0f6d5f]/10',
              )}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e2e6ec] pt-4">
          <button
            type="button"
            onClick={() => originalRef.current && reset(originalRef.current)}
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
