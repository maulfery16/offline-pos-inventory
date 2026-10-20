'use client';
import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Pencil,
  PlusCircle,
  Loader2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Upload,
  ScanBarcode,
} from 'lucide-react';
import type { TabProps } from '../types';
import { getAuthHeaders } from '@/core/auth/client';
import { cn } from '@/shared/utils/index';
import { productFormSchema } from '@/features/inventory/schemas';
import { FieldError } from '@/shared/components/forms/FieldError';
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
import { Input } from '@/shared/components/ui/input';

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

interface FetchParams {
  page: number;
  search: string;
  sortField: 'name' | 'sku' | 'defaultPrice';
  sortDir: 'asc' | 'desc';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

// ── Component ────────────────────────────────────────────────────────────────
export default function ProductTab({ tenantId }: TabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / sort / pagination state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'sku' | 'defaultPrice'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    limit: number;
  }>({ total: 0, totalPages: 1, limit: 20 });
  const PAGE_SIZE = 20;

  // CSV import state
  const [csvImporting, setCsvImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Barcode scan visual state
  const [skuFocused, setSkuFocused] = useState(false);
  const skuInputRef = useRef<HTMLInputElement | null>(null);

  // RHF
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: '', sku: '', unit: 'pcs', defaultPrice: '' },
  });

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when sort changes
  useEffect(() => {
    setPage(1);
  }, [sortField, sortDir]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (params: FetchParams) => {
    setLoading(true);
    try {
      const url = `/api/products?page=${params.page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(params.search)}&sort=${params.sortField}&order=${params.sortDir}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Gagal memuat produk');
      const json = await res.json() as {
        data: Product[];
        pagination: { total: number; totalPages: number; limit: number };
      };
      setProducts(json.data ?? []);
      setPagination(json.pagination ?? { total: 0, totalPages: 1, limit: PAGE_SIZE });
    } catch {
      toast.error('Gagal memuat daftar produk');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts({ page, search: debouncedSearch, sortField, sortDir });
  }, [fetchProducts, page, debouncedSearch, sortField, sortDir]);

  // ── Sort helpers ───────────────────────────────────────────────────────────
  const handleSort = (field: 'name' | 'sku' | 'defaultPrice') => {
    if (field === sortField) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'sku' | 'defaultPrice' }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-[#8a94a3]" />;
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 inline h-3 w-3 text-[#0f6d5f]" />
      : <ChevronDown className="ml-1 inline h-3 w-3 text-[#0f6d5f]" />;
  };

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    reset({ name: '', sku: '', unit: 'pcs', defaultPrice: '' });
    setDialogOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditTarget(product);
    reset({
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
    reset({ name: '', sku: '', unit: 'pcs', defaultPrice: '' });
    setSkuFocused(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        sku: data.sku.trim(),
        unit: (data.unit || 'pcs').trim(),
        defaultPrice: data.defaultPrice,
      };
      if (editTarget) {
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
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? 'Gagal menambah produk');
        }
        toast.success('Produk berhasil ditambahkan');
        void fetchProducts({ page: 1, search: debouncedSearch, sortField, sortDir });
        setPage(1);
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  });

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

  // ── CSV Import ─────────────────────────────────────────────────────────────
  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary
        body: formData,
      });
      const json = await res.json() as {
        imported?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'Import gagal');
      toast.success(
        `Import selesai: ${json.imported ?? 0} produk ditambahkan, ${json.skipped ?? 0} dilewati`,
      );
      if (json.errors?.length) {
        toast.warning(`${json.errors.length} baris error — periksa konsol`);
        console.warn('CSV import errors:', json.errors);
      }
      void fetchProducts({ page: 1, search: debouncedSearch, sortField, sortDir });
      setPage(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import gagal');
    } finally {
      setCsvImporting(false);
      e.target.value = '';
    }
  }

  function downloadTemplate() {
    const csv =
      'nama,sku,harga,satuan,barcode,reorderpoint\nContoh Produk,SKU-001,5000,pcs,,10\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-produk.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const isActive = (p: Product) => p.deletedAt === null;

  // SKU field ref merger — merges RHF ref + skuInputRef
  const skuField = register('sku');

  return (
    <div className="rounded-[14px] border border-[#e2e6ec] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#182230]">Manajemen Produk</h2>
          <p className="mt-0.5 text-[12px] text-[#5a6675]">
            Kelola produk untuk tenant ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Add product button */}
          <button
            onClick={openAdd}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:opacity-80',
              'bg-[#0f6d5f]',
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Produk
          </button>
        </div>
      </div>
      {/* Import CSV button */}
      <div className="flex gap-2 items-center mb-4">
        <button
          onClick={() => csvInputRef.current?.click()}
          disabled={csvImporting}
          className={cn(
            'flex items-center gap-1.5 rounded-[10px] border border-[#e2e6ec] px-3 py-2 text-[13px] font-medium text-[#5a6675] transition-colors',
            'hover:border-[#0f6d5f] hover:text-[#0f6d5f]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-white',
          )}
        >
          {csvImporting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Upload className="h-4 w-4" />}
          Import CSV
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-[11px] text-[#8a94a3] hover:text-[#0f6d5f] transition-colors underline underline-offset-2"
        >
          Download template
        </button>
      </div>
      {/* Hidden file input */}
      <input
        type="file"
        accept=".csv"
        ref={csvInputRef}
        onChange={(e) => void handleCsvImport(e)}
        className="hidden"
      />

      {/* Search bar */}
      <div className="mb-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a94a3] pointer-events-none">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="search"
          placeholder="Cari nama, SKU, barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'h-9 w-full rounded-[10px] border border-[#e2e6ec] bg-white pl-9 pr-9 text-[13px] text-[#182230] placeholder:text-[#8a94a3]',
            'focus:border-[#0f6d5f] focus:outline-none focus:ring-2 focus:ring-[#0f6d5f]/20',
            'transition-colors',
          )}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a94a3] hover:text-[#5a6675] transition-colors"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#5a6675]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memuat…
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-[#8a94a3]">
          {debouncedSearch
            ? `Tidak ada produk untuk "${debouncedSearch}".`
            : 'Belum ada produk. Klik \u201cTambah Produk\u201d untuk mulai.'}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none text-[12px] hover:text-[#0f6d5f] transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Nama <SortIcon field="name" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-[12px] hover:text-[#0f6d5f] transition-colors"
                    onClick={() => handleSort('sku')}
                  >
                    SKU <SortIcon field="sku" />
                  </TableHead>
                  <TableHead className="text-[12px]">Satuan</TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-[12px] hover:text-[#0f6d5f] transition-colors"
                    onClick={() => handleSort('defaultPrice')}
                  >
                    Harga Jual <SortIcon field="defaultPrice" />
                  </TableHead>
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
                      <TableCell className="text-[13px] text-[#5a6675]">{product.unit}</TableCell>
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
          </div>

          {/* Mobile card list */}
          <ul className="sm:hidden -mx-5 divide-y divide-[#e2e6ec] list-none m-0 p-0 border-t border-[#e2e6ec]">
            {products.map(product => {
              const active = isActive(product);
              return (
                <li
                  key={product.id}
                  className={cn('px-5 py-4 grid gap-2', !active && 'opacity-50')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 text-[14px] font-semibold text-[#182230] truncate">
                        {product.name}
                      </p>
                      <p className="m-0 mt-0.5 font-mono text-[12px] text-[#5a6675]">
                        {product.sku} · {product.unit}
                      </p>
                    </div>
                    <div className="flex-none flex flex-col items-end gap-1">
                      <span className="text-[14px] font-semibold tabular-nums text-[#182230]">
                        {rupiah(product.defaultPrice)}
                      </span>
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
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex items-center gap-1.5 rounded-[7px] border border-[#e2e6ec] px-3 py-1.5 text-[12px] text-[#5a6675] hover:border-[#0f6d5f] hover:text-[#0f6d5f] transition-colors"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {active && (
                      <button
                        onClick={() => void handleDeactivate(product)}
                        className="rounded-[7px] border border-[#e2e6ec] px-3 py-1.5 text-[12px] text-[#a52b22] hover:border-[#a52b22] hover:bg-[#fff5f5] transition-colors"
                        aria-label={`Nonaktifkan ${product.name}`}
                      >
                        Nonaktifkan
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#e2e6ec] pt-4">
              <span className="text-[12px] text-[#8a94a3] tabular-nums">
                {pagination.total} produk
              </span>
              <span className="text-[12px] text-[#5a6675] tabular-nums">
                Halaman {page} dari {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-[8px] border border-[#e2e6ec] px-3 py-1.5 text-[12px] text-[#5a6675] hover:border-[#0f6d5f] hover:text-[#0f6d5f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 rounded-[8px] border border-[#e2e6ec] px-3 py-1.5 text-[12px] text-[#5a6675] hover:border-[#0f6d5f] hover:text-[#0f6d5f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-[#182230]">
              {editTarget ? 'Edit Produk' : 'Tambah Produk'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={e => void onSubmit(e)} className="grid gap-4 pt-1">
            {/* Nama */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-name" className="text-[12px] font-medium text-[#5a6675]">
                Nama <span className="text-[#a52b22]">*</span>
              </label>
              <Input
                id="prod-name"
                type="text"
                {...register('name')}
                placeholder="Nama produk"
                fullWidth
              />
              <FieldError>{errors.name?.message}</FieldError>
            </div>

            {/* SKU — barcode scan enabled */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="prod-sku" className="text-[12px] font-medium text-[#5a6675]">
                  SKU / Barcode <span className="text-[#a52b22]">*</span>
                </label>
                {skuFocused && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e2f2ee] px-2 py-0.5 text-[10px] font-medium text-[#0f6d5f]">
                    <ScanBarcode className="h-3 w-3" />
                    Siap scan
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="prod-sku"
                  type="text"
                  {...skuField}
                  ref={(el) => {
                    skuField.ref(el);
                    skuInputRef.current = el;
                  }}
                  placeholder="Scan barcode atau ketik manual"
                  className="font-mono pr-10"
                  fullWidth
                  onFocus={() => setSkuFocused(true)}
                  onBlur={() => setSkuFocused(false)}
                />
                <button
                  type="button"
                  title="Klik lalu scan barcode"
                  onClick={() => skuInputRef.current?.focus()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a94a3] hover:text-[#0f6d5f] transition-colors"
                >
                  <ScanBarcode className="h-4 w-4" />
                </button>
              </div>
              <FieldError>{errors.sku?.message}</FieldError>
              <p className="text-[11px] text-[#8a94a3]">
                Arahkan scanner barcode saat field ini aktif untuk mengisi otomatis.
              </p>
            </div>

            {/* Satuan */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-unit" className="text-[12px] font-medium text-[#5a6675]">
                Satuan
              </label>
              <Input
                id="prod-unit"
                type="text"
                {...register('unit')}
                placeholder="pcs, kg, ltr, …"
                fullWidth
              />
            </div>

            {/* Harga Jual */}
            <div className="grid gap-1.5">
              <label htmlFor="prod-price" className="text-[12px] font-medium text-[#5a6675]">
                Harga Jual (Rp) <span className="text-[#a52b22]">*</span>
              </label>
              <Input
                id="prod-price"
                type="number"
                min={0}
                step={1}
                {...register('defaultPrice')}
                placeholder="0"
                className="tabular-nums"
                fullWidth
              />
              <FieldError>{errors.defaultPrice?.message}</FieldError>
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-[10px] border border-[#e2e6ec] px-4 py-2 text-[13px] text-[#5a6675] hover:border-[#182230] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-[10px] bg-[#0f6d5f] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
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
