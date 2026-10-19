'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Pencil, PlusCircle, Loader2 } from 'lucide-react';
import type { TabProps } from '../page';
import { getAuthHeaders } from '@/core/auth/client';
import { cn } from '@/shared/utils/index';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/components/ui/table';

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;
  defaultPrice: number;
  deletedAt: string | null;
}

interface FormState {
  name: string;
  sku: string;
  unit: string;
  defaultPrice: string;
}

const EMPTY_FORM: FormState = { name: '', sku: '', unit: 'pcs', defaultPrice: '' };

// ── Helpers ──────────────────────────────────────────────────────────────────

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

// ── Component ────────────────────────────────────────────────────────────────

export default function ProductTab({ tenantId }: TabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Gagal memuat produk');
      const json = await res.json();
      // API returns { data: Product[], pagination: {...} }
      // Include soft-deleted rows so admin sees Nonaktif status
      setProducts((json.data ?? json) as Product[]);
    } catch {
      toast.error('Gagal memuat daftar produk');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditTarget(product);
    setForm({
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      defaultPrice: String(product.defaultPrice),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(form.defaultPrice);
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error('Nama dan SKU wajib diisi');
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error('Harga jual tidak valid');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        unit: form.unit.trim() || 'pcs',
        defaultPrice: price,
      };

      if (editTarget) {
        // PATCH /api/products/[id]
        const res = await fetch(`/api/products/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? 'Gagal menyimpan produk');
        }
        const updated: Product = await res.json();
        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        toast.success('Produk berhasil diperbarui');
      } else {
        // POST /api/products
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? 'Gagal menambah produk');
        }
        const created: Product = await res.json();
        setProducts(prev => [created, ...prev]);
        toast.success('Produk berhasil ditambahkan');
      }

      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Deactivate ─────────────────────────────────────────────────────────────

  const handleDeactivate = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Gagal menonaktifkan produk');
      }
      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, deletedAt: new Date().toISOString() } : p,
        ),
      );
      toast.success(`Produk "${product.name}" dinonaktifkan`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isActive = (p: Product) => p.deletedAt === null;

  return (
    <div className="rounded-[14px] border border-[#e2e6ec] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#182230]">Manajemen Produk</h2>
          <p className="mt-0.5 text-[12px] text-[#5a6675]">
            Kelola produk untuk tenant ini.
          </p>
        </div>
        <button
          onClick={openAdd}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:opacity-80',
            'bg-[#0f6d5f]',
          )}
        >
          <PlusCircle className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#5a6675]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memuat…
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-[#8a94a3]">
          Belum ada produk. Klik &ldquo;Tambah Produk&rdquo; untuk mulai.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[12px]">Nama</TableHead>
              <TableHead className="text-[12px]">SKU</TableHead>
              <TableHead className="text-[12px]">Satuan</TableHead>
              <TableHead className="text-[12px]">Harga Jual</TableHead>
              <TableHead className="text-[12px]">Status</TableHead>
              <TableHead className="text-[12px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => {
              const active = isActive(product);
              return (
                <TableRow key={product.id} className={cn(!active && 'opacity-50')}>
                  <TableCell className="text-[13px] font-medium text-[#182230]">
                    {product.name}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-[#5a6675]">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#5a6675]">
                    {product.unit}
                  </TableCell>
                  <TableCell className="text-[13px] tabular-nums text-[#182230]">
                    {rupiah(product.defaultPrice)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                        active
                          ? 'bg-[#e6f4f0] text-[#0f6d5f]'
                          : 'bg-[#f0f2f5] text-[#8a94a3]',
                      )}
                    >
                      {active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="flex items-center gap-1 rounded-md border border-[#e2e6ec] px-2 py-1 text-[12px] text-[#5a6675] hover:border-[#0f6d5f] hover:text-[#0f6d5f] transition-colors"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      {active && (
                        <button
                          onClick={() => void handleDeactivate(product)}
                          className="rounded-md border border-[#e2e6ec] px-2 py-1 text-[12px] text-[#a52b22] hover:border-[#a52b22] transition-colors"
                          aria-label={`Nonaktifkan ${product.name}`}
                        >
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-[#182230]">
              {editTarget ? 'Edit Produk' : 'Tambah Produk'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={e => void handleSubmit(e)} className="grid gap-4 pt-1">
            {/* Nama */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-name" className="text-[12px] font-medium text-[#5a6675]">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nama produk"
                required
                className="rounded-lg border border-[#e2e6ec] px-3 py-2 text-[13px] text-[#182230] placeholder:text-[#b0b8c5] focus:border-[#0f6d5f] focus:outline-none"
              />
            </div>

            {/* SKU */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-sku" className="text-[12px] font-medium text-[#5a6675]">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-sku"
                type="text"
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="Kode SKU unik"
                required
                className="rounded-lg border border-[#e2e6ec] px-3 py-2 text-[13px] font-mono text-[#182230] placeholder:text-[#b0b8c5] focus:border-[#0f6d5f] focus:outline-none"
              />
            </div>

            {/* Satuan */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-unit" className="text-[12px] font-medium text-[#5a6675]">
                Satuan
              </label>
              <input
                id="prod-unit"
                type="text"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="pcs, kg, ltr, …"
                className="rounded-lg border border-[#e2e6ec] px-3 py-2 text-[13px] text-[#182230] placeholder:text-[#b0b8c5] focus:border-[#0f6d5f] focus:outline-none"
              />
            </div>

            {/* Harga Jual */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-price" className="text-[12px] font-medium text-[#5a6675]">
                Harga Jual (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-price"
                type="number"
                min={0}
                step={1}
                value={form.defaultPrice}
                onChange={e => setForm(f => ({ ...f, defaultPrice: e.target.value }))}
                placeholder="0"
                required
                className="rounded-lg border border-[#e2e6ec] px-3 py-2 text-[13px] tabular-nums text-[#182230] placeholder:text-[#b0b8c5] focus:border-[#0f6d5f] focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-lg border border-[#e2e6ec] px-4 py-2 text-[13px] text-[#5a6675] hover:border-[#182230] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-[#0f6d5f] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editTarget ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
