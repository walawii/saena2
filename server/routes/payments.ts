import { Router, Request, Response } from 'express';
import { paymentService } from '../providers/payment/index.js';
import { shippingService } from '../providers/shipping/index.js';
import { notificationService } from '../services/notificationService.js';
import { dataStore } from '../repositories/store.js';

const router = Router();

// GET /api/payments/status - Gateway status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: paymentService.getStatus()
  });
});

// POST /api/payments/doku/create - Create DOKU payment transaction
router.post('/doku/create', async (req: Request, res: Response) => {
  try {
    const { orderNumber, paymentMethodCode } = req.body;

    if (!orderNumber || !paymentMethodCode) {
      return res.status(400).json({
        success: false,
        message: 'Nomor pesanan dan metode pembayaran wajib diisi.'
      });
    }

    const order = dataStore.getOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.'
      });
    }

    const provider = paymentService.getProvider();
    const result = await provider.createPayment({
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethodCode,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone
      },
      items: order.items.map(i => ({
        id: i.productId,
        name: `${i.name} (${i.color} - ${i.size})`,
        price: i.price,
        quantity: i.quantity
      }))
    });

    // Update order with payment method details
    order.paymentMethod = result.paymentMethod;
    order.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      provider: provider.name,
      isLive: paymentService.isLiveProvider(),
      data: result
    });
  } catch (err: any) {
    console.error('Error creating DOKU payment:', err.message);
    res.status(500).json({
      success: false,
      message: 'Pembayaran belum berhasil diinisiasi. Silakan coba lagi atau pilih metode pembayaran lain.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST /api/payments/doku/webhook - DOKU Webhook Notification
router.post('/doku/webhook', async (req: Request, res: Response) => {
  try {
    const provider = paymentService.getProvider();

    // Verify signature
    const isValid = provider.verifySignature(
      req.headers as Record<string, string | string[] | undefined>,
      JSON.stringify(req.body)
    );

    if (!isValid) {
      console.warn('[DOKU Webhook] Invalid signature rejected');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const parsed = provider.parseWebhook(req.body);
    const order = dataStore.getOrderByNumber(parsed.orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (parsed.status === 'PAID') {
      dataStore.updatePaymentStatus(order.orderNumber, 'PAID', 'Pembayaran terverifikasi via DOKU Webhook');

      // Trigger automatic Mengantar shipment creation if not yet generated
      if (!order.trackingNumber) {
        try {
          const shippingProvider = shippingService.getProvider();
          const shipment = await shippingProvider.createShipment({
            orderNumber: order.orderNumber,
            serviceCode: 'MGT-REG',
            recipientName: order.shippingAddress.recipientName,
            recipientPhone: order.shippingAddress.phone,
            fullAddress: order.shippingAddress.fullAddress,
            postalCode: order.shippingAddress.postalCode,
            subdistrict: order.shippingAddress.subdistrict,
            city: order.shippingAddress.city,
            province: order.shippingAddress.province,
            totalWeightGrams: 500,
            goodsValue: order.total
          });

          dataStore.setOrderTracking(order.orderNumber, shipment.trackingNumber, shipment.serviceName);
        } catch (shipErr: any) {
          console.error('[Webhook] Auto-shipment error:', shipErr.message);
        }
      }

      await notificationService.notify({
        type: 'PAYMENT_SUCCESSFUL',
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone,
        metadata: { amount: parsed.amount, paymentId: parsed.paymentId }
      });
    } else if (parsed.status === 'EXPIRED') {
      dataStore.updatePaymentStatus(order.orderNumber, 'EXPIRED', 'Pembayaran telah kadaluarsa');
      await notificationService.notify({
        type: 'PAYMENT_FAILED',
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone
      });
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ success: false, message: 'Internal webhook error' });
  }
});

// POST /api/payments/simulate - Simulation endpoint for demo testing in browser
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const { orderNumber, status } = req.body; // status: 'PAID' | 'EXPIRED' | 'FAILED'
    const order = dataStore.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status === 'PAID') {
      dataStore.updatePaymentStatus(order.orderNumber, 'PAID', 'Simulasi pembayaran DOKU berhasil');

      // Auto create shipment in demo mode
      if (!order.trackingNumber) {
        const shippingProvider = shippingService.getProvider();
        const shipment = await shippingProvider.createShipment({
          orderNumber: order.orderNumber,
          serviceCode: 'MGT-REG',
          recipientName: order.shippingAddress.recipientName,
          recipientPhone: order.shippingAddress.phone,
          fullAddress: order.shippingAddress.fullAddress,
          postalCode: order.shippingAddress.postalCode,
          subdistrict: order.shippingAddress.subdistrict,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          totalWeightGrams: 500,
          goodsValue: order.total
        });

        dataStore.setOrderTracking(order.orderNumber, shipment.trackingNumber, shipment.serviceName);
      }

      await notificationService.notify({
        type: 'PAYMENT_SUCCESSFUL',
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone
      });
    } else if (status === 'FAILED') {
      dataStore.updatePaymentStatus(order.orderNumber, 'FAILED', 'Simulasi pembayaran gagal');
    }

    const updated = dataStore.getOrderByNumber(orderNumber);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses simulasi pembayaran' });
  }
});

export default router;
