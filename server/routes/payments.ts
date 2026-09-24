import { Router, Request, Response } from 'express';
import { orderRepository } from '../repositories/postgres/orderRepository.js';
import { webhookRepository } from '../repositories/postgres/webhookRepository.js';
import { paymentService } from '../providers/payment/index.js';
import { shippingService } from '../providers/shipping/index.js';
import { notificationService } from '../services/notificationService.js';

const router = Router();

// GET /api/payments/status - Integration status check
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: paymentService.getStatus()
  });
});

// POST /api/payments/doku/webhook - Official DOKU Webhook Notification Endpoint
router.post('/doku/webhook', async (req: Request, res: Response) => {
  try {
    const provider = paymentService.getProvider();
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const rawBody = JSON.stringify(req.body);

    // 1. Verify DOKU cryptographic HMAC-SHA256 signature
    const isValidSignature = provider.verifySignature(headers, rawBody);
    if (!isValidSignature && provider.isConfigured()) {
      console.warn('[DOKU Webhook] Invalid signature rejected from IP:', req.ip);
      return res.status(401).json({ success: false, message: 'Invalid cryptographic signature' });
    }

    const parsed = provider.parseWebhook(req.body);
    const orderNumber = parsed.orderNumber;

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'Invalid payload: missing order number' });
    }

    // 2. Idempotency & Replay Attack Protection
    const requestId = (headers['request-id'] as string) || parsed.paymentId;
    const idempotencyKey = `doku_${orderNumber}_${parsed.status}_${requestId}`;

    const alreadyProcessed = await webhookRepository.isAlreadyProcessed(idempotencyKey);
    if (alreadyProcessed) {
      console.log(`[DOKU Webhook] Idempotent skip: ${idempotencyKey} already processed`);
      return res.status(200).json({ success: true, message: 'Notification already processed' });
    }

    // Record incoming webhook event
    await webhookRepository.recordEvent({
      provider: 'DOKU',
      eventId: requestId,
      eventType: `PAYMENT_${parsed.status}`,
      idempotencyKey,
      payload: req.body
    });

    // 3. Process payment status transition
    const order = await orderRepository.getOrderByNumber(orderNumber);
    if (!order) {
      console.warn(`[DOKU Webhook] Order not found for notification: ${orderNumber}`);
      await webhookRepository.markProcessed(idempotencyKey, 'FAILED', `Order not found: ${orderNumber}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (parsed.status === 'PAID') {
      // Transition order to PAID (deducts stock and releases reservation in PostgreSQL transaction)
      if (order.orderStatus === 'PENDING_PAYMENT') {
        await orderRepository.updateOrderStatus(
          order.orderNumber,
          'PAID',
          `Pembayaran berhasil diverifikasi resmi via DOKU Webhook (Trx: ${parsed.paymentId})`
        );

        // Auto-create Mengantar shipment if shipping provider is configured
        const shippingProvider = shippingService.getProvider();
        if (shippingProvider.isConfigured()) {
          try {
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

            await orderRepository.setOrderTracking(order.orderNumber, shipment.trackingNumber, shipment.serviceName);
          } catch (shipErr: any) {
            console.error('[DOKU Webhook] Mengantar auto-shipment creation notice:', shipErr.message);
          }
        }

        // Notify customer
        await notificationService.notify({
          type: 'PAYMENT_SUCCESSFUL',
          orderNumber: order.orderNumber,
          customerEmail: order.customer.email,
          customerPhone: order.customer.phone,
          metadata: { amount: parsed.amount, paymentId: parsed.paymentId }
        });
      }
    } else if (parsed.status === 'EXPIRED') {
      if (order.orderStatus === 'PENDING_PAYMENT') {
        await orderRepository.updateOrderStatus(
          order.orderNumber,
          'EXPIRED',
          'Batas waktu pembayaran DOKU telah berakhir'
        );

        await notificationService.notify({
          type: 'PAYMENT_FAILED',
          orderNumber: order.orderNumber,
          customerEmail: order.customer.email,
          customerPhone: order.customer.phone
        });
      }
    }

    await webhookRepository.markProcessed(idempotencyKey, 'PROCESSED');
    res.status(200).json({ success: true, message: 'Webhook notification successfully processed' });
  } catch (err: any) {
    console.error('[DOKU Webhook Fatal Error]:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error processing webhook' });
  }
});

export default router;
