import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID wajib diisi'),
  variantId: z.string().min(1, 'Variant ID wajib diisi'),
  quantity: z.number().int().min(1, 'Kuantitas minimal 1').max(50, 'Maksimal 50 unit per item')
});

export const CreateOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'Nama pelanggan minimal 2 karakter').max(100).trim(),
    email: z.string().email('Format email tidak valid').max(255).trim().toLowerCase(),
    phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor HP tidak valid').trim()
  }),
  items: z.array(OrderItemSchema).min(1, 'Keranjang belanja tidak boleh kosong'),
  shippingAddress: z.object({
    recipientName: z.string().min(2).max(100).trim(),
    phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor HP tidak valid').trim(),
    province: z.string().min(2).max(100).trim(),
    city: z.string().min(2).max(100).trim(),
    subdistrict: z.string().min(2).max(100).trim(),
    village: z.string().max(100).optional(),
    postalCode: z.string().regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka').trim(),
    fullAddress: z.string().min(10).max(500).trim(),
    notes: z.string().max(255).optional()
  }),
  shippingOption: z.object({
    provider: z.string().optional(),
    courierCode: z.string().optional(),
    serviceCode: z.string().optional(),
    serviceName: z.string().optional(),
    cost: z.number().min(0).optional()
  }).optional(),
  paymentMethodCode: z.enum([
    'BCA_VA',
    'MANDIRI_VA',
    'BRI_VA',
    'BNI_VA',
    'QRIS',
    'CREDIT_CARD',
    'DOKU_CHECKOUT'
  ]),
  voucherCode: z.string().max(64).optional(),
  notes: z.string().max(500).optional()
});

export const TrackingUpdateSchema = z.object({
  trackingNumber: z.string().min(5, 'Nomor resi minimal 5 karakter').max(100).trim(),
  courierName: z.string().max(100).optional()
});

export const OrderStatusTransitionSchema = z.object({
  status: z.enum([
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'READY_TO_SHIP',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
    'EXPIRED',
    'REFUNDED'
  ]),
  note: z.string().max(500).optional()
});
