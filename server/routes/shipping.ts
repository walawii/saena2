import { Router, Request, Response } from 'express';
import { shippingService } from '../providers/shipping/index.js';
import { orderRepository } from '../repositories/postgres/orderRepository.js';
import { webhookRepository } from '../repositories/postgres/webhookRepository.js';
import { getErrorMessage } from '../validators/formatError.js';
import { z } from 'zod';

const router = Router();

const ShippingRateSchema = z.object({
  destinationProvince: z.string().min(2, 'Provinsi tujuan wajib diisi'),
  destinationCity: z.string().min(2, 'Kota/Kabupaten tujuan wajib diisi'),
  destinationSubdistrict: z.string().min(2, 'Kecamatan tujuan wajib diisi'),
  destinationPostalCode: z.string().min(4, 'Kode pos tujuan minimal 4 karakter'),
  weightInGrams: z.number().int().min(10, 'Berat barang minimal 10 gram')
});

// GET /api/shipping/status - Mengantar Aggregator status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: shippingService.getStatus()
  });
});

// POST /api/shipping/calculate or /api/shipping/rates - Calculate live shipping rate
router.post(['/calculate', '/rates'], async (req: Request, res: Response) => {
  try {
    const parseResult = ShippingRateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const provider = shippingService.getProvider();
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Check if Mengantar is configured
    if (!provider.isConfigured()) {
      if (isProduction) {
        return res.status(503).json({
          success: false,
          isConfigured: false,
          error: 'SHIPPING_NOT_CONFIGURED',
          message: 'Layanan logistik Mengantar belum terkonfigurasi. MENGANTAR_API_KEY wajib diatur di environment produksi.'
        });
      }

      // Development / test fallback only
      return res.json({
        success: true,
        isConfigured: false,
        isDevelopmentFallback: true,
        warning: '[DEVELOPMENT ONLY] MENGANTAR_API_KEY belum dikonfigurasi. Menggunakan data simulasi pengiriman lokal.',
        data: [
          {
            provider: 'mengantar',
            courierCode: 'JNE',
            serviceCode: 'REG',
            serviceName: 'Mengantar - JNE Reguler',
            estimatedDays: '2-3 hari kerja',
            cost: 15000,
            description: 'Layanan reguler via agregator Mengantar (Dev Preview)'
          },
          {
            provider: 'mengantar',
            courierCode: 'SICEPAT',
            serviceCode: 'SIUNT',
            serviceName: 'Mengantar - SiCepat Untung',
            estimatedDays: '2-3 hari kerja',
            cost: 14000,
            description: 'Layanan hemat terpercaya (Dev Preview)'
          },
          {
            provider: 'mengantar',
            courierCode: 'JNT',
            serviceCode: 'EZ',
            serviceName: 'Mengantar - J&T EZ',
            estimatedDays: '1-2 hari kerja',
            cost: 18000,
            description: 'Pengiriman ekspres cepat (Dev Preview)'
          }
        ]
      });
    }

    // 2. Query official Mengantar API
    try {
      const rates = await provider.calculateRates({
        originPostalCode: process.env.MENGANTAR_ORIGIN_POSTAL || '12430',
        destinationPostalCode: parseResult.data.destinationPostalCode,
        destinationSubdistrict: parseResult.data.destinationSubdistrict,
        destinationCity: parseResult.data.destinationCity,
        destinationProvince: parseResult.data.destinationProvince,
        weightInGrams: parseResult.data.weightInGrams
      });

      return res.json({
        success: true,
        isConfigured: true,
        data: rates
      });
    } catch (apiErr: any) {
      console.error('[Mengantar Live Rate API Error]:', apiErr.message?.slice(0, 150));

      if (isProduction) {
        // In production: STRICTLY REJECT. Do not fake rates or allow unverified checkout.
        return res.status(502).json({
          success: false,
          isConfigured: true,
          error: 'MENGANTAR_API_UNAVAILABLE',
          message: apiErr.message || 'Gagal mengambil tarif resmi dari agregator logistik Mengantar. Silakan periksa kelengkapan alamat tujuan atau coba beberapa saat lagi.'
        });
      }

      // Development / Testing fallback when external API fails or is protected
      return res.json({
        success: true,
        isConfigured: false,
        isDevelopmentFallback: true,
        warning: '[DEVELOPMENT ONLY] Gagal menghubungi endpoint Mengantar eksternal, beralih ke estimasi tarif lokal untuk pengujian.',
        data: [
          {
            provider: 'mengantar',
            courierCode: 'JNE',
            serviceCode: 'REG',
            serviceName: 'Mengantar - JNE Reguler',
            estimatedDays: '2-3 hari kerja',
            cost: 15000,
            description: 'Layanan reguler via agregator Mengantar (Dev Fallback)'
          },
          {
            provider: 'mengantar',
            courierCode: 'SICEPAT',
            serviceCode: 'SIUNT',
            serviceName: 'Mengantar - SiCepat Untung',
            estimatedDays: '2-3 hari kerja',
            cost: 14000,
            description: 'Layanan hemat terpercaya (Dev Fallback)'
          },
          {
            provider: 'mengantar',
            courierCode: 'JNT',
            serviceCode: 'EZ',
            serviceName: 'Mengantar - J&T EZ',
            estimatedDays: '1-2 hari kerja',
            cost: 18000,
            description: 'Pengiriman ekspres cepat (Dev Fallback)'
          }
        ]
      });
    }
  } catch (err: any) {
    console.error('[Shipping Rate Route Error]:', err.message?.slice(0, 100));
    res.status(500).json({
      success: false,
      message: 'Gagal memproses perhitungan ongkos kirim. Silakan coba kembali.'
    });
  }
});

// GET /api/shipping/track/:trackingNumber - Track Mengantar shipment
router.get('/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const provider = shippingService.getProvider();

    if (!provider.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Layanan pelacakan resi belum terkonfigurasi. MENGANTAR_API_KEY belum disetel.'
      });
    }

    const trackingResult = await provider.trackShipment(trackingNumber);
    res.json({
      success: true,
      data: trackingResult
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal melacak nomor resi pengiriman'
    });
  }
});

// POST /api/shipping/mengantar/webhook - Mengantar Webhook for delivery events
router.post('/mengantar/webhook', async (req: Request, res: Response) => {
  try {
    const eventId = req.headers['x-mengantar-event-id'] as string || req.body?.event_id || `mgt_${Date.now()}`;
    const idempotencyKey = `mengantar_webhook_${eventId}`;

    const alreadyProcessed = await webhookRepository.isAlreadyProcessed(idempotencyKey);
    if (alreadyProcessed) {
      return res.status(200).json({ success: true, message: 'Event already processed' });
    }

    await webhookRepository.recordEvent({
      provider: 'MENGANTAR',
      eventId,
      eventType: req.body?.status || req.body?.event_type || 'SHIPMENT_UPDATE',
      idempotencyKey,
      payload: req.body
    });

    const waybill = req.body?.waybill_number || req.body?.tracking_number;
    const newStatus = (req.body?.status || '').toUpperCase();

    if (waybill) {
      if (newStatus === 'DELIVERED') {
        const order = await orderRepository.findByTrackingNumber(waybill);
        if (order && order.orderStatus !== 'DELIVERED') {
          await orderRepository.updateOrderStatus(order.orderNumber, 'DELIVERED', 'Paket berhasil diterima pelanggan (Mengantar Webhook)');
        }
      } else if (newStatus === 'ON_DELIVERY' || newStatus === 'SHIPPED') {
        const order = await orderRepository.findByTrackingNumber(waybill);
        if (order && order.orderStatus === 'PROCESSING') {
          await orderRepository.updateOrderStatus(order.orderNumber, 'SHIPPED', 'Paket dalam proses pengiriman kurir');
        }
      }
    }

    await webhookRepository.markProcessed(idempotencyKey, 'PROCESSED');
    res.status(200).json({ success: true, message: 'Mengantar webhook processed' });
  } catch (err: any) {
    console.error('[Mengantar Webhook Error]:', err.message);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default router;
