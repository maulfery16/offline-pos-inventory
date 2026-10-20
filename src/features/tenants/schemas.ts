import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().min(1, 'Nama cabang wajib diisi'),
  code: z.string().min(2, 'Kode cabang minimal 2 karakter'),
  address: z.string().optional().default(''),
});

export const storeFormSchema = z.object({
  name: z.string().min(1, 'Nama toko wajib diisi'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Format email tidak valid',
    })
    .default(''),
});

export type BranchForm = z.infer<typeof branchFormSchema>;
export type StoreForm = z.infer<typeof storeFormSchema>;
