import { z } from 'zod';

export const deviceRegistrationSchema = z.object({
  tenantCode: z.string().min(2, 'Kode Toko minimal 2 karakter'),
  branchCode: z.string().min(2, 'Kode Cabang minimal 2 karakter'),
  deviceName: z.string().min(1, 'Nama perangkat wajib diisi'),
  adminPassword: z.string().min(1, 'Kata sandi admin wajib diisi'),
});

export const kasirLoginSchema = z.object({
  kasirId: z.string().min(1, 'Pilih kasir aktif terlebih dahulu'),
  pin: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  cabang: z.string().min(1, 'Pilih cabang'),
  rememberDevice: z.boolean(),
});

export type DeviceRegistrationForm = z.infer<typeof deviceRegistrationSchema>;
export type KasirLoginForm = z.infer<typeof kasirLoginSchema>;
export type AdminLoginForm = z.infer<typeof adminLoginSchema>;
