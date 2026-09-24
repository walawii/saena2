import { Router, Request, Response } from 'express';
import { dataStore } from '../repositories/store.js';
import { paymentService } from '../providers/payment/index.js';
import { shippingService } from '../providers/shipping/index.js';

const router = Router();

// Simple admin auth check middleware
const requireAdmin = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  // Allows admin token or admin key
  if (
    authHeader?.includes('saena_admin') ||
    req.headers['x-admin-key'] === (process.env.ADMIN_KEY || 'admin_saena_secret_pass') ||
    req.query.adminKey === (process.env.ADMIN_KEY || 'admin_saena_secret_pass')
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Akses ditolak. Endpoint ini hanya untuk Administrator Saena.id.'
  });
};

// Apply requireAdmin to all admin routes
router.use(requireAdmin);

// GET /api/admin/dashboard - Overview statistics
router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const stats = dataStore.getAdminStats();
    const dokuStatus = paymentService.getStatus();
    const mengantarStatus = shippingService.getStatus();

    res.json({
      success: true,
      data: {
        ...stats,
        integrations: {
          doku: dokuStatus,
          mengantar: mengantarStatus
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat dashboard admin' });
  }
});

// GET /api/admin/orders - All orders with search & status filters
router.get('/orders', (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const orders = dataStore.getOrders({
      status: status as any,
      search: search as string
    });
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat pesanan' });
  }
});

// PATCH /api/admin/orders/:orderNumber/tracking - Set tracking number & mark shipped
router.patch('/orders/:orderNumber/tracking', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { trackingNumber, courierName } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Nomor resi kurir wajib diisi.' });
    }

    const updated = dataStore.setOrderTracking(orderNumber, trackingNumber.trim(), courierName);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, message: 'Nomor resi berhasil diperbarui', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengupdate tracking order' });
  }
});

// POST /api/admin/products - Add product
router.post('/products', (req: Request, res: Response) => {
  try {
    const newProduct = dataStore.createProduct(req.body);
    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', data: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan produk' });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = dataStore.updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    res.json({ success: true, message: 'Produk berhasil diperbarui', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk' });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = dataStore.deleteProduct(id);
    res.json({ success, message: success ? 'Produk berhasil dihapus' : 'Produk tidak ditemukan' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
});

// POST /api/admin/vouchers - Add voucher
router.post('/vouchers', (req: Request, res: Response) => {
  try {
    const voucher = dataStore.createVoucher(req.body);
    res.status(201).json({ success: true, message: 'Voucher berhasil dibuat', data: voucher });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat voucher' });
  }
});

export default router;
