import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').trim(),
  email: z.string().email('Format email tidak valid').max(255).trim().toLowerCase(),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor telepon tidak valid (format: 08xxx)').trim(),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128)
});

export const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid').max(255).trim().toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi')
});

export const AdminLoginSchema = z.object({
  email: z.string().email('Format email tidak valid').max(255).trim().toLowerCase(),
  password: z.string().min(1, 'Password admin wajib diisi')
});

export const AddressSchema = z.object({
  recipientName: z.string().min(2, 'Nama penerima minimal 2 karakter').max(100).trim(),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor HP tidak valid').trim(),
  province: z.string().min(2).max(100).trim(),
  city: z.string().min(2).max(100).trim(),
  subdistrict: z.string().min(2).max(100).trim(),
  village: z.string().max(100).optional(),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka').trim(),
  fullAddress: z.string().min(10, 'Alamat lengkap minimal 10 karakter').max(500).trim(),
  notes: z.string().max(255).optional(),
  isDefault: z.boolean().optional()
});
