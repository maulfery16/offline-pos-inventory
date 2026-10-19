import { z } from 'zod';

const dateStr = z
  .string()
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Tanggal tidak valid',
  })
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: 'Tanggal tidak valid',
  });

export const productFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  unit: z.string().min(1, 'Satuan wajib diisi').default('pcs'),
  defaultPrice: z.coerce.number().min(0, 'Harga jual tidak boleh negatif'),
});

export const inboundHeaderSchema = z.object({
  supplier: z.string().min(1, 'Supplier wajib diisi'),
  invoice: z.string().min(1, 'Nomor faktur wajib diisi'),
  date: dateStr,
  warehouse: z.string().min(1, 'Gudang tujuan wajib diisi'),
});

export const inboundLineSchema = z.object({
  qty: z.coerce.number().int().min(1, 'Qty minimal 1'),
  cost: z.coerce.number().min(0, 'HPP tidak boleh negatif'),
  margin: z.coerce.number().min(0, 'Margin minimal 0').max(100, 'Margin maksimal 100'),
  batch: z.string().min(1, 'No. batch wajib diisi'),
  expiry: z
    .string()
    .refine((v) => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), {
      message: 'Tanggal kedaluwarsa tidak valid',
    }),
});
