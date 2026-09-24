import { Router, Request, Response } from 'express';
import { shippingService } from '../providers/shipping/index.js';

const router = Router();

// GET /api/shipping/status - Provider connection status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: shippingService.getStatus()
  });
});

// POST /api/shipping/mengantar/rates - Calculate rates
router.post('/mengantar/rates', async (req: Request, res: Response) => {
  try {
    const {
      originPostalCode,
      destinationPostalCode,
      destinationProvince,
      destinationCity,
      destinationSubdistrict,
      weightInGrams
    } = req.body;

    if (!destinationProvince || !destinationCity) {
      return res.status(400).json({
        success: false,
        message: 'Provinsi dan Kota/Kabupaten tujuan wajib diisi untuk menghitung ongkir.'
      });
    }

    const provider = shippingService.getProvider();
    const rates = await provider.calculateRates({
      originPostalCode: originPostalCode || process.env.MENGANTAR_ORIGIN_POSTAL_CODE || '12430',
      destinationPostalCode: destinationPostalCode || '10110',
      destinationProvince,
      destinationCity,
      destinationSubdistrict: destinationSubdistrict || destinationCity,
      weightInGrams: Number(weightInGrams || 500)
    });

    res.json({
      success: true,
      provider: provider.name,
      isLive: shippingService.isLiveProvider(),
      data: rates
    });
  } catch (err: any) {
    console.error('Error calculating shipping rates:', err.message);
    res.status(500).json({
      success: false,
      message: 'Tarif pengiriman belum dapat diperoleh. Silakan coba beberapa saat lagi.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST /api/shipping/mengantar/create - Create shipment
router.post('/mengantar/create', async (req: Request, res: Response) => {
  try {
    const provider = shippingService.getProvider();
    const shipment = await provider.createShipment(req.body);
    res.json({
      success: true,
      data: shipment
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat pengiriman dengan kurir Mengantar',
      error: err.message
    });
  }
});

// GET /api/shipping/mengantar/track/:trackingNumber - Track shipment
router.get('/mengantar/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const provider = shippingService.getProvider();
    const tracking = await provider.trackShipment(trackingNumber);
    res.json({
      success: true,
      data: tracking
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal melacak nomor resi pengiriman.',
      error: err.message
    });
  }
});

export default router;
