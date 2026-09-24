import { Router, Response } from 'express';
import { orderRepository } from '../repositories/postgres/orderRepository.js';
import { productRepository } from '../repositories/postgres/productRepository.js';
import { inventoryRepository } from '../repositories/postgres/inventoryRepository.js';
import { voucherRepository } from '../repositories/postgres/voucherRepository.js';
import { reviewRepository } from '../repositories/postgres/reviewRepository.js';
import { userRepository } from '../repositories/postgres/userRepository.js';
import { auditRepository } from '../repositories/postgres/auditRepository.js';
import { paymentService } from '../providers/payment/index.js';
import { shippingService } from '../providers/shipping/index.js';
import { requireAdminAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { TrackingUpdateSchema, OrderStatusTransitionSchema } from '../validators/orderValidators.js';
import { getErrorMessage } from '../validators/formatError.js';
import { OrderStatus } from '../../src/types/index.js';
import { z } from 'zod';

const router = Router();

// Apply strict admin authentication to ALL admin routes
router.use(requireAdminAuth);

// GET /api/admin/dashboard - Overview statistics & integration statuses
router.get('/dashboard', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await orderRepository.getAdminStats();
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
    console.error('[Admin Dashboard Error]:', err.message);
    res.status(500).json({ success: false, message: 'Gagal memuat dashboard admin' });
  }
});

// GET /api/admin/orders - All orders with search & status filters
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search, limit } = req.query;
    const orders = await orderRepository.getAllOrders({
      status: status as OrderStatus,
      search: search as string,
      limit: limit ? Number(limit) : 100
    });
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat pesanan' });
  }
});

// PATCH /api/admin/orders/:orderNumber/tracking - Set tracking number & mark shipped
router.patch('/orders/:orderNumber/tracking', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const parseResult = TrackingUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { trackingNumber, courierName } = parseResult.data;
    const updated = await orderRepository.setOrderTracking(orderNumber, trackingNumber, courierName);

    // Audit log
    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'UPDATE_ORDER_TRACKING',
      entityType: 'ORDER',
      entityId: orderNumber,
      newValues: { trackingNumber, courierName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Nomor resi berhasil diperbarui', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal mengupdate tracking order' });
  }
});

// PATCH /api/admin/orders/:orderNumber/status - Transition order status
router.patch('/orders/:orderNumber/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const parseResult = OrderStatusTransitionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { status, note } = parseResult.data;
    const updated = await orderRepository.updateOrderStatus(orderNumber, status as OrderStatus, note, req.user!.name);

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'ORDER',
      entityId: orderNumber,
      newValues: { status, note },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: `Status pesanan diubah ke ${status}`, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Gagal mengubah status pesanan' });
  }
});

// GET /api/admin/inventory - List stock across variants
router.get('/inventory', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await inventoryRepository.getInventoryList();
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat inventaris' });
  }
});

// POST /api/admin/inventory/adjust - Manual stock adjustment
router.post('/inventory/adjust', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { variantId, delta, reason } = req.body;
    if (!variantId || typeof delta !== 'number' || !reason) {
      return res.status(400).json({ success: false, message: 'Data penyesuaian stok tidak lengkap' });
    }

    await inventoryRepository.adjustStock(variantId, delta, reason, req.user!.id);

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'ADJUST_STOCK',
      entityType: 'INVENTORY',
      entityId: variantId,
      newValues: { delta, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Penyesuaian stok berhasil disimpan' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal menyesuaikan stok' });
  }
});

// GET /api/admin/inventory/movements - Stock movement logs
router.get('/inventory/movements', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const movements = await inventoryRepository.getMovements(100);
    res.json({ success: true, data: movements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat log pergerakan stok' });
  }
});

// POST /api/admin/products - Add product
router.post('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newProduct = await productRepository.createProduct(req.body);

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'CREATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: newProduct.id,
      newValues: { name: newProduct.name, price: newProduct.price },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', data: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal menambahkan produk' });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await productRepository.updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: id,
      newValues: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Produk berhasil diperbarui', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk' });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await productRepository.deleteProduct(id);

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'DELETE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success, message: success ? 'Produk berhasil dihapus' : 'Produk tidak ditemukan' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
});

// GET /api/admin/vouchers - All vouchers
router.get('/vouchers', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const vouchers = await voucherRepository.getAllVouchers();
    res.json({ success: true, data: vouchers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat voucher' });
  }
});

// POST /api/admin/vouchers - Create voucher
router.post('/vouchers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const voucher = await voucherRepository.createVoucher(req.body);

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'CREATE_VOUCHER',
      entityType: 'VOUCHER',
      entityId: voucher.id,
      newValues: { code: voucher.code, discountValue: voucher.discountValue ?? voucher.value },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, message: 'Voucher berhasil dibuat', data: voucher });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal membuat voucher' });
  }
});

// GET /api/admin/reviews - All reviews for moderation
router.get('/reviews', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const reviews = await reviewRepository.getAllReviews(status as string);
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat ulasan' });
  }
});

// PATCH /api/admin/reviews/:id/status - Moderate review
router.patch('/reviews/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const success = await reviewRepository.updateStatus(id, status);

    await auditRepository.recordLog({
      adminId: req.user!.id,
      action: 'MODERATE_REVIEW',
      entityType: 'REVIEW',
      entityId: id,
      newValues: { status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success, message: `Ulasan berhasil di-${status.toLowerCase()}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memoderasi ulasan' });
  }
});

// GET /api/admin/customers - Customer list with metrics
router.get('/customers', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await userRepository.listCustomers();
    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat data pelanggan' });
  }
});

// GET /api/admin/audit-logs - Audit trail
router.get('/audit-logs', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await auditRepository.getRecentLogs(100);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat log audit' });
  }
});

export default router;
